# Proyecto: BSale ↔ Amazon Sync

## Descripción
Sincronización de inventario entre BSale (ERP) y Amazon Seller Central via SP-API.

## Estado
🆕 Creado el 2026-09-10 — Pendiente: obtener credenciales Amazon + BSale, deploy en DigitalOcean

## Estructura
- `src/services/bsaleService.ts` — Cliente BSale API
- `src/services/amazonService.ts` — Cliente Amazon SP-API
- `src/services/syncService.ts` — Orquestador de sincronización
- `src/routes/webhooks.ts` — Endpoints Express
- `src/app.ts` — Servidor principal

## Pasos para completar
1. Obtener credenciales BSale (token + officeId)
2. Obtener credenciales Amazon SP-API:
   - LWA Client ID/Secret
   - Refresh Token
   - Marketplace ID
3. Configurar .env
4. Probar sincronización manual
5. Configurar webhook en BSale
6. Deploy a DigitalOcean
7. Configurar Nginx + SSL

## Para retomar
Buscar: **"BSALE-AMAZON-SYNC"**
