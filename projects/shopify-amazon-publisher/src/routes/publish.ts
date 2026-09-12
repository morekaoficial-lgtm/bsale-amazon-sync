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
    
    // Transformar para preview
    const listing = transformer.transform(product);
    
    res.json({
      shopify: {
        id: product.id,
        title: product.title,
        description: product.description,
        sku: product.variants[0]?.sku,
        price: product.variants[0]?.price,
        images: product.images.map(img => img.src),
      },
      amazon: listing,
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
    
    // Transformar
    const listing = transformer.transform(product);
    
    // Forzar stock = 1 si el usuario lo pidió
    if (req.body.stock !== undefined && listing.attributes) {
      listing.attributes.fulfillmentAvailability = [{
        quantity: req.body.stock,
        fulfillmentChannelCode: 'DEFAULT',
      }];
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
