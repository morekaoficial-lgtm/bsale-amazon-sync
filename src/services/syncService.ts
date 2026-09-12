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
   * Procesa en lotes de 10 para mostrar progreso en tiempo real
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
        currentSku: 'Obteniendo productos de BSale...',
        startedAt: new Date().toISOString(),
      };

      // 2. Preparar items válidos (con SKU)
      this.currentProgress!.currentSku = 'Filtrando productos válidos...';
      
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

      // Si no hay items válidos, terminar inmediatamente
      if (itemsToSync.length === 0) {
        this.currentProgress!.currentSku = 'No hay productos válidos para sincronizar';
        this.currentProgress!.processed = 0;
        log.finishedAt = new Date().toISOString();
        this.logs.push(log);
        console.log('[SyncService] Sin productos válidos para sincronizar');
        return log;
      }

      // 3. Procesar en lotes de 10 con progreso en tiempo real
      const BATCH_SIZE = 10;
      const totalItems = itemsToSync.length;
      
      console.log(`[SyncService] Procesando ${totalItems} SKU(s) en lotes de ${BATCH_SIZE}...`);
      
      this.currentProgress!.total = totalItems;
      this.currentProgress!.currentSku = `Procesando 0/${totalItems} productos...`;

      for (let i = 0; i < totalItems; i += BATCH_SIZE) {
        const batch = itemsToSync.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalItems / BATCH_SIZE);
        
        this.currentProgress!.currentSku = `Lote ${batchNum}/${totalBatches}: ${batch[0].sku}...`;
        console.log(`[SyncService] Lote ${batchNum}/${totalBatches}: ${batch.length} productos`);

        // Procesar cada SKU del lote
        for (const item of batch) {
          try {
            const success = await this.amazon.updateInventory(item.sku, item.quantity);
            
            if (success) {
              log.successCount++;
              this.currentProgress!.success++;
              log.results.push({
                bsaleSku: item.sku,
                amazonSku: item.sku,
                bsaleStock: item.quantity,
                amazonStockUpdated: item.quantity,
                success: true,
                timestamp: new Date().toISOString(),
              });
            } else {
              log.errorCount++;
              this.currentProgress!.errors++;
              log.results.push({
                bsaleSku: item.sku,
                amazonSku: item.sku,
                bsaleStock: item.quantity,
                amazonStockUpdated: 0,
                success: false,
                error: 'Error actualizando en Amazon',
                timestamp: new Date().toISOString(),
              });
            }
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
          }
          
          // Pequeño delay entre productos para no sobrecargar la API
          await new Promise(r => setTimeout(r, 300));
        }
        
        // Actualizar progreso después de cada lote
        this.currentProgress!.processed = Math.min(i + BATCH_SIZE, totalItems);
        const pct = Math.round((this.currentProgress!.processed / totalItems) * 100);
        this.currentProgress!.currentSku = `Lote ${batchNum}/${totalBatches} completado (${pct}%)`;
        
        console.log(`[SyncService] Progreso: ${this.currentProgress!.processed}/${totalItems} (${pct}%)`);
        
        // Delay entre lotes
        if (i + BATCH_SIZE < totalItems) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      this.currentProgress!.currentSku = `✅ Completado: ${log.successCount} éxitos, ${log.errorCount} errores`;

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
