# Proyectos Pendientes / Checkpoints

## BSALE-CLAROSHOP-SYNC
**Estado:** 🆕 Proyecto creado — pendiente configurar credenciales y ajustar endpoints
**Fecha:** 2026-09-01
**Detalle:** Proyecto de sincronización entre Bsale (ERP/POS) y Claroshop (marketplace MX). Estructura base creada en `projects/bsale-claroshop-sync/`. Falta: credenciales reales, ajustar endpoints de Claroshop según documentación oficial, y probar mapeo de campos.

Para retomar, buscar: **"BSALE-CLAROSHOP-SYNC"**

---

## ML-INVENTORY-DEPLOY
**Estado:** ⏳ Paso 1 pendiente — conectar SSH al droplet
**Fecha:** 2026-08-23
**Detalle:** Usuario tiene APP_ID y CLIENT_SECRET de ML. Quedó en Paso 1 (SSH a DigitalOcean). Ver `memory/2026-08-23.md` para pasos completos.

Para retomar, buscar: **"ML-INVENTORY-DEPLOY"**

---

## ML-TOKEN-REVIVE
**Estado:** ⏳ Esperando token válido de Mercado Libre
**Fecha:** 2026-08-14
**Detalle:** Ver `memory/2026-08-14.md`

Para retomar, buscar: **"ML-TOKEN-REVIVE"**

---

## SHOPIFY-ALIEXPRESS-SYNC
**Estado:** 🆕 Proyecto creado — pendiente configurar credenciales
**Fecha:** 2026-09-07
**Detalle:** Integración para sincronizar productos desde Shopify hacia AliExpress. Estructura completa creada en `projects/shopify-aliexpress-sync/`.
- Cliente Shopify (GraphQL Admin API)
- Cliente AliExpress (Seller API con firma MD5)
- Mapeador de productos con transformación de variantes/SKUs
- Sincronizador con modo dry-run
- Pendiente: credenciales reales, mapeo de categorías, pruebas

Para retomar, buscar: **"SHOPIFY-ALIEXPRESS-SYNC"**

---

## BSALE-AMAZON-SYNC
**Estado:** 🆕 Proyecto creado — pendiente obtener Refresh Token de Amazon y probar integración
**Fecha:** 2026-09-10
**Detalle:** Integración de inventario BSale (ERP chileno) → Amazon Seller Central vía SP-API. Proyecto creado en `projects/bsale-amazon-sync/` con estructura completa.
- **IMPORTANTE:** Desde octubre 2023, Amazon SP-API ya NO requiere AWS IAM ni AWS Signature v4. Solo se necesita LWA (Login with Amazon).
- Pendiente: obtener Refresh Token desde Seller Central, probar conexión, deploy

Para retomar, buscar: **"BSALE-AMAZON-SYNC"**
