import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BsaleProduct, BsaleStockResponse, BsaleVariant, BsaleVariantResponse, BsaleWebhookPayload } from '../types';
import { config } from '../config';
import { apiLogger } from './apiLogger';

export class BsaleService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: config.bsale.baseUrl,
      headers: {
        'access_token': config.bsale.token,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  private async request<T>(method: string, endpoint: string, params?: any, data?: any): Promise<AxiosResponse<T>> {
    const logEntry = apiLogger.log({
      service: 'bsale',
      method,
      endpoint,
      status: 'pending',
      requestData: data || params,
      durationMs: 0,
    });

    const start = Date.now();
    try {
      const response = await this.client.request<T>({ method, url: endpoint, params, data });
      logEntry.status = 'success';
      logEntry.statusCode = response.status;
      logEntry.responseData = { count: Array.isArray(response.data) ? response.data.length : 1 };
      logEntry.durationMs = Date.now() - start;
      return response;
    } catch (error: any) {
      logEntry.status = 'error';
      logEntry.statusCode = error.response?.status;
      logEntry.errorMessage = error.response?.data?.error || error.message;
      logEntry.durationMs = Date.now() - start;
      throw error;
    }
  }

  async getVariantsWithStock(limit: number = 50): Promise<BsaleVariant[]> {
    try {
      const response = await this.request<BsaleStockResponse>('GET', '/stocks.json', {
        limit,
        officeid: config.bsale.officeId,
        expand: 'variant,variant.product',
      });
      
      // Mapear items de stock a variantes (el SKU viene en variant.code)
      const items = response.data.items || [];
      const variants: BsaleVariant[] = [];
      
      for (const item of items) {
        if (item.variant) {
          variants.push({
            ...item.variant,
            stock: [{
              variantId: item.variantId,
              quantity: item.quantity,
              quantityAvailable: item.quantityAvailable,
              quantityReserved: item.quantityReserved,
            }],
          });
        }
      }
      
      console.log(`[BsaleService] ${variants.length} variantes con SKU encontradas de ${items.length} items de stock`);
      return variants;
    } catch (error) {
      console.error('[BsaleService] Error obteniendo variantes:', (error as Error).message);
      throw error;
    }
  }

  async getStockByVariantId(variantId: number): Promise<number> {
    try {
      console.log(`[BsaleService] Buscando stock para variantId=${variantId}, officeId=${config.bsale.officeId}`);
      
      const response = await this.request<BsaleStockResponse>('GET', '/stocks.json', {
        variantid: variantId,
        officeid: config.bsale.officeId,
      });
      
      console.log(`[BsaleService] Respuesta de /stocks.json para variantId=${variantId}:`, JSON.stringify(response.data, null, 2));
      
      const items = response.data.items || [];
      if (items.length === 0) {
        console.warn(`[BsaleService] No hay stock para variante ${variantId}`);
        return 0;
      }
      const qty = items[0].quantityAvailable || 0;
      console.log(`[BsaleService] Stock para variante ${variantId}: quantityAvailable=${qty}`);
      return qty;
    } catch (error) {
      console.error(`[BsaleService] Error obteniendo stock para variante ${variantId}:`, (error as Error).message);
      throw error;
    }
  }

  async getStockBySku(sku: string): Promise<number> {
    try {
      console.log(`[BsaleService] Buscando SKU "${sku}" en BSale...`);
      
      const response = await this.request<BsaleVariantResponse>('GET', '/variants.json', {
        code: sku,
        limit: 1,
      });
      
      console.log(`[BsaleService] Respuesta de /variants.json para code=${sku}:`, JSON.stringify(response.data, null, 2));
      
      const items = response.data.items || [];
      if (items.length === 0) {
        console.warn(`[BsaleService] SKU ${sku} no encontrado en BSale (code no coincide)`);
        return 0;
      }
      
      const variantId = items[0].id;
      console.log(`[BsaleService] SKU ${sku} encontrado, variantId=${variantId}`);
      
      const stock = await this.getStockByVariantId(variantId);
      console.log(`[BsaleService] Stock final para SKU ${sku}: ${stock}`);
      return stock;
    } catch (error) {
      console.error(`[BsaleService] Error obteniendo stock por SKU ${sku}:`, (error as Error).message);
      throw error;
    }
  }

  async getVariantById(variantId: number): Promise<BsaleVariant | null> {
    try {
      const response = await this.request<{ variant: BsaleVariant }>('GET', `/variants/${variantId}.json`);
      return response.data.variant || null;
    } catch (error) {
      console.error(`[BsaleService] Error obteniendo variante ${variantId}:`, (error as Error).message);
      return null;
    }
  }

  async getProductById(productId: number): Promise<BsaleProduct | null> {
    try {
      const response = await this.request<{ product: BsaleProduct }>('GET', `/products/${productId}.json`, {
        expand: 'variants,variants.stock',
      });
      return response.data.product || null;
    } catch (error) {
      console.error(`[BsaleService] Error obteniendo producto ${productId}:`, (error as Error).message);
      return null;
    }
  }

  async processWebhook(payload: BsaleWebhookPayload): Promise<Array<{ sku: string; stock: number }>> {
    console.log(`[BsaleService] Webhook recibido: ${payload.topic} | Action: ${payload.action} | ResourceId: ${payload.resourceId}`);
    
    if (payload.topic === 'stock') {
      const result = await this.processStockWebhook(payload.resourceId);
      return result ? [result] : [];
    }
    
    if (payload.topic === 'document') {
      return this.processDocumentWebhook(payload.resourceId);
    }
    
    console.log(`[BsaleService] Webhook ignorado (topic=${payload.topic})`);
    return [];
  }

  private async processStockWebhook(variantId: number): Promise<{ sku: string; stock: number } | null> {
    const variant = await this.getVariantById(variantId);
    if (!variant) {
      console.warn(`[BsaleService] Variante ${variantId} no encontrada`);
      return null;
    }
    const stock = await this.getStockByVariantId(variant.id);
    return { sku: variant.code, stock };
  }

  private async processDocumentWebhook(documentId: number): Promise<Array<{ sku: string; stock: number }>> {
    try {
      const response = await this.request<any>('GET', `/documents/${documentId}.json`, {
        expand: 'details,details.variant',
      });
      
      const document = response.data.document;
      if (!document || !document.details || document.details.length === 0) {
        console.warn(`[BsaleService] Documento ${documentId} sin detalles`);
        return [];
      }
      
      const results: Array<{ sku: string; stock: number }> = [];
      const processedSkus = new Set<string>();
      
      for (const detail of document.details) {
        if (!detail.variantId) continue;
        const variant = await this.getVariantById(detail.variantId);
        if (!variant) continue;
        if (processedSkus.has(variant.code)) continue;
        processedSkus.add(variant.code);
        const stock = await this.getStockByVariantId(variant.id);
        console.log(`[BsaleService] Documento ${documentId} → SKU: ${variant.code}, Stock actual: ${stock}`);
        results.push({ sku: variant.code, stock });
      }
      
      return results;
    } catch (error) {
      console.error(`[BsaleService] Error procesando documento ${documentId}:`, (error as Error).message);
      return [];
    }
  }
}
