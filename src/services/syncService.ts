import { BsaleService } from './bsaleService';
import { AmazonService } from './amazonService';
import { AmazonFeedService } from './amazonFeedService';
import { SyncLog, SyncResult, BsaleWebhookPayload } from '../types';
import { config } from '../config';

/**
 * Servicio de sincronización entre BSale y Amazon
 * Orquesta el flujo: BSale (source of truth) → Amazon
 */
export class SyncService {
  private bsale: BsaleService;
  private amazon: AmazonService;
  private amazonFeed: AmazonFeedService;
  private logs: SyncLog[] = [];
  private isRunning = false;
  private currentProgress: {
    total: number;
    processed: number;
    success: number;
    errors: number;
    currentSku?: string;
    startedAt: string;
  } | null = null;

  constructor() {
    this.bsale = new BsaleService();
    this.amazon = new AmazonService();
    this.amazonFeed = new AmazonFeedService();
  }

  /**
   * Sincronizar TODO el inventario de BSale a Amazon
   * Usa Amazon Feeds API para enviar múltiples SKUs en un solo XML
   * MUCHO más rápido que llamadas individuales
   */
  async syncAllInventory(): Promise<SyncLog> {
    if (this.isRunning) {
      throw new Error('Ya hay una sincronización en progreso');
    }

    this.isRunning = true;
    const log: SyncLog = {
      id: `sync-${Date.now()}`,
      startedAt: new Date().toISOString(),
      totalProducts: 0,
      successCount: 0,
      errorCount: 0,
      results: [],
      triggeredBy: 'manual',
    };

    try {
      console.log('[SyncService] Iniciando sincronización completa vía Feeds API...');

      // 1. Obtener todas las variantes con stock de BSale
      const variants = await this.bsale.getVariantsWithStock(200);
      log.totalProducts = variants.length;

      console.log(`[SyncService] ${variants.length} variantes encontradas en BSale`);

      // Inicializar progreso
      this.currentProgress = {
        total: variants.length,
        processed: 0,
        success: 0,
        errors: 0,
        startedAt: new Date().toISOString(),
      };

      // 2. Preparar items válidos (con SKU)
      const itemsToSync: Array<{ sku: string; quantity: number }> = [];
      let skippedCount = 0;

      for (const variant of variants) {
        const bsaleSku = variant.code;
        const stock = variant.stock?.[0]?.quantityAvailable || 0;

        if (!bsaleSku || bsaleSku.trim() === '') {
          skippedCount++;
          log.results.push({
            bsaleSku: `(sin SKU) ID:${variant.id}`,
            amazonSku: '-',
            bsaleStock: stock,
            amazonStockUpdated: 0,
            success: false,
            error: 'Variante sin SKU en BSale',
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        itemsToSync.push({ sku: bsaleSku, quantity: stock });
      }

      if (skippedCount > 0) {
        console.log(`[SyncService] ${skippedCount} variantes sin SKU fueron saltadas`);
      }

      // 3. Enviar TODO en un solo feed masivo
      if (itemsToSync.length > 0) {
        console.log(`[SyncService] Enviando ${itemsToSync.length} SKU(s) en feed masivo a Amazon...`);
        
        this.currentProgress!.total = itemsToSync.length;
        this.currentProgress!.currentSku = `Enviando feed masivo (${itemsToSync.length} items)...`;

        const feedResult = await this.amazonFeed.updateInventoryBulk(itemsToSync);

        if (feedResult.success) {
          log.successCount = itemsToSync.length;
          this.currentProgress!.success = itemsToSync.length;
          this.currentProgress!.processed = itemsToSync.length;
          
          // Agregar resultados individuales genéricos
          for (const item of itemsToSync) {
            log.results.push({
              bsaleSku: item.sku,
              amazonSku: item.sku,
              bsaleStock: item.quantity,
              amazonStockUpdated: item.quantity,
              success: true,
              timestamp: new Date().toISOString(),
            });
          }
          
          console.log(`[SyncService] Feed masivo enviado: ${feedResult.message} (FeedID: ${feedResult.feedId})`);
        } else {
          log.errorCount = itemsToSync.length;
          this.currentProgress!.errors = itemsToSync.length;
          this.currentProgress!.processed = itemsToSync.length;
          
          for (const item of itemsToSync) {
            log.results.push({
              bsaleSku: item.sku,
              amazonSku: item.sku,
              bsaleStock: item.quantity,
              amazonStockUpdated: 0,
              success: false,
              error: feedResult.message,
              timestamp: new Date().toISOString(),
            });
          }
          
          console.error(`[SyncService] Feed masivo falló: ${feedResult.message}`);
        }
      }

      log.finishedAt = new Date().toISOString();
      this.logs.push(log);

      console.log(`[SyncService] Sincronización completada: ${log.successCount} éxitos, ${log.errorCount} errores`);
      return log;
    } finally {
      this.isRunning = false;
      this.currentProgress = null;
    }
  }

  /**
   * Sincronizar un solo SKU (útil para webhooks)
   * Mantiene llamada individual para obtener productType correcto
   */
  async syncSingleSku(bsaleSku: string): Promise<SyncResult> {
    console.log(`[SyncService] Sincronizando SKU: ${bsaleSku}`);

    if (!bsaleSku || bsaleSku.trim() === '') {
      console.warn('[SyncService] SKU vacío. No se puede sincronizar.');
      return {
        bsaleSku: '(vacío)',
        amazonSku: '-',
        bsaleStock: 0,
        amazonStockUpdated: 0,
        success: false,
        error: 'SKU vacío',
        timestamp: new Date().toISOString(),
      };
    }

    const stock = await this.bsale.getStockBySku(bsaleSku);
    const amazonSku = bsaleSku;

    const success = await this.amazon.updateInventory(amazonSku, stock);

    const result: SyncResult = {
      bsaleSku,
      amazonSku,
      bsaleStock: stock,
      amazonStockUpdated: stock,
      success,
      timestamp: new Date().toISOString(),
      error: success ? undefined : 'Error actualizando en Amazon',
    };

    console.log(`[SyncService] SKU ${bsaleSku}: stock=${stock}, success=${success}`);
    return result;
  }

  /**
   * Procesar webhook de BSale
   * Sincroniza TODOS los SKUs afectados por la venta/documento
   */
  async handleBsaleWebhook(payload: BsaleWebhookPayload): Promise<SyncResult[]> {
    console.log('[SyncService] Procesando webhook de BSale...');

    const stockInfos = await this.bsale.processWebhook(payload);
    if (!stockInfos || stockInfos.length === 0) {
      console.log('[SyncService] Webhook no requiere acción');
      return [];
    }

    // Sincronizar cada SKU afectado por la venta
    const results: SyncResult[] = [];
    for (const stockInfo of stockInfos) {
      try {
        const result = await this.syncSingleSku(stockInfo.sku);
        results.push(result);
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        results.push({
          bsaleSku: stockInfo.sku,
          amazonSku: stockInfo.sku,
          bsaleStock: stockInfo.stock,
          amazonStockUpdated: 0,
          success: false,
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Obtener logs de sincronización
   */
  getLogs(limit: number = 10): SyncLog[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Obtener estado de sincronización
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.logs.length > 0 ? this.logs[this.logs.length - 1].startedAt : null,
      totalSyncs: this.logs.length,
      progress: this.currentProgress,
    };
  }

  /**
   * Iniciar sincronización automática periódica
   * DESACTIVADO: Solo sincronización por webhook de ventas BSale
   */
  startAutoSync(): void {
    console.log('[SyncService] Auto-sync desactivado. Solo webhook de ventas BSale.');
  }
}
