# Instrucciones de Deploy - BSale ↔ Amazon Sync

## 📋 Requisitos Previos

- Acceso a la consola web de DigitalOcean
- Credenciales de BSale y Amazon SP-API
- Un puerto disponible en tu droplet (ej: 3005, 3006, etc.)

---

## 🚀 Paso 1: Acceder al Droplet

1. Ve a [DigitalOcean Console](https://cloud.digitalocean.com/)
2. Selecciona tu droplet
3. Haz clic en **"Console"** (botón negro arriba a la derecha)
4. Se abrirá una terminal dentro del servidor

---

## 🚀 Paso 2: Verificar qué puertos están ocupados

En la consola del droplet, ejecuta:

```bash
# Ver procesos de Node.js corriendo
pm2 list

# Ver qué puertos están en uso
ss -tlnp | grep LISTEN

# O con netstat
netstat -tlnp 2>/dev/null || ss -tlnp
```

**Anota los puertos que YA están ocupados.** Necesitas elegir uno libre para este servicio.

---

## 🚀 Paso 3: Crear directorio del proyecto

```bash
# Elegir un puerto libre (ejemplo: 3005)
# Si 3005 está ocupado, usa 3006, 3007, etc.

# Crear directorio
mkdir -p /var/www/bsale-amazon-sync
cd /var/www/bsale-amazon-sync
```

---

## 🚀 Paso 4: Subir archivos al servidor

Hay dos formas de hacerlo:

### Opción A: Subir vía SCP (desde tu computadora local)

En tu computadora local (Mac/Linux), abre Terminal:

```bash
# Reemplaza IP con la IP de tu droplet
scp -r /ruta/a/bsale-amazon-sync/* root@TU_IP:/var/www/bsale-amazon-sync/
```

### Opción B: Subir vía wget/curl (si tienes un link directo)

En la consola del droplet:

```bash
cd /var/www/bsale-amazon-sync

# Si subiste el ZIP a algún servidor temporal
wget URL_DEL_ZIP
unzip bsale-amazon-sync.zip
mv bsale-amazon-sync/* .
rm -rf bsale-amazon-sync bsale-amazon-sync.zip
```

### Opción C: Copiar y pegar archivos

Si no tienes acceso SCP, puedes:
1. En tu computadora, abre los archivos `.ts`
2. Copia el contenido
3. En la consola de DigitalOcean, usa `nano` para crear cada archivo:

```bash
nano src/app.ts
# Pega el contenido y guarda (Ctrl+X, Y, Enter)
```

---

## 🚀 Paso 5: Instalar dependencias y compilar

En la consola del droplet:

```bash
cd /var/www/bsale-amazon-sync

# Verificar que Node.js esté instalado
node -v
# Debe decir v20.x.x o superior

# Si no está instalado o es versión antigua:
# curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
# apt-get install -y nodejs

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

---

## 🚀 Paso 6: Configurar variables de entorno (.env)

```bash
cd /var/www/bsale-amazon-sync
nano .env
```

Pega el siguiente contenido (REEMPLAZA los valores ??? con tus credenciales reales):

```env
# ============================================
# SERVIDOR
# ============================================
PORT=3005
NODE_ENV=production

# ============================================
# BSALE API
# ============================================
BSALE_API_TOKEN=TU_TOKEN_BSALE_AQUI
BSALE_BASE_URL=https://api.bsale.io/v1
BSALE_OFFICE_ID=2

# ============================================
# AMAZON SP-API
# ============================================
# NOTA: Desde octubre 2023, SP-API ya NO requiere AWS IAM.
# Solo necesitas LWA (Login with Amazon) credentials.
AMAZON_LWA_CLIENT_ID=TU_CLIENT_ID_AQUI
AMAZON_LWA_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
AMAZON_REFRESH_TOKEN=TU_REFRESH_TOKEN_AQUI
AMAZON_MARKETPLACE_ID=A1AM78C64UM0Y8

# ============================================
# SYNC CONFIG
# ============================================
SYNC_INTERVAL_MINUTES=30
STOCK_THRESHOLD=0
```

**Guarda:** Ctrl+X, luego Y, luego Enter

---

## 🚀 Paso 7: Instalar PM2 (si no está instalado)

```bash
# Verificar si PM2 está instalado
pm2 -v

# Si no está instalado:
npm install -g pm2

# Configurar PM2 para iniciar automáticamente
pm2 startup
# Copia el comando que te da y ejecútalo (necesita sudo)
```

---

## 🚀 Paso 8: Iniciar el servicio

```bash
cd /var/www/bsale-amazon-sync

# Iniciar con PM2 en el puerto configurado
pm2 start dist/app.js --name bsale-amazon-sync

# Verificar que está corriendo
pm2 list
pm2 logs bsale-amazon-sync

# Guardar configuración para que inicie automáticamente
pm2 save
```

Deberías ver algo como:
```
┌────┬─────────────────────┬────────┬───┬──────┬───────────┐
│ id │ name                │ mode   │ ↺ │ status │ cpu  │ mem  │
├────┼─────────────────────┼────────┼───┼──────┼───────────┤
│ 0  │ bsale-amazon-sync   │ fork   │ 0 │ online │ 0%   │ 50mb │
└────┴─────────────────────┴────────┴───┴──────┴───────────┘
```

---

## 🚀 Paso 9: Verificar que funciona

```bash
# Desde el mismo servidor
curl http://localhost:3005/

# O desde tu computadora (reemplaza IP)
curl http://TU_IP:3005/
```

Deberías ver:
```json
{
  "service": "BSale ↔ Amazon Sync",
  "version": "1.0.0",
  "status": "running"
}
```

---

## 🚀 Paso 10: Configurar Webhook en BSale

1. Ve a tu panel de BSale → **Integraciones → Webhooks**
2. Crea un nuevo webhook:
   - **URL**: `http://TU_IP:3005/webhook/bsale`
   - **Topics**: `stock` y `document`
   - **Método**: `POST`
3. Guarda y prueba enviando un evento de prueba

---

## 🚀 Paso 11: (Opcional) Configurar Nginx + SSL

Si quieres usar un dominio con HTTPS:

```bash
# Instalar Nginx si no está
apt-get install -y nginx certbot python3-certbot-nginx

# Crear configuración
cat > /etc/nginx/sites-available/bsale-amazon-sync << 'EOF'
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/bsale-amazon-sync /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Configurar SSL
certbot --nginx -d tu-dominio.com
```

---

## 📡 Endpoints disponibles

| Endpoint | Descripción |
|----------|-------------|
| `GET /` | Info del servicio |
| `GET /webhook/health` | Health check |
| `POST /webhook/bsale` | Recibe webhooks de BSale |
| `POST /webhook/sync/all` | Sincronizar TODO el inventario |
| `POST /webhook/sync/sku/:sku` | Sincronizar un SKU |
| `GET /webhook/logs` | Ver logs |
| `GET /webhook/status` | Estado actual |

---

## 🔧 Comandos útiles

```bash
# Ver logs en tiempo real
pm2 logs bsale-amazon-sync

# Reiniciar servicio
pm2 restart bsale-amazon-sync

# Detener servicio
pm2 stop bsale-amazon-sync

# Eliminar servicio
pm2 delete bsale-amazon-sync

# Ver monitoreo
pm2 monit
```

---

## ⚠️ Importante: No detener otros procesos

Este servicio corre en su **propio proceso PM2** con nombre `bsale-amazon-sync`. No afecta a los demás procesos que ya tengas corriendo.

Para confirmar que solo este proceso se ve afectado:
```bash
pm2 list  # Ver todos los procesos
```

---

## 🆘 Troubleshooting

### Error: "EADDRINUSE" (puerto ocupado)
Cambia el puerto en `.env` y reinicia.

### Error: "Cannot find module"
Asegúrate de haber corrido `npm install`.

### Error de autenticación con Amazon
Verifica que las credenciales en `.env` sean correctas.

### Webhook no llega
Verifica que el puerto esté abierto en el firewall:
```bash
ufw allow 3005
```
