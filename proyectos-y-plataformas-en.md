# PROJECT AND PLATFORM INVENTORY

**Date:** September 1, 2026
**Company:** Shopy Enterprise / Moreka

---

## TABLE OF CONTENTS

1. [Project Summary](#1-project-summary)
2. [Detailed Projects](#2-detailed-projects)
3. [Platforms and Technologies](#3-platforms-and-technologies)
4. [Server Architecture](#4-server-architecture)
5. [Overall Status](#5-overall-status)

---

## 1. PROJECT SUMMARY

| # | Project | Status | Start Date |
|---|---------|--------|------------|
| PRJ-001 | Shopify → Bsale Web Sync | ⏳ In Progress | July 2026 |
| PRJ-002 | ML Inventory Dashboard | ⏳ Pending Deploy | August 2026 |
| PRJ-003 | Inventory Credit App | ✅ Running | July 2026 |
| PRJ-004 | ML → Bsale Webhook Hub | ✅ Running | July 2026 |
| PRJ-005 | Product Sync Bsale | ✅ Running | July 2026 |
| PRJ-006 | Shopify Product Migrator | ✅ Running | August 2026 |
| PRJ-007 | Shopy Enterprise Landing Page | ✅ Deployed | August 2026 |
| PRJ-009 | Nebro Pricing App | ✅ Running | August 2026 |
| PRJ-010 | nebro.shop → Moreka Shop Migration | ✅ Completed | June-July 2026 |

---

## 2. DETAILED PROJECTS

---

### PRJ-001: Shopify → Bsale Web Sync

**Description:** Automatic synchronization of product images and descriptions from Shopify (Moreka Shop) to Bsale Web, using SKU as the common identifier.

**Flow:**
```
Shopify (Moreka Shop) → "Product update" Webhook → Hub Server → Bsale API → Bsale Web Store
```

**Features:**
- Search product by SKU in Bsale
- If no web description exists → creates it automatically
- If web description exists but is inactive → activates it
- If active → updates images + description
- Manual sync by SKU available

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook/shopify-product` | POST | Receives Shopify webhooks |
| `/webhook/sync/product` | POST | Manual sync by SKU |

**Technologies:** Node.js, TypeScript, Express, Bsale API v1/v2, Shopify API

**Status:** ⏳ Code implemented, pending DNS and webhook verification

---

### PRJ-002: ML Inventory Dashboard

**Description:** Dashboard to monitor inventory on Mercado Libre, with tracking of published products, stock, and sales metrics.

**Repository:** `morekaoficial-lgtm/marketplace-profit-tracker`

**Server:** DigitalOcean (`68.183.118.116:/opt/ml-inventory-dashboard`)

**Features:**
- Connection with Mercado Libre API
- ML inventory visualization
- Sales and stock metrics

**Technologies:** Node.js, TypeScript, Express, Mercado Libre API

**Status:** ⏳ Pending deploy. User has APP_ID and CLIENT_SECRET. Need to connect SSH and complete OAuth.

---

### PRJ-003: Inventory Credit App

**Description:** Web application to calculate and generate credit notes based on product cost changes. Compares historical cost vs. current cost and calculates the difference by units in stock.

**Repository:** `morekaoficial-lgtm/inventory-credit-app`

**Server:** DigitalOcean (`68.183.118.116`, port 3001)

**Features:**
- Automatic credit note calculation by SKU
- Stock report by branch
- Export to Excel
- Filter by INV- receptions
- Web administration panel

**Main Endpoints:**
| Endpoint | Description |
|----------|-------------|
| `/api/sync/:sku` | Syncs a product by SKU |
| `/api/report/:sku` | Generates individual report |
| `/api/credit-notes/excel` | Exports credit notes to Excel |
| `/api/sync/update-offices` | Updates all branches |

**Technologies:** Node.js, TypeScript, Express, Bsale API, vanilla HTML

**Status:** ✅ Running in production

---

### PRJ-004: ML → Bsale Webhook Hub

**Description:** Central webhook hub connecting Shopify, Bsale, and Mercado Libre. Processes sales orders, synchronizes inventory, and manages web orders.

**Repository:** `morekaoficial-lgtm/Integracion`

**Server:** DigitalOcean (`68.183.118.116`, port 3000)

**Implemented Flows:**

| Flow | Direction | Status |
|------|-----------|--------|
| Web Orders | Shopify → Bsale | ✅ Running |
| Inventory Sync | Bsale → Shopify | ✅ Running |
| Product Sync | Shopify → Bsale Web | ✅ Implemented |
| ML Sync | Bsale → Mercado Libre | ✅ Implemented |

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook/shopify` | POST | Receives Shopify orders |
| `/webhook/bsale` | POST | Receives Bsale stock changes |
| `/webhook/ml` | POST | Receives ML notifications |
| `/admin` | GET | Administration panel |

**Technologies:** Node.js, TypeScript, Express, Shopify API, Bsale API, Mercado Libre API

**Status:** ✅ Running in production (with PM2)

---

### PRJ-005: Product Sync Bsale

**Description:** Independent server to synchronize products from Shopify to Bsale web descriptions. Includes administration panel and "merge variants" functionality.

**Repository:** `morekaoficial-lgtm/product-sync-bsale`

**Server:** DigitalOcean (`68.183.118.116`, port 3003)

**Features:**
- Automatic sync via Shopify webhook
- Manual sync by SKU
- Variant merging (colors/sizes) into a single web description
- Web administration panel

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook` | POST | Shopify webhook |
| `/sync/sku` | POST | Manual sync by SKU |
| `/sync/merge-variants` | POST | Merge variants |
| `/health` | GET | Health check |

**Technologies:** Node.js, TypeScript, Express, Shopify GraphQL API, Bsale API

**Status:** ✅ Running in production

---

### PRJ-006: Shopify Product Migrator

**Description:** Web tool to migrate products between Shopify stores. Allows searching products by SKU, handle, or title and migrating them with images, variants, and metadata.

**Server:** DigitalOcean (`68.183.118.116`, port 3005)

**Features:**
- Product search by SKU, Handle, or Title
- Complete metadata reading
- Product creation in destination store
- Metafields synchronization
- Dry Run mode (simulation)

**Technologies:** Node.js, TypeScript, Express, Shopify GraphQL API

**Status:** ✅ Running in production. Pending: mass migration via CSV.

---

### PRJ-007: Shopy Enterprise Landing Page

**Description:** Corporate website for Shopy Enterprise, with company information, brands, marketplaces, catalogs, and contact details.

**Repository:** `morekaoficial-lgtm/shopy-enterprise`

**URL:** https://morekaoficial-lgtm.github.io/shopy-enterprise/

**Features:**
- Transparent logo (RGBA PNG)
- Brands section: Moreka, Nebro, G-Tide
- Marketplaces: Mercado Libre, Amazon, Walmart, TikTok Shop, AliExpress, Sears, Sanborns
- Downloadable catalogs
- Contact information and business hours
- Animations and modern design

**Technologies:** HTML5, CSS3, vanilla JavaScript, GitHub Pages

**Status:** ✅ Deployed and running

---

### PRJ-009: Nebro Pricing App

**Description:** Price calculation application for Nebro products with multiple discount systems and profitability analysis.

**Features:**
- Tab 1: Shopify products with price vs. cost comparison
- Tab 2: Calculator by new system (Wholesale C, B, Z)
- Tab 3: Volume calculator — Old System (Wholesale A)
- Loss detection (highlighted in red)

**Technologies:** Python, Streamlit

**Status:** ✅ Running

---

### PRJ-010: nebro.shop → Moreka Shop Migration

**Description:** Mass migration of products from nebro-shop store to Moreka Shop, including images, descriptions, variants, and metadata.

**Results:**
- **Total products migrated:** ~32+ products
- **nebro.shop catalog:** 125 products
- **Moreka Shop catalog (post-migration):** ~1,113+ products

**Method:** Automated script with Shopify REST API

**Technologies:** Python, Shopify REST API

**Status:** ✅ Completed

---

## 3. PLATFORMS AND TECHNOLOGIES

### 3.1 E-commerce Platforms

#### Shopify
- **Stores:** Moreka Shop (`morekashop1.myshopify.com`), Nebro Shop (`nebro-shop.myshopify.com`)
- **Use:** Main online sales platform
- **Functions:** Product catalog, inventory, orders, webhooks
- **APIs:** REST API, GraphQL API, Webhooks

#### Bsale
- **Use:** Inventory management, sales, and billing system
- **Functions:** Stock control, purchase receptions, web orders, products
- **APIs:** API v1 and v2 (REST)
- **Key Endpoints:**
  - `/v1/products.json` — Products
  - `/v1/products/{id}/variants.json` — Variants
  - `/v1/variant/{id}/stock.json` — Stock
  - `/v2/products/market_info.json` — Web descriptions
  - `/v1/documents.json` — Sales documents
  - `/markets/checkout.json` — Web orders

#### Mercado Libre
- **Use:** Marketplace for sales
- **Functions:** Listings, inventory, sales
- **API:** Mercado Libre API (OAuth 2.0)
- **Status:** Integration via webhook hub

---

### 3.2 Infrastructure

#### DigitalOcean
- **Server:** Droplet `68.183.118.116`
- **System:** Ubuntu + Nginx + PM2
- **Hosted Services:**
  - Webhook Hub (port 3000)
  - Inventory Credit App (port 3001)
  - Product Sync Bsale (port 3003)
  - Shopify Migrator (port 3005)
  - ML Inventory Dashboard (port 8080, pending)

#### GitHub / GitHub Pages
- **Repositories:**
  - `morekaoficial-lgtm/Integracion` — Webhook Hub
  - `morekaoficial-lgtm/inventory-credit-app` — Credit notes
  - `morekaoficial-lgtm/product-sync-bsale` — Product sync
  - `morekaoficial-lgtm/shopy-enterprise` — Landing page
  - `morekaoficial-lgtm/marketplace-profit-tracker` — ML Dashboard
- **GitHub Pages:** Hosting for Shopy Enterprise Landing Page

---

### 3.3 Technology Stack

| Technology | Use |
|------------|-----|
| **Node.js** | Main backend (webhook hub, APIs) |
| **TypeScript** | Primary language for services |
| **Express.js** | Web framework |
| **Python** | Migration scripts, Streamlit apps |
| **Streamlit** | Data apps (pricing, calculators) |
| **React** | Frontend (web applications) |
| **Nginx** | Reverse proxy |
| **PM2** | Node.js process management |
| **GitHub Actions** | CI/CD (implicit) |

---

## 4. SERVER ARCHITECTURE

### DigitalOcean — 68.183.118.116

```
┌─────────────────────────────────────────┐
│           Nginx (port 80/443)           │
├─────────────────────────────────────────┤
│  /webhook/*    → localhost:3000         │
│  /             → localhost:3001         │
│  /admin        → localhost:3001/admin   │
│  (others)      → other ports            │
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

### PM2 Processes

| Name | Port | Status | Description |
|------|------|--------|-------------|
| `webhook` | 3000 | ✅ online | Main hub (sales + inventory + products) |
| `inventory-credit` | 3001 | ✅ online | Credit note app |
| `product-sync-bsale` | 3003 | ✅ online | Shopify → Bsale product sync |
| `shopify-migrator` | 3005 | ✅ online | Shopify product migrator |
| `ml-inventory-dashboard` | 8080 | ⏳ pending | ML Dashboard (pending deploy) |

---

## 5. OVERALL STATUS

### Running ✅
- Bsale ↔ Shopify synchronization (inventory)
- Web Orders Shopify → Bsale
- Inventory Credit App (credit notes)
- Product Sync Bsale (web descriptions)
- Shopy Enterprise Landing Page
- Shopify Product Migrator
- Nebro Pricing App

### Pending ⏳
- ML Inventory Dashboard (needs deploy + ML OAuth)
- Shopify → Bsale Web Sync (verify DNS and webhooks)
- Configure custom domain `shopyenterprise.com`

### Pending Validation
- Verify that Shopify "Product update" webhook is configured
- Confirm DNS for `webhook.shopyenterprise.com`
- Complete Mercado Libre OAuth for dashboard

---

*Document generated on September 1, 2026*
