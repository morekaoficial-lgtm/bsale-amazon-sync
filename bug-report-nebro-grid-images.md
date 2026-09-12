# Bug Report: Imágenes no se ven en grid de productos — Tienda Nebro (Bsale)

**Fecha:** 2026-08-08
**Status:** 🔴 Confirmado — Necesita fix en configuración de imágenes o tema

## Problema

Las imágenes de productos **NO se visualizan en el grid/listado** de la tienda Nebro, pero **SÍ se ven correctamente** al abrir el producto individualmente.

## Evidencia

### 1. Grid de productos — Imágenes ROTAS
- Las tarjetas de producto muestran placeholder en lugar de imagen
- URL del grid (ejemplo): `https://www.nebro.tienda/collection/electronica`

### 2. Página de producto individual — Imágenes OK
- Al abrir un producto, la imagen se muestra correctamente
- URL de ejemplo: `https://www.nebro.tienda/product/smart-watch-g-tide-q1`

### 3. Diagnóstico técnico

#### Grid (thumbnails)
Bsale genera thumbnails en su CDN para el grid:
```
https://dojiw2m9tvv09.cloudfront.net/80232/product/S_{sku}.jpg
```

**Problema encontrado:** Productos con imágenes desde **Shopify CDN** (`cdn.shopify.com`) tienen thumbnails rotos:
```javascript
// Evaluación en navegador
{
  src: "https://cdn.shopify.com/s/files/1/0542/2343/8017/files/FS-196-7.jpg?v=1756942592",
  complete: true,
  naturalWidth: 0,   // ← IMAGEN ROTA
  naturalHeight: 0
}
```

Mientras que productos con imágenes nativas de Bsale funcionan:
```javascript
{
  src: "https://dojiw2m9tvv09.cloudfront.net/80232/product/S_wg184-89286.jpg",
  complete: true,
  naturalWidth: 800,  // ← OK
  naturalHeight: 800
}
```

#### Página de producto (imagen original)
En la ficha individual, Bsale usa la URL original de la imagen (`urlImg`), que sí funciona porque apunta directamente a Shopify CDN.

## Comparación: Moreka Shop vs Nebro Shop

| Aspecto | Moreka Shop | Nebro Shop |
|---------|-------------|------------|
| Imágenes en grid | ✅ Funcionan | ❌ Rotas |
| Imágenes en producto | ✅ Funcionan | ✅ Funcionan |
| Origen de imágenes | Mixto (Bsale CDN + Shopify) | Shopify CDN |
| Thumbnails Bsale | Generados correctamente | Fallan para imágenes Shopify |

## Hipótesis del bug

El tema/plantilla de la tienda Nebro genera URLs de thumbnails incorrectamente cuando la imagen original está en un dominio externo (Shopify CDN). Posibles causas:

1. **El thumbnail no se genera** en el CDN de Bsale porque la imagen original es una URL externa
2. **La URL del thumbnail está mal formada** en el template del grid
3. **El tema de Nebro usa un método diferente** al de Moreka para obtener thumbnails

## Soluciones posibles

### Opción A: Subir imágenes directamente a Bsale (Recomendada)
Asegurar que las imágenes de productos estén subidas al CDN de Bsale, no solo referenciadas por URL externa. Esto garantiza que los thumbnails se generen correctamente.

### Opción B: Fix en el tema/plantilla
Modificar el template del grid para que use la URL original (`urlImg`) en lugar de intentar generar un thumbnail del CDN de Bsale.

### Opción C: Sincronización de imágenes
Implementar en `product-sync-bsale` que, además de sincronizar la URL de imagen, también **suba la imagen al CDN de Bsale** para que el thumbnail se genere automáticamente.

## Archivos relevantes
- `product-sync-bsale/src/services/bsaleService.ts` — Lógica de sincronización
- `product-sync-bsale/src/services/productSyncService.ts` — Sync de productos
- Configuración de tema en panel de administración de Bsale

## Próximos pasos
1. Verificar en panel de Bsale si los productos afectados tienen imágenes subidas localmente o solo URLs externas
2. Probar Opción B (fix en tema) si se tiene acceso al código del tema
3. Implementar Opción C en product-sync-bsale para futuros productos
