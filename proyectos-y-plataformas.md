# INVENTARIO DE PROYECTOS Y PLATAFORMAS

**Fecha:** 1 de Septiembre de 2026
**Empresa:** Shopy Enterprise / Moreka

---

## ÍNDICE

1. [Resumen de Proyectos](#1-resumen-de-proyectos)
2. [Proyectos Detallados](#2-proyectos-detallados)
3. [Plataformas y Tecnologías](#3-plataformas-y-tecnologías)
4. [Arquitectura de Servidores](#4-arquitectura-de-servidores)
5. [Estado General](#5-estado-general)

---

## 1. RESUMEN DE PROYECTOS

| # | Proyecto | Estado | Fecha Inicio |
|---|----------|--------|--------------|
| PRJ-001 | Shopify → Bsale Web Sync | ⏳ En progreso | Julio 2026 |
| PRJ-002 | ML Inventory Dashboard | ⏳ Pendiente deploy | Agosto 2026 |
| PRJ-003 | Inventory Credit App | ✅ Funcionando | Julio 2026 |
| PRJ-004 | ML → Bsale Webhook Hub | ✅ Funcionando | Julio 2026 |
| PRJ-005 | Product Sync Bsale | ✅ Funcionando | Julio 2026 |
| PRJ-006 | Shopify Product Migrator | ✅ Funcionando | Agosto 2026 |
| PRJ-007 | Shopy Enterprise Landing Page | ✅ Deployado | Agosto 2026 |
| PRJ-009 | Nebro Pricing App | ✅ Funcionando | Agosto 2026 |
| PRJ-010 | Migración nebro.shop → Moreka Shop | ✅ Completado | Junio-Julio 2026 |

---

## 2. PROYECTOS DETALLADOS

---

### PRJ-001: Shopify → Bsale Web Sync

**Descripción:** Sincronización automática de imágenes y descripciones de productos desde Shopify (Moreka Shop) hacia Bsale Web, usando el SKU como identificador común.

**Flujo:**
```
Shopify (Moreka Shop) → Webhook "Product update" → Servidor Hub → Bsale API → Tienda Web Bsale
```

**Funcionalidades:**
- Busca producto por SKU en Bsale
- Si no tiene descripción web → la crea automáticamente
- Si tiene descripción web inactiva → la activa
- Si está activa → actualiza imágenes + descripción
- Sync manual por SKU disponible

**Endpoints:**
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/webhook/shopify-product` | POST | Recibe webhooks de Shopify |
| `/webhook/sync/product` | POST | Sync manual por SKU |

**Tecnologías:** Node.js, TypeScript, Express, Bsale API v1/v2, Shopify API

**Estado:** ⏳ Código implementado, pendiente verificación de DNS y webhooks

---

### PRJ-002: ML Inventory Dashboard

**Descripción:** Dashboard para monitorear inventario en Mercado Libre, con seguimiento de productos publicados, stock y métricas de ventas.

**Repositorio:** `morekaoficial-lgtm/marketplace-profit-tracker`

**Servidor:** DigitalOcean (`68.183.118.116:/opt/ml-inventory-dashboard`)

**Funcionalidades:**
- Conexión con API de Mercado Libre
- Visualización de inventario ML
- Métricas de ventas y stock

**Tecnologías:** Node.js, TypeScript, Express, Mercado Libre API

**Estado:** ⏳ Pendiente deploy. Usuario tiene APP_ID y CLIENT_SECRET. Falta conectar SSH y completar OAuth.

---

### PRJ-003: Inventory Credit App

**Descripción:** Aplicación web para calcular y generar notas de crédito basadas en cambios de costo de productos. Compara el costo histórico vs. el costo actual y calcula la diferencia por unidades en stock.

**Repositorio:** `morekaoficial-lgtm/inventory-credit-app`

**Servidor:** DigitalOcean (`68.183.118.116`, puerto 3001)

**Funcionalidades:**
- Cálculo automático de notas de crédito por SKU
- Reporte de stock por sucursal
- Exportación a Excel
- Filtrado por recepciones INV-
- Panel web de administración

**Endpoints principales:**
| Endpoint | Descripción |
|----------|-------------|
| `/api/sync/:sku` | Sincroniza un producto por SKU |
| `/api/report/:sku` | Genera reporte individual |
| `/api/credit-notes/excel` | Exporta notas de crédito a Excel |
| `/api/sync/update-offices` | Actualiza todas las sucursales |

**Tecnologías:** Node.js, TypeScript, Express, Bsale API, HTML vanilla

**Estado:** ✅ Funcionando en producción

---

### PRJ-004: ML → Bsale Webhook Hub

**Descripción:** Hub central de webhooks que conecta Shopify, Bsale y Mercado Libre. Procesa órdenes de venta, sincroniza inventario y gestiona pedidos web.

**Repositorio:** `morekaoficial-lgtm/Integracion`

**Servidor:** DigitalOcean (`68.183.118.116`, puerto 3000)

**Flujos implementados:**

| Flujo | Dirección | Estado |
|-------|-----------|--------|
| Pedidos Web | Shopify → Bsale | ✅ Funcionando |
| Sync Inventario | Bsale → Shopify | ✅ Funcionando |
| Sync Productos | Shopify → Bsale Web | ✅ Implementado |
| Sync ML | Bsale → Mercado Libre | ✅ Implementado |

**Endpoints:**
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/webhook/shopify` | POST | Recibe órdenes de Shopify |
| `/webhook/bsale` | POST | Recibe cambios de stock de Bsale |
| `/webhook/ml` | POST | Recibe notificaciones de ML |
| `/admin` | GET | Panel de administración |

**Tecnologías:** Node.js, TypeScript, Express, Shopify API, Bsale API, Mercado Libre API

**Estado:** ✅ Funcionando en producción (con PM2)

---

### PRJ-005: Product Sync Bsale

**Descripción:** Servidor independiente para sincronizar productos desde Shopify hacia descripciones web en Bsale. Incluye panel de administración y funcionalidad de "unir variantes".

**Repositorio:** `morekaoficial-lgtm/product-sync-bsale`

**Servidor:** DigitalOcean (`68.183.118.116`, puerto 3003)

**Funcionalidades:**
- Sync automático por webhook de Shopify
- Sync manual por SKU
- Unión de variantes (colores/tallas) en una sola descripción web
- Panel de administración web

**Endpoints:**
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/webhook` | POST | Webhook de Shopify |
| `/sync/sku` | POST | Sync manual por SKU |
| `/sync/merge-variants` | POST | Unir variantes |
| `/health` | GET | Health check |

**Tecnologías:** Node.js, TypeScript, Express, Shopify GraphQL API, Bsale API

**Estado:** ✅ Funcionando en producción

---

### PRJ-006: Shopify Product Migrator

**Descripción:** Herramienta web para migrar productos entre tiendas Shopify. Permite buscar productos por SKU, handle o título y migrarlos con imágenes, variantes y metadatos.

**Servidor:** DigitalOcean (`68.183.118.116`, puerto 3005)

**Funcionalidades:**
- Búsqueda de productos por SKU, Handle o Título
- Lectura de metadatos completos
- Creación de producto en tienda destino
- Sincronización de metafields
- Modo Dry Run (simulación)

**Tecnologías:** Node.js, TypeScript, Express, Shopify GraphQL API

**Estado:** ✅ Funcionando en producción. Pendiente: migración masiva por CSV.

---

### PRJ-007: Shopy Enterprise Landing Page

**Descripción:** Página web corporativa de Shopy Enterprise, con información de la empresa, marcas, marketplaces, catálogos y contacto.

**Repositorio:** `morekaoficial-lgtm/shopy-enterprise`

**URL:** https://morekaoficial-lgtm.github.io/shopy-enterprise/

**Características:**
- Logo transparente (PNG RGBA)
- Sección de marcas: Moreka, Nebro, G-Tide
- Marketplaces: Mercado Libre, Amazon, Walmart, TikTok Shop, AliExpress, Sears, Sanborns
- Catálogos descargables
- Información de contacto y horarios
- Animaciones y diseño moderno

**Tecnologías:** HTML5, CSS3, JavaScript vanilla, GitHub Pages

**Estado:** ✅ Deployado y funcionando


**Descripción:** Aplicación de cálculo de precios para productos Nebro con múltiples sistemas de descuento y análisis de rentabilidad.

**Funcionalidades:**
- Tab 1: Productos Shopify con comparación precio vs costo
- Tab 2: Calculadora por sistema nuevo (Mayoreo C, B, Z)
- Tab 3: Calculadora por volumen — Sistema Antiguo (Mayoreo A)
- Detección de productos en pérdida (resaltados en rojo)

**Tecnologías:** Python, Streamlit

**Estado:** ✅ Funcionando

---

### PRJ-010: Migración nebro.shop → Moreka Shop

**Descripción:** Migración masiva de productos desde la tienda nebro-shop a Moreka Shop, incluyendo imágenes, descripciones, variantes y metadatos.

**Resultado:**
- **Total de productos migrados:** ~32+ productos
- **Catálogo nebro.shop:** 125 productos
- **Catálogo Moreka Shop (post-migración):** ~1,113+ productos

**Método:** Script automatizado con Shopify REST API

**Tecnologías:** Python, Shopify REST API

**Estado:** ✅ Completado

---

## 3. PLATAFORMAS Y TECNOLOGÍAS

### 3.1 Plataformas de E-commerce

#### Shopify
- **Tiendas:** Moreka Shop (`morekashop1.myshopify.com`), Nebro Shop (`nebro-shop.myshopify.com`)
- **Uso:** Plataforma principal de ventas online
- **Funciones:** Catálogo de productos, inventario, pedidos, webhooks
- **APIs:** REST API, GraphQL API, Webhooks

#### Bsale
- **Uso:** Sistema de gestión de inventario, ventas y facturación
- **Funciones:** Control de stock, recepciones de compra, pedidos web, productos
- **APIs:** API v1 y v2 (REST)
- **Endpoints clave:**
  - `/v1/products.json` — Productos
  - `/v1/products/{id}/variants.json` — Variantes
  - `/v1/variant/{id}/stock.json` — Stock
  - `/v2/products/market_info.json` — Descripciones web
  - `/v1/documents.json` — Documentos de venta
  - `/markets/checkout.json` — Pedidos web

#### Mercado Libre
- **Uso:** Marketplace para ventas
- **Funciones:** Publicaciones, inventario, ventas
- **API:** Mercado Libre API (OAuth 2.0)
- **Estado:** Integración vía webhook hub

---

### 3.2 Infraestructura

#### DigitalOcean
- **Servidor:** Droplet `68.183.118.116`
- **Sistema:** Ubuntu + Nginx + PM2
- **Servicios alojados:**
  - Webhook Hub (puerto 3000)
  - Inventory Credit App (puerto 3001)
  - Product Sync Bsale (puerto 3003)
  - Shopify Migrator (puerto 3005)
  - ML Inventory Dashboard (puerto 8080, pendiente)

#### GitHub / GitHub Pages
- **Repositorios:**
  - `morekaoficial-lgtm/Integracion` — Webhook Hub
  - `morekaoficial-lgtm/inventory-credit-app` — Notas de crédito
  - `morekaoficial-lgtm/product-sync-bsale` — Sync productos
  - `morekaoficial-lgtm/shopy-enterprise` — Landing page
  - `morekaoficial-lgtm/marketplace-profit-tracker` — Dashboard ML
- **GitHub Pages:** Alojamiento de Shopy Enterprise Landing Page

---

### 3.3 Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Node.js** | Backend principal (webhook hub, APIs) |
| **TypeScript** | Lenguaje principal para servicios |
| **Express.js** | Framework web |
| **Python** | Scripts de migración, apps Streamlit |
| **Streamlit** | Apps de datos (pricing, calculadoras) |
| **React** | Frontend (aplicaciones web) |
| **Nginx** | Reverse proxy |
| **PM2** | Gestión de procesos Node.js |
| **GitHub Actions** | CI/CD (implícito) |

---

## 4. ARQUITECTURA DE SERVIDORES

### DigitalOcean — 68.183.118.116

```
┌─────────────────────────────────────────┐
│           Nginx (puerto 80/443)         │
├─────────────────────────────────────────┤
│  /webhook/*    → localhost:3000         │
│  /             → localhost:3001         │
│  /admin        → localhost:3001/admin   │
│  (otros)       → otros puertos          │
└─────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┐
    │              │              │              │
┌───▼───┐    ┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│:3000  │    │:3001  │    │:3003  │    │:3005  │
│Webhook│    │Credit │    │Product│    │Migrate│
│ Hub   │    │ App   │    │ Sync  │    │ rator │
└───────┘    └───────┘    └───────┘    └───────┘
```

### Procesos PM2

| Nombre | Puerto | Estado | Descripción |
|--------|--------|--------|-------------|
| `webhook` | 3000 | ✅ online | Hub principal (ventas + inventario + productos) |
| `inventory-credit` | 3001 | ✅ online | App de notas de crédito |
| `product-sync-bsale` | 3003 | ✅ online | Sync productos Shopify → Bsale |
| `shopify-migrator` | 3005 | ✅ online | Migrador de productos Shopify |
| `ml-inventory-dashboard` | 8080 | ⏳ pending | Dashboard ML (pendiente deploy) |

---

## 5. ESTADO GENERAL

### Funcionando ✅
- Sincronización Bsale ↔ Shopify (inventario)
- Pedidos Web Shopify → Bsale
- Inventory Credit App (notas de crédito)
- Product Sync Bsale (descripciones web)
- Shopy Enterprise Landing Page
- Shopify Product Migrator
- Nebro Pricing App

### Pendiente ⏳
- ML Inventory Dashboard (falta deploy + OAuth ML)
- Shopify → Bsale Web Sync (verificar DNS y webhooks)
- Configurar dominio personalizado `shopyenterprise.com`

### Pendientes de Validación
- Verificar que webhook de Shopify "Product update" esté configurado
- Confirmar DNS de `webhook.shopyenterprise.com`
- Completar OAuth de Mercado Libre para dashboard

---

*Documento generado el 1 de Septiembre de 2026*
