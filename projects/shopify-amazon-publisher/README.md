# Shopify → Amazon Publisher

Publicar productos de **Shopify** a **Amazon México** usando IA para completar campos faltantes.

## Fases

### Fase 1: Prueba Local ✅
- [ ] Configurar credenciales Shopify
- [ ] Configurar credenciales Amazon SP-API
- [ ] Probar con 1 producto
- [ ] Verificar que se publique correctamente

### Fase 2: Deploy en Droplet
- [ ] Puerto separado (3007)
- [ ] No afectar otros servicios
- [ ] PM2 configurado

## Credenciales Necesarias

### Shopify (Admin API)
1. Ve a tu admin de Shopify → Apps → Desarrollar apps
2. Crea una app privada
3. Habilita permisos: `read_products`, `read_inventory`
4. Genera **Admin API access token**

### Amazon SP-API
Usar las mismas credenciales que `bsale-amazon-sync`:
- LWA Client ID
- LWA Client Secret  
- Refresh Token
- Marketplace ID (A1AM78C64UM0Y8 = México)

### OpenAI (Opcional)
- API Key para generar contenido con IA

## Variables de Entorno

```bash
SHOPIFY_STORE_DOMAIN=tu-tienda.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxx
AMAZON_LWA_CLIENT_ID=xxx
AMAZON_LWA_CLIENT_SECRET=xxx
AMAZON_REFRESH_TOKEN=xxx
OPENAI_API_KEY=sk-xxx
```

## Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | Listar productos de Shopify |
| POST | `/api/publish` | Publicar producto en Amazon |
