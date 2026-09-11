import { BsaleService } from './bsaleService';
import { AmazonService } from './amazonService';
import { SyncLog, SyncResult, BsaleWebhookPayload } from '../types';
import { config } from '../config';

/**
 * Servicio de sincronización entre BSale y Amazon
 * Orquesta el flujo: BSale (source of truth) → Amazon
 */
export class SyncService {
  private bsale: BsaleService;
  private amazon: AmazonService;
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
  }

  /**
   * Sincronizar TODO el inventario de BSale a Amazon
   * Útil para sincronización inicial o forzada
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
      console.log('[SyncService] Iniciando sincronización completa...');

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

      // 2. Preparar items para enviar en UN SOLO feed a Amazon
      const itemsToSync: Array<{ sku: string; quantity: number }> = [];
      let skippedCount = 0;

      for (const variant of variants) {
        const bsaleSku = variant.code;
        const stock = variant.stock?.[0]?.quantityAvailable || 0;

        // Saltar variantes sin SKU
        if (!bsaleSku || bsaleSku.trim() === '') {
          console.warn(`[SyncService] Variante ID ${variant.id} sin SKU. Saltando.`);
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

      this.currentProgress!.total = itemsToSync.length;

      // 3. Actualizar cada SKU en Amazon (uno por uno para obtener productType correcto)
      if (itemsToSync.length > 0) {
        console.log(`[SyncService] Actualizando ${itemsToSync.length} SKU(s) en Amazon...`);

        for (const item of itemsToSync) {
          this.currentProgress!.currentSku = item.sku;
          
          try {
            const success = await this.amazon.updateInventory(item.sku, item.quantity);

            if (success) {
              log.successCount++;
              this.currentProgress!.success++;
            } else {
              log.errorCount++;
              this.currentProgress!.errors++;
            }

            log.results.push({
              bsaleSku: item.sku,
              amazonSku: item.sku,
              bsaleStock: item.quantity,
              amazonStockUpdated: success ? item.quantity : 0,
              success,
              error: success ? undefined : 'Error actualizando en Amazon',
              timestamp: new Date().toISOString(),
            });

            this.currentProgress!.processed++;

            // Rate limiting entre requests
            await new Promise(r => setTimeout(r, 800));
          } catch (error) {
            log.errorCount++;
            this.currentProgress!.errors++;
            log.results.push({
              bsaleSku: item.sku,
              amazonSku: item.sku,
              bsaleStock: item.quantity,
              amazonStockUpdated: 0,
              success: false,
              error: (error as Error).message,
              timestamp: new Date().toISOString(),
            });
            this.currentProgress!.processed++;
          }
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
   */
  async syncSingleSku(bsaleSku: string): Promise<SyncResult> {
    console.log(`[SyncService] Sincronizando SKU: ${bsaleSku}`);

    // Validar SKU
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
    const amazonSku = bsaleSku; // o mapear si difieren

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
        // Rate limiting entre requests
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
