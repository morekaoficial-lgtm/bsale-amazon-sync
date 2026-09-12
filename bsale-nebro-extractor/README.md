# Bsale NEBRO Extractor

Extracción completa de ventas de la sucursal **NEBRO** desde Bsale API, replicando exactamente las **80 columnas** del Excel de reportes.

## Estructura

```
bsale-nebro-extractor/
├── nebro_extractor.py      # Script principal
├── run.sh                  # Wrapper para ejecución en background
├── setup_cron.sh           # Configuración del cron job
├── requirements.txt        # Dependencias
├── cache/                  # Caché de referencias y atributos
│   ├── references.json         # Clientes, usuarios, oficinas, etc.
│   ├── attribute_definitions.json  # Mapa de atributos
│   ├── variant_attributes.json     # Atributos por variante
│   └── state.json                # Estado para reanudar
├── output/                 # Archivos generados
│   ├── nebro_ventas_YYYYMMDD_HHMM.csv    # CSV con BOM para Excel
│   ├── nebro_ventas_YYYYMMDD_HHMM.parquet  # Parquet optimizado
│   └── nebro_ventas_master.csv         # Acumulado (incremental)
└── logs/                   # Logs de ejecución
```

## Uso

### Extracción completa (primera vez)

```bash
cd /root/.openclaw/workspace/bsale-nebro-extractor
python3 nebro_extractor.py --mode full
```

### Extracción incremental (solo nuevos documentos)

```bash
python3 nebro_extractor.py --mode incremental
```

### Reanudar extracción interrumpida

```bash
python3 nebro_extractor.py --mode resume
```

### Ejecución en background

```bash
./run.sh
# Ver progreso:
tail -f logs/extractor_*.log
```

## Cron Job — Actualización Semanal

Configurado para ejecutarse **todos los lunes a las 3:00 AM**:

```cron
0 3 * * 1 cd /root/.openclaw/workspace/bsale-nebro-extractor && PYTHONUNBUFFERED=1 python3 nebro_extractor.py --mode incremental >> /var/log/nebro_extractor.log 2>&1
```

### Verificar cron jobs

```bash
crontab -l
```

### Ejecutar manualmente (sin cron)

```bash
PYTHONUNBUFFERED=1 python3 nebro_extractor.py --mode incremental
```

## Columnas (80)

### 1-41: Datos de documento y línea
- Tipo Movimiento, Tipo de Documento, Numero del documento
- Fechas (Emisión, Certificación, Venta)
- Sucursal, Vendedor, Cliente (nombre, RFC, email, dirección)
- Lista de Precio, Moneda, Tipo de entrega
- SKU, Producto, Variante, Marca
- Cantidad, Precios, Ventas, Descuentos, Costos, Márgenes

### 42-80: Atributos de producto
- Dimensiones del paquete (altura, ancho, largo, peso)
- Especificaciones técnicas (modelo, potencia, conectores, etc.)
- Atributos de marca y compatibilidad

## Optimizaciones

- **Caché de referencias**: Clientes, usuarios, oficinas, etc. se cachean para evitar repetir llamadas
- **Caché de atributos**: Cada variante se consulta una sola vez, independientemente de cuántos documentos la referencien
- **Fase 2 para atributos**: Los atributos se extraen solo para variantes únicas, no por cada línea
- **Rate limiting**: 0.4s entre llamadas para respetar límites de la API
- **Resume**: Si se interrumpe, guarda estado y puede reanudar
- **Incremental**: Solo descarga documentos nuevos desde la última ejecución

## Automatización para Power BI

### Archivos generados (siempre actualizados)

| Archivo | Formato | Uso recomendado |
|---------|---------|-----------------|
| `nebro_ventas_master.parquet` | **Parquet** | **Power BI** — Carga rápida, tamaño reducido |
| `nebro_ventas_master.csv` | CSV | Excel / LibreOffice / respaldo |

El archivo Parquet tiene el **mismo nombre siempre**, así que Power BI nunca pierde la conexión.

### Conectar Power BI (paso a paso)

1. **Abrir Power BI Desktop**

2. **Obtener datos** → **Parquet** → Seleccionar:
   ```
   /root/.openclaw/workspace/bsale-nebro-extractor/output/nebro_ventas_master.parquet
   ```

3. **Cargar** — Los datos aparecen en el panel de campos

4. **Opcional — Refresco automático al abrir:**
   ```
   Archivo → Opciones → Configuración de carga de datos
   ☑ Actualizar datos cuando se abre el archivo
   ```

### Actualización automática (servidor)

Ya configurado. Cada lunes a las 3:00 AM:
```bash
0 3 * * 1 python3 /root/.openclaw/workspace/bsale-nebro-extractor/refresh_powerbi.py
```

### Actualización manual (desde Power BI Desktop)

```
Inicio → Actualizar  (o Ctrl + R)
```

Power BI recargará el Parquet con los datos nuevos.

---

## Salida

| Archivo | Descripción |
|---------|-------------|
| `nebro_ventas_master.csv` | CSV acumulado con todas las filas (para Excel) |
| `nebro_ventas_master.parquet` | Parquet acumulado (para Power BI) |
| `nebro_ventas_YYYYMMDD_HHMM.csv` | Snapshot CSV de la ejecución actual |
| `nebro_ventas_YYYYMMDD_HHMM.parquet` | Snapshot Parquet de la ejecución actual |

## Notas

- **Token**: `027fa2348b50d5ecd2d2a469f07c464e85cf176d`
- **Sucursal**: NEBRO (officeid=4)
- **Período inicial**: 2026-01-01 en adelante
- **API**: Bsale v1 (`https://api.bsale.io/v1`)

---

*Generado automáticamente el 2026-06-22*
