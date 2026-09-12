import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import webhookRoutes, { setSyncService } from './routes/webhooks';
import { SyncService } from './services/syncService';
import { config } from './config';
import { apiLogger } from './services/apiLogger';

const app = express();
const syncService = new SyncService();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del dashboard
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Compartir la misma instancia de SyncService con las rutas
setSyncService(syncService);

// API Routes
app.use('/api/webhook', webhookRoutes);

// Dashboard API - datos en tiempo real
app.get('/api/dashboard/stats', (_req: Request, res: Response) => {
  const status = syncService.getStatus();
  const logs = syncService.getLogs(5);
  const apiStats = apiLogger.getStats();
  
  res.json({
    status: 'ok',
    service: 'BSale ↔ Amazon Sync',
    version: '1.0.0',
    sync: status,
    recentLogs: logs,
    apiStats,
    config: {
      marketplace: config.amazon.marketplaceId,
      autoSync: config.sync.intervalMinutes > 0 ? `${config.sync.intervalMinutes} min` : 'Off',
      bsaleOffice: config.bsale.officeId,
    },
  });
});

// Obtener progreso de sincronización en tiempo real
app.get('/api/dashboard/sync/progress', (_req: Request, res: Response) => {
  const status = syncService.getStatus();
  res.json({
    isRunning: status.isRunning,
    progress: status.progress,
    lastSync: status.lastSync,
    totalSyncs: status.totalSyncs,
  });
});

// Sync single SKU from dashboard
app.post('/api/dashboard/sync/sku', async (req: Request, res: Response) => {
  try {
    const { sku } = req.body;
    if (!sku) {
      res.status(400).json({ error: 'SKU requerido' });
      return;
    }
    const result = await syncService.syncSingleSku(sku);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Sync all from dashboard
app.post('/api/dashboard/sync/all', async (_req: Request, res: Response) => {
  try {
    res.status(202).json({ message: 'Sincronización masiva iniciada' });
    await syncService.syncAllInventory();
  } catch (error) {
    console.error('[Dashboard] Error sync all:', (error as Error).message);
  }
});

// Root endpoint - serve dashboard
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.stack);
  res.status(500).json({ error: err.message });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           BSale ↔ Amazon Sync — Servidor Iniciado            ║
╠══════════════════════════════════════════════════════════════╣
║  Puerto:     ${PORT.toString().padEnd(51)} ║
║  Modo:       ${config.server.nodeEnv.padEnd(51)} ║
║  Dashboard:  http://localhost:${PORT.toString().padEnd(41)} ║
║  Health:     http://localhost:${PORT}/api/webhook/health${' '.repeat(20)}║
╠══════════════════════════════════════════════════════════════╣
║  BSale:      ${(config.bsale.baseUrl || 'NO CONFIGURADO').padEnd(51)} ║
║  Amazon:     ${(config.amazon.marketplaceId || 'NO CONFIGURADO').padEnd(51)} ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  syncService.startAutoSync();
});
