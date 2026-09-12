import { Router, Request, Response } from 'express';
import { ShopifyService } from '../services/shopifyService';
import { ProductTransformer } from '../services/productTransformer';
import { AmazonPublishService } from '../services/amazonPublishService';

const router = Router();
const shopify = new ShopifyService();
const transformer = new ProductTransformer();
const amazon = new AmazonPublishService();

// Buscar producto por SKU
router.get('/sku/:sku', async (req: Request, res: Response) => {
  try {
    const product = await shopify.getProductBySku(req.params.sku);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    
    // Buscar si ya existe en Amazon
    const searchResults = await amazon.searchExistingProducts(product.title);
    const existingProduct = searchResults.find((item: any) => 
      item.summaries?.[0]?.brand?.toLowerCase() === (product.vendor || '').toLowerCase()
    );
    
    // Transformar para preview
    const listing = transformer.transform(
      product, 
      existingProduct?.asin,
      existingProduct?.identifiers?.[0]?.identifiers?.[0]?.identifier
    );
    
    res.json({
      shopify: {
        id: product.id,
        title: product.title,
        description: product.description,
        sku: product.variants[0]?.sku,
        price: product.variants[0]?.price,
        images: product.images.map(img => img.src),
      },
      amazon: {
        ...listing,
        existingAsin: existingProduct?.asin || null,
        existingTitle: existingProduct?.summaries?.[0]?.itemName || null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Publicar producto en Amazon
router.post('/sku/:sku', async (req: Request, res: Response) => {
  try {
    const product = await shopify.getProductBySku(req.params.sku);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    
    // Buscar si ya existe en Amazon
    const searchResults = await amazon.searchExistingProducts(product.title);
    const existingProduct = searchResults.find((item: any) => 
      item.summaries?.[0]?.brand?.toLowerCase() === (product.vendor || '').toLowerCase()
    );
    
    // Transformar con ASIN si existe
    const listing = transformer.transform(
      product,
      existingProduct?.asin,
      existingProduct?.identifiers?.[0]?.identifiers?.[0]?.identifier
    );
    
    // Forzar stock si el usuario lo pidió
    if (req.body.stock !== undefined) {
      listing.quantity = req.body.stock;
    }
    
    // Publicar en Amazon
    const result = await amazon.createListing(listing);
    
    res.json({
      success: result.success,
      sku: req.params.sku,
      amazonSku: result.amazonSku,
      message: result.message,
      errors: result.errors,
      timestamp: result.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
