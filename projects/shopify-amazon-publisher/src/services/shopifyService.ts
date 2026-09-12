import axios from 'axios';
import { config } from '../config';
import { ShopifyProduct } from '../types';

export class ShopifyService {
  private client = axios.create({
    baseURL: `https://${config.shopify.storeDomain}/admin/api/${config.shopify.apiVersion}`,
    headers: {
      'X-Shopify-Access-Token': config.shopify.accessToken,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  async getAllProducts(limit: number = 250): Promise<ShopifyProduct[]> {
    const products: ShopifyProduct[] = [];
    let url: string | null = `/products.json?limit=${Math.min(limit, 50)}`;
    
    while (url && products.length < limit) {
      console.log(`[Shopify] Obteniendo productos...`);
      const response = await this.client.get(url);
      const items = response.data.products || [];
      
      products.push(...items);
      console.log(`[Shopify] Obtenidos ${items.length} productos (total: ${products.length})`);
      
      // Paginación via link header
      const linkHeader = response.headers.link;
      url = this.extractNextUrl(linkHeader);
    }
    
    return products;
  }

  async getProduct(productId: string): Promise<ShopifyProduct | null> {
    try {
      const response = await this.client.get(`/products/${productId}.json`);
      return response.data.product || null;
    } catch (error) {
      console.error(`[Shopify] Error obteniendo producto ${productId}:`, error);
      return null;
    }
  }

  async getProductBySku(sku: string): Promise<ShopifyProduct | null> {
    const products = await this.getAllProducts(250);
    return products.find(p => p.variants.some(v => v.sku === sku)) || null;
  }

  async getProductCount(): Promise<number> {
    try {
      const response = await this.client.get('/products/count.json');
      return response.data.count || 0;
    } catch (error) {
      console.error('[Shopify] Error obteniendo conteo:', error);
      return 0;
    }
  }

  private extractNextUrl(linkHeader: string | undefined): string | null {
    if (!linkHeader) return null;
    const match = linkHeader.match(/<([^>]+)>\s*;\s*rel="next"/);
    return match ? match[1] : null;
  }
}
