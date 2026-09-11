# Deploy vía Consola Web de DigitalOcean

## Paso 1: Abrir la consola

1. Ve a https://cloud.digitalocean.com
2. Entra a tu Droplet
3. Click en **"Console"** (el botón negro arriba a la derecha)
4. Se abre un terminal dentro del navegador

## Paso 2: Ejecutar estos comandos

Copia y pega línea por línea en la consola:

```bash
# 1. Ir al directorio de la app
cd /root/bsale-amazon-sync

# 2. Hacer backup de .env por si acaso
cp .env .env.backup

# 3. Bajar los últimos cambios
git pull origin main

# 4. Verificar que .env sigue existiendo
ls -la .env

# 5. Si usas PM2, reiniciar la app
pm2 restart bsale-amazon-sync

# 6. Ver logs en vivo (Ctrl+C para salir)
pm2 logs bsale-amazon-sync
```

## Si no tienes PM2 configurado

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Iniciar con PM2
npm run pm2:start

# Guardar para que inicie automático
pm2 save
pm2 startup
```

## Verificar que funciona

Abre en tu navegador:
```
http://TU_IP:3000
```

O desde la misma consola:
```bash
curl http://localhost:3000/api/dashboard/status
```

## Si algo falla

Restaurar backup:
```bash
cp .env.backup .env
pm2 restart bsale-amazon-sync
```

---
**Nota:** La sucursal de BSale ahora es **2** por defecto. Si necesitas cambiarla, edita el `.env`:
```bash
nano .env
# Cambia: BSALE_OFFICE_ID=2
# Guarda: Ctrl+O, Enter, Ctrl+X
```
