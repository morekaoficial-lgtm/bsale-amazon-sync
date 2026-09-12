# 🎯 Conectar Bsale NEBRO con Power BI — Guía Paso a Paso

## ✅ Estado Actual

| Componente | Estado |
|---|---|
| Extractor | ✅ Funcionando — 7,621 filas extraídas |
| Parquet para Power BI | ✅ Generado en `output/nebro_ventas_master.parquet` |
| Actualización automática | ✅ Cron configurado — lunes 3:00 AM |

---

## 📂 Archivo para Power BI

**Ruta exacta en tu servidor:**
```
/root/.openclaw/workspace/bsale-nebro-extractor/output/nebro_ventas_master.parquet
```

> **Nota:** El archivo Parquet tiene el **mismo nombre siempre**. Power BI nunca pierde la conexión, solo actualiza los datos.

---

## 🔌 PASO 1: Conectar Power BI Desktop

1. **Abre Power BI Desktop** (descarga gratis desde powerbi.microsoft.com)

2. Ve a **Inicio** → **Obtener datos** → **Más...**

3. En el buscador, escribe **"Parquet"** y selecciónalo:
   ```
   Tipo de archivo: Parquet
   ```

4. Navega a la carpeta del archivo:
   ```
   /root/.openclaw/workspace/bsale-nebro-extractor/output/
   ```
   Y selecciona:
   ```
   nebro_ventas_master.parquet
   ```

5. Haz clic en **Cargar**

6. ¡Listo! Los datos aparecen en el panel de campos a la derecha.

---

## 🔄 PASO 2: Configurar Actualización Automática al Abrir

Para que Power BI se actualice **solo al abrir el archivo**:

1. Ve a **Archivo** → **Opciones y configuración** → **Opciones**

2. Selecciona **Configuración de carga de datos** (en el panel izquierdo)

3. Marca la casilla:
   ```
   ☑ Actualizar datos cuando se abre el archivo
   ```

4. Haz clic en **Aceptar**

> **Resultado:** Cada vez que abras el archivo .pbix, Power BI cargará automáticamente los datos más recientes del Parquet.

---

## ⏰ PASO 3: Actualización Automática (Servidor)

El servidor ya está configurado para actualizar los datos **automáticamente** cada semana:

| Configuración | Valor |
|---|---|
| **Frecuencia** | Todos los lunes |
| **Hora** | 3:00 AM |
| **Qué hace** | Descarga nuevas ventas de Bsale y regenera el Parquet |

**Tú no tienes que hacer nada.** El archivo Parquet se actualiza solo.

---

## 🖱️ PASO 4: Actualizar Manualmente (cuando quieras)

Si necesitas datos actualizados **ahora mismo** (sin esperar al lunes):

### Opción A — Desde Power BI Desktop:
```
Inicio → Actualizar  (o presiona Ctrl + R)
```

### Opción B — Desde el servidor (remoto):
```bash
ssh tu-servidor
python3 /root/.openclaw/workspace/bsale-nebro-extractor/refresh_powerbi.py
```

> El script hará todo: descarga datos nuevos + regenera el Parquet. Luego refresca en Power BI con Ctrl + R.

---

## 📊 Qué Campos Puedes Usar en Power BI

### Datos de venta (columnas 1-41):
- `Fecha de Emisión` — Para ejes de tiempo
- `Numero del documento` — Identificador de transacción
- `Vendedor` — Para análisis por vendedor
- `Nombre Cliente` — Para análisis de clientes
- `SKU`, `Producto / Servicio` — Para análisis de productos
- `Cantidad` — Volumen vendido
- `Venta Total Bruta` — Ingresos
- `Descuento Neto` — Descuentos aplicados
- `Margen`, `% Margen` — Rentabilidad (cuando estén disponibles)

### Atributos de producto (columnas 42-75):
- `Atributo Marca` — Análisis por marca
- `Atributo Modelo` — Análisis por modelo
- `Atributo Potencia` — Especificaciones técnicas
- `Atributo Peso del paquete del seller` — Logística
- `Atributo Código de barra #2` — Identificación

---

## 🌐 OPCIONAL: Power BI Service (Nube)

Si quieres que el reporte esté **en la nube** y se actualice solo sin abrir tu computadora:

### Requisitos:
- **Power BI Pro** o **Premium** (licencia de Microsoft)
- **On-premises Data Gateway** (instalado en tu servidor)

### Pasos:
1. Publica tu reporte desde Power BI Desktop → **Archivo** → **Publicar**
2. En Power BI Service (app.powerbi.com), ve a tu workspace
3. Configura el **Gateway** para conectarse al archivo Parquet local
4. Programa el refresco automático en el servicio

> **Nota:** Esto requiere licencia de Microsoft. Si solo usas Power BI Desktop, la actualización al abrir el archivo es suficiente y gratis.

---

## 🛠️ Resolución de Problemas

### "No encuentro el archivo Parquet"
```bash
# Verifica que exista:
ls -la /root/.openclaw/workspace/bsale-nebro-extractor/output/nebro_ventas_master.parquet
```

### "Power BI dice que el archivo está en uso"
- El cron podría estar actualizando el archivo. Espera unos minutos y refresca.

### "Los datos no se actualizan"
1. Verifica la fecha del archivo:
   ```bash
   ls -la /root/.openclaw/workspace/bsale-nebro-extractor/output/nebro_ventas_master.parquet
   ```
2. Si es viejo, ejecuta manualmente:
   ```bash
   python3 /root/.openclaw/workspace/bsale-nebro-extractor/refresh_powerbi.py
   ```
3. En Power BI: **Ctrl + R**

### "Quiero actualizar más seguido que una vez por semana"
- Edita el cron:
  ```bash
  crontab -e
  ```
- Cambia la línea de `0 3 * * 1` (lunes) a `0 3 * * *` (todos los días)

---

## 📋 Resumen de Archivos

| Archivo | Ubicación | Uso |
|---|---|---|
| **Parquet (Power BI)** | `output/nebro_ventas_master.parquet` | ⭐ Conectar a Power BI |
| CSV (Excel) | `output/nebro_ventas_master.csv` | Abrir en Excel / LibreOffice |
| Script de refresh | `refresh_powerbi.py` | Actualizar manualmente |
| Log de ejecución | `logs/refresh.log` | Ver si hay errores |
| Configuración cron | `crontab -l` | Automatización semanal |

---

**¿Preguntas?** El archivo Parquet ya está listo. Solo abre Power BI, conecta, y empieza a crear tus dashboards. 🚀
