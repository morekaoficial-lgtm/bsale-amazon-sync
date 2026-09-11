import { Router, Request, Response } from 'express';
import { SyncService } from '../services/syncService';
import { BsaleWebhookPayload } from '../types';
import { apiLogger } from '../services/apiLogger';

const router = Router();
const syncService = new SyncService();

// ============================================
// Health Check
// ============================================
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'bsale-amazon-sync',
    version: '1.0.0',
    mode: 'webhook-only',
    timestamp: new Date().toISOString(),
    syncStatus: syncService.getStatus(),
  });
});

// ============================================
// Webhook de BSale
// ============================================
router.post('/bsale', async (req: Request, res: Response) => {
  try {
    const payload = req.body as BsaleWebhookPayload;
    console.log('[Webhook] BSale webhook recibido:', JSON.stringify(payload));
    res.status(200).json({ received: true, processing: true });
    
    const results = await syncService.handleBsaleWebhook(payload);
    
    if (results.length > 0) {
      const successCount = results.filter(r => r.success).length;
      console.log(`[Webhook] Venta sincronizada: ${successCount}/${results.length} SKUs actualizados`);
    }
  } catch (error) {
    console.error('[Webhook] Error procesando webhook:', (error as Error).message);
  }
});

// ============================================
// Sincronización manual
// ============================================

router.post('/sync/all', async (_req: Request, res: Response) => {
  try {
    res.status(202).json({ 
      message: 'Sincronización iniciada',
      status: 'processing',
    });
    
    const log = await syncService.syncAllInventory();
    console.log('[Sync] Sincronización completa finalizada:', log);
  } catch (error) {
    console.error('[Sync] Error:', (error as Error).message);
  }
});

router.post('/sync/sku/:sku', async (req: Request, res: Response) => {
  try {
    const sku = req.params.sku;
    const result = await syncService.syncSingleSku(sku);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
      sku: req.params.sku,
    });
  }
});

// ============================================
// Logs y estado
// ============================================

router.get('/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string || '10', 10);
  res.json(syncService.getLogs(limit));
});

router.get('/status', (_req: Request, res: Response) => {
  res.json(syncService.getStatus());
});

// ============================================
// Dashboard API — llamadas API
// ============================================

router.get('/api-calls', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string || '100', 10);
  const service = req.query.service as string | undefined;
  const status = req.query.status as string | undefined;
  res.json(apiLogger.getLogs(limit, { service, status }));
});

router.get('/api-calls/stats', (_req: Request, res: Response) => {
  res.json(apiLogger.getStats());
});

router.delete('/api-calls', (_req: Request, res: Response) => {
  apiLogger.clear();
  res.json({ cleared: true });
});

export default router;
