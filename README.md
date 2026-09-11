# BSale ↔ Amazon Sync

Sincronización de inventario **BSale → Amazon México** mediante webhooks. 

> ⚡ **Solo sincroniza cuando hay ventas en BSale** — no usa intervalos de tiempo.

## Cómo funciona

1. Se hace una venta en BSale (POS / boleta / factura)
2. BSale envía webhook a este servicio
3. El servicio lee el stock actual de cada producto vendido
4. Actualiza el inventario en Amazon SP-API

## Requisitos

- Node.js 20+
- PM2 (para producción)
- Cuenta BSale con API activada
- Cuenta Amazon Seller Central con SP-API autorizada

## Deploy rápido en DigitalOcean

### 1. Verificar puertos libres

```bash
ss -tlnp | grep LISTEN
```

Puertos que YA están ocupados en tu droplet:
- `3001` — otro servicio
- `3005` — shopify-product-migrator  
- `8765` — python3
- `5432` — postgres

Este servicio usa el puerto **`3004`** (libre).

### 2. Copiar y pegar en consola DigitalOcean

```bash
# Crear directorio y clonar
cd /opt
git clone https://github.com/morekaoficial-lgtm/bsale-amazon-sync.git
cd bsale-amazon-sync

# Instalar dependencias
npm install

# Compilar
npm run build

# Crear archivo .env
cat > .env << 'EOF'
PORT=3004
NODE_ENV=production
BSALE_API_TOKEN=TU_TOKEN_BSALE_AQUI
BSALE_BASE_URL=https://api.bsale.io/v1
BSALE_OFFICE_ID=1
AMAZON_LWA_CLIENT_ID=amzn1.application-oa2-client.76ef3e242d92441080c2b0bcdc0d87b1
AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.v1.8c6853f325fc9e0d304327c73bff26d6fae592efa234223da20e6a5932800649
AMAZON_REFRESH_TOKEN=COPIA_EL_REFRESH_TOKEN_ACTUAL_AQUI
AMAZON_MARKETPLACE_ID=A1AM78C64UM0Y8
SYNC_INTERVAL_MINUTES=0
STOCK_THRESHOLD=0
EOF

# ⚠️ EDITA EL .env con tu token real de BSale y el refresh token de Amazon
nano .env

# Crear logs
mkdir -p logs

# Instalar PM2 si no lo tienes
npm install -g pm2

# Iniciar
pm2 start pm2.config.js
pm2 save
pm2 startup systemd
```

### 3. Verificar que funciona

```bash
curl http://localhost:3004/api/webhook/health
```

Debe responder:
```json
{
  "status": "ok",
  "service": "bsale-amazon-sync",
  "mode": "webhook-only"
}
```

### 4. Configurar webhook en BSale

En tu panel de BSale:
1. Ve a **Configuración → Integraciones → Webhooks**
2. Agrega un nuevo webhook:
   - **URL**: `http://TU_IP_DEL_DROPLET:3004/api/webhook/bsale`
   - **Eventos**: `document` (ventas), `stock` (cambios de stock)
3. Guarda

### 5. Dashboard

Abre en navegador:
```
http://TU_IP_DEL_DROPLET:3004
```

## Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Dashboard visual |
| GET | `/api/webhook/health` | Health check |
| POST | `/api/webhook/bsale` | Webhook de BSale |
| POST | `/api/webhook/sync/sku/:sku` | Sincronizar un SKU manual |
| POST | `/api/webhook/sync/all` | Sincronizar todo (manual) |
| GET | `/api/webhook/logs` | Ver logs |
| GET | `/api/webhook/status` | Estado del servicio |
| GET | `/api/dashboard/stats` | Stats para el dashboard |

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3004` |
| `BSALE_API_TOKEN` | Token de API de BSale | `abc123...` |
| `BSALE_OFFICE_ID` | ID de sucursal en BSale | `1` |
| `AMAZON_REFRESH_TOKEN` | Refresh token de Amazon | `Atzr\|IwEB...` |
| `AMAZON_MARKETPLACE_ID` | Marketplace ID | `A1AM78C64UM0Y8` (MX) |

## Comandos PM2

```bash
pm2 status                    # Ver estado
pm2 logs bsale-amazon-sync    # Ver logs en tiempo real
pm2 restart bsale-amazon-sync # Reiniciar
pm2 stop bsale-amazon-sync    # Detener
pm2 delete bsale-amazon-sync  # Eliminar de PM2
```

## Arquitectura

```
Venta en BSale
     │
     ▼
Webhook → POST /api/webhook/bsale
     │
     ▼
Lee stock actual de cada SKU vendido
     │
     ▼
Actualiza en Amazon SP-API
     │
     ▼
Dashboard muestra resultado
```

## Solución de problemas

### Error 403 en Amazon
Regenera el refresh token desde Seller Central:
1. Apps & Services → Develop Apps
2. Tu app "Inventario" → Authorize
3. Copia el nuevo refresh token al `.env`
4. `pm2 restart bsale-amazon-sync`

### Webhook no llega
Verifica que el puerto 3004 esté abierto en el firewall:
```bash
ufw allow 3004
```

### SKU no encontrado en BSale
Asegúrate de que el código de variante en BSale coincida con el SKU en Amazon.
