# PROJECTS.md - Registro Central de Proyectos

> **Regla:** Cada proyecto activo debe tener un `PROJECT_ID` único. Nunca reutilizar IDs. Nunca renombrar directorios sin actualizar este archivo.

---

## 📋 Índice de Proyectos

| ID | Nombre | Estado | Directorio | Repo GitHub | Última Actualización |
|----|--------|--------|------------|-------------|----------------------|
| `PRJ-001` | NEBRO Shopify Store | ✅ Activo | — | — | 2026-07-25 |
| `PRJ-002` | Moreka Shop (Shopify) | ✅ Activo | — | — | 2026-07-25 |
| `PRJ-003` | Inventory Credit App | ⚠️ En debug | `inventory-credit-app/` | [GitHub](https://github.com/morekaoficial-lgtm/inventory-credit-app) | 2026-07-25 |
| `PRJ-004` | ML → Bsale Webhook Hub | ✅ Activo | `ml-bsale-webhook/` | [GitHub](https://github.com/morekaoficial-lgtm/ml-bsale-webhook) | 2026-07-18 |
| `PRJ-005` | Bsale NEBRO Report | ✅ Activo | `nebro-bsale-report/` | — | 2026-07-17 |
| `PRJ-006` | Marketplace Pricing Calculator | ✅ Activo | `marketplace-pricing-calculator/` | — | 2026-06-27 |
| `PRJ-007` | Pricing (Streamlit) | ✅ Activo | `princing/` | [GitHub](https://github.com/morekaoficial-lgtm/princing) | 2026-07-12 |
| `PRJ-008` | Shopify Product Creator | ✅ Activo | `shopify-product-creator/` | — | 2026-07-24 |
| `PRJ-009` | ML Sales Dashboard | ✅ Activo | `ml-sales-dashboard/` | — | 2026-07-03 |
| `PRJ-011` | Dengue App (degune1) | ✅ Producción | `degune1-render/` | [GitHub](https://github.com/wistermarquez90-oss/degune1) | 2026-07-11 |
| `PRJ-013` | Moreka Market Dashboard | ✅ Activo | `moreka-market-dashboard/` | — | 2026-05-13 |
| `PRJ-014` | NEBRO Image Generator | ✅ Activo | `nebro-image-generator/` | — | 2026-05-17 |
| `PRJ-015` | NEBRO Price Calculator | ✅ Activo | `nebro-price-calculator/` | — | 2026-06-19 |
| `PRJ-017` | ML Daily Sync | ✅ Activo | `ml_daily_sync.py` | — | 2026-04-09 |
| `PRJ-018` | ML Sales Exporter | ✅ Activo | `ml_sales_exporter.py` | — | 2026-04-09 |
| `PRJ-020` | Wister Portfolio (Astro) | ✅ Activo | `wister-portfolio-astro/` | — | 2026-04-13 |
| `PRJ-021` | Shopify Flow Prompts | ✅ Activo | `shopify-flow-prompts/` | — | 2026-05-18 |
| `PRJ-022` | Humanic App | ✅ Activo | `humanic-app/` | — | 2026-05-10 |
| `PRJ-024` | Shopify Product Creator (Streamlit) | ✅ Activo | `shopify-product-creator-streamlit/` | — | 2026-05-15 |
| `PRJ-025` | Fermentum Scraper | ✅ Activo | `fermentum_scraper.py` + `fermentum/` | — | 2026-05-30 |
| `PRJ-028` | Nueva App (Streamlit) | ✅ Activo | `nueva-app/` | — | 2026-05-31 |
| `PRJ-029` | Streamlit Market Dashboard | ✅ Activo | `streamlit-market-dashboard/` | — | 2026-05-07 |
| `PRJ-030` | Shopy Bot | ⚠️ En pausa | `shopy-bot/` | — | 2026-03-30 |
| `PRJ-031` | Shopify Inventory Sync | ✅ Activo | `shopify_inventory_sync.py` | — | 2026-05-23 |
| `PRJ-032` | MercadoLibre Sales Tracker | ✅ Activo | `mercadolibre-sales/` | — | 2026-05-29 |
| `PRJ-033` | Price List Calculator | ✅ Activo | `price-list-calculator/` | — | 2026-06-11 |
| `PRJ-034` | Bsale-Nebro Extractor | ✅ Activo | `bsale-nebro-extractor/` | — | 2026-06-22 |

---

## 🆕 Convención para Nuevos Proyectos

Cuando se cree un proyecto nuevo:

1. **Asignar el siguiente ID disponible** (ej: si el último es PRJ-034, el nuevo es `PRJ-035`)
2. **Crear directorio** con nombre descriptivo y SIN espacios
3. **Agregar entrada** a esta tabla con:
   - ID único
   - Nombre corto
   - Estado inicial (generalmente `🚧 En desarrollo`)
   - Ruta del directorio o archivo principal
   - Link al repo de GitHub (si aplica)
   - Fecha de creación
4. **Documentar** en `README.md` dentro del proyecto:
   - Qué hace
   - Cómo se ejecuta
   - Dependencias
   - Variables de entorno necesarias

---

## 🔄 Convención para Actualizaciones

Cuando se actualice un proyecto existente:

1. **Mencionar el PROJECT_ID** al inicio de la conversación: *"Actualicemos PRJ-003..."*
2. **Actualizar la fecha** en esta tabla
3. **Documentar el cambio** en `memory/YYYY-MM-DD.md` referenciando el ID
4. **Nunca asumir** que un proyecto similar es el mismo — verificar por ID

---

## 📁 Proyectos por Categoría

### Shopify / E-commerce
- `PRJ-001` NEBRO Shopify Store
- `PRJ-002` Moreka Shop
- `PRJ-003` Inventory Credit App
- `PRJ-008` Shopify Product Creator
- `PRJ-024` Shopify Product Creator (Streamlit)
- `PRJ-031` Shopify Inventory Sync

### Bsale / ERP
- `PRJ-004` ML → Bsale Webhook Hub
- `PRJ-005` Bsale NEBRO Report
- `PRJ-034` Bsale-Nebro Extractor

### MercadoLibre
- `PRJ-006` Marketplace Pricing Calculator
- `PRJ-009` ML Sales Dashboard
- `PRJ-017` ML Daily Sync
- `PRJ-018` ML Sales Exporter
- `PRJ-032` MercadoLibre Sales Tracker

### Calculadoras / Herramientas
- `PRJ-007` Pricing (Streamlit)
- `PRJ-015` NEBRO Price Calculator
- `PRJ-033` Price List Calculator

### Apps Web / Dashboards
- `PRJ-011` Dengue App
- `PRJ-013` Moreka Market Dashboard
- `PRJ-020` Wister Portfolio
- `PRJ-022` Humanic App
- `PRJ-028` Nueva App
- `PRJ-029` Streamlit Market Dashboard

### Automatización / Scrapers
- `PRJ-014` NEBRO Image Generator
- `PRJ-021` Shopify Flow Prompts
- `PRJ-025` Fermentum Scraper
- `PRJ-030` Shopy Bot

---

*Última actualización de este registro: 2026-07-25*
*Nota: Proyectos legacy eliminados del registro activo: PRJ-010, PRJ-012, PRJ-016, PRJ-019, PRJ-023, PRJ-026, PRJ-027*
