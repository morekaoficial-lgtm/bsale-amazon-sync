import axios from 'axios';
import { config } from '../config';
import { AmazonTokenResponse } from '../types';
import { apiLogger } from './apiLogger';

export class AmazonService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  
  private readonly spApiEndpoint = 'https://sellingpartnerapi-na.amazon.com';
  private readonly tokenEndpoint = 'https://api.amazon.com/auth/o2/token';

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }
    
    const logEntry = apiLogger.log({
      service: 'amazon',
      method: 'POST',
      endpoint: '/auth/o2/token',
      status: 'pending',
      requestData: { grant_type: 'refresh_token', client_id: config.amazon.lwaClientId },
      durationMs: 0,
    });

    const start = Date.now();
    try {
      const response = await axios.post<AmazonTokenResponse>(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: config.amazon.refreshToken,
          client_id: config.amazon.lwaClientId,
          client_secret: config.amazon.lwaClientSecret,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 30000,
        }
      );
      
      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
      
      logEntry.status = 'success';
      logEntry.statusCode = response.status;
      logEntry.durationMs = Date.now() - start;
      console.log('[AmazonService] Token renovado exitosamente');
      return this.accessToken;
    } catch (error: any) {
      logEntry.status = 'error';
      logEntry.statusCode = error.response?.status;
      logEntry.errorMessage = error.response?.data?.error_description || error.message;
      logEntry.durationMs = Date.now() - start;
      console.error('[AmazonService] Error obteniendo token:', error.response?.data || error.message);
      throw new Error(`No se pudo obtener token de Amazon: ${error.message}`);
    }
  }

  /**
   * Obtener el productType actual de un listing en Amazon
   * Necesario para hacer PATCH correctamente
   */
  async getProductType(sku: string): Promise<string | null> {
    if (!config.amazon.sellerId) {
      console.error('[AmazonService] AMAZON_SELLER_ID no configurado en .env');
      return null;
    }

    const logEntry = apiLogger.log({
      service: 'amazon',
      method: 'GET',
      endpoint: `/listings/2021-08-01/items/${config.amazon.sellerId}/${sku}`,
      status: 'pending',
      requestData: { sku },
      durationMs: 0,
    });

    const start = Date.now();
    try {
      const token = await this.getAccessToken();
      const url = `${this.spApiEndpoint}/listings/2021-08-01/items/${config.amazon.sellerId}/${encodeURIComponent(sku)}`;
      
      const response = await axios.get(url, {
        headers: { 'x-amz-access-token': token },
        params: { 
          marketplaceIds: config.amazon.marketplaceId,
          includedData: 'productTypes' 
        },
        timeout: 30000,
      });
      
      const productType = response.data?.productTypes?.[0]?.productType || response.data?.productType || null;
      
      logEntry.status = 'success';
      logEntry.statusCode = response.status;
      logEntry.responseData = { productType };
      logEntry.durationMs = Date.now() - start;
      
      console.log(`[AmazonService] ProductType para ${sku}: ${productType}`);
      return productType;
    } catch (error: any) {
      logEntry.status = 'error';
      logEntry.statusCode = error.response?.status;
      logEntry.errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
      logEntry.durationMs = Date.now() - start;
      console.error(`[AmazonService] Error obteniendo productType de ${sku}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Actualizar stock de UN solo SKU
   * Primero obtiene el productType actual del listing, luego hace PATCH
   */
  async updateInventory(sku: string, quantity: number): Promise<boolean> {
    if (!sku || sku.trim() === '' || sku === 'undefined') {
      console.warn(`[AmazonService] SKU inválido: "${sku}". Saltando.`);
      apiLogger.log({
        service: 'amazon',
        method: 'PATCH',
        endpoint: `/listings/2021-08-01/items/${config.amazon.sellerId || 'NO_SELLER_ID'}/INVALID`,
        status: 'error',
        requestData: { sku, quantity },
        errorMessage: 'SKU vacío, undefined o inválido',
        durationMs: 0,
      });
      return false;
    }

    // Verificar sellerId configurado
    if (!config.amazon.sellerId) {
      console.error('[AmazonService] AMAZON_SELLER_ID no configurado. Agrega AMAZON_SELLER_ID=AXQI2Q6N4EJYU al .env');
      apiLogger.log({
        service: 'amazon',
        method: 'PATCH',
        endpoint: '/listings/2021-08-01/items/NO_SELLER_ID/...',
        status: 'error',
        requestData: { sku, quantity },
        errorMessage: 'AMAZON_SELLER_ID no configurado en .env',
        durationMs: 0,
      });
      return false;
    }

    // 1. Obtener productType actual del listing
    const productType = await this.getProductType(sku);
    
    if (!productType) {
      console.error(`[AmazonService] No se pudo obtener productType para ${sku}. El producto puede no existir en Amazon.`);
      apiLogger.log({
        service: 'amazon',
        method: 'PATCH',
        endpoint: `/listings/2021-08-01/items/${config.amazon.marketplaceId}/${sku}`,
        status: 'error',
        requestData: { sku, quantity },
        errorMessage: 'No se pudo obtener productType. El producto puede no existir en Amazon.',
        durationMs: 0,
      });
      return false;
    }

    // 2. Hacer PATCH con el productType correcto
    const logEntry = apiLogger.log({
      service: 'amazon',
      method: 'PATCH',
      endpoint: `/listings/2021-08-01/items/${config.amazon.sellerId}/${sku}`,
      status: 'pending',
      requestData: { sku, quantity, productType, fulfillment_channel: 'DEFAULT' },
      durationMs: 0,
    });

    const start = Date.now();
    try {
      const token = await this.getAccessToken();
      
      const url = `${this.spApiEndpoint}/listings/2021-08-01/items/${config.amazon.sellerId}/${encodeURIComponent(sku)}`;
      
      const payload = {
        productType: productType,
        patches: [
          {
            op: 'replace',
            path: '/attributes/fulfillment_availability',
            value: [
              {
                quantity: quantity,
                fulfillment_channel_code: 'DEFAULT',
              }
            ]
          }
        ]
      };
      
      console.log(`[AmazonService] PATCH URL: ${url}`);
      console.log(`[AmazonService] PATCH Payload:`, JSON.stringify(payload, null, 2));
      
      const response = await axios.patch(url, payload, {
        headers: {
          'x-amz-access-token': token,
          'Content-Type': 'application/json',
        },
        params: { marketplaceIds: config.amazon.marketplaceId },
        timeout: 30000,
      });
      
      logEntry.status = 'success';
      logEntry.statusCode = response.status;
      logEntry.durationMs = Date.now() - start;
      console.log(`[AmazonService] Stock actualizado para SKU ${sku}: ${quantity} unidades (productType: ${productType})`);
      return true;
    } catch (error: any) {
      logEntry.status = 'error';
      logEntry.statusCode = error.response?.status;
      logEntry.errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
      logEntry.durationMs = Date.now() - start;
      console.error(`[AmazonService] Error actualizando stock para ${sku}:`);
      console.error('  Status:', error.response?.status);
      console.error('  Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('  Payload enviado:', JSON.stringify({
        productType: productType,
        patches: [
          {
            op: 'replace',
            path: '/attributes/fulfillment_availability',
            value: [{ quantity, fulfillment_channel_code: 'DEFAULT' }]
          }
        ]
      }, null, 2));
      return false;
    }
  }

  /**
   * Actualizar stock de MÚLTIPLES SKUs (uno por uno con delay)
   */
  async updateInventoryBulk(skus: Array<{ sku: string; quantity: number }>): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const item of skus) {
      try {
        results[item.sku] = await this.updateInventory(item.sku, item.quantity);
        await new Promise(r => setTimeout(r, 1000)); // 1 segundo entre llamadas
      } catch (error) {
        results[item.sku] = false;
      }
    }
    return results;
  }

  async getInventory(sku: string): Promise<number> {
    const logEntry = apiLogger.log({
      service: 'amazon',
      method: 'GET',
      endpoint: `/fba/inventory/v1/items?sku=${sku}`,
      status: 'pending',
      requestData: { sku },
      durationMs: 0,
    });

    const start = Date.now();
    try {
      const token = await this.getAccessToken();
      const url = `${this.spApiEndpoint}/fba/inventory/v1/items`;
      
      const response = await axios.get(url, {
        headers: { 'x-amz-access-token': token },
        params: {
          marketplaceIds: config.amazon.marketplaceId,
          sellerSkus: sku,
          details: true,
        },
        timeout: 30000,
      });
      
      const items = response.data.inventorySummaries || [];
      const qty = items.length > 0 ? (items[0].totalQuantity || 0) : 0;
      
      logEntry.status = 'success';
      logEntry.statusCode = response.status;
      logEntry.responseData = { quantity: qty };
      logEntry.durationMs = Date.now() - start;
      return qty;
    } catch (error: any) {
      logEntry.status = 'error';
      logEntry.statusCode = error.response?.status;
      logEntry.errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
      logEntry.durationMs = Date.now() - start;
      console.error(`[AmazonService] Error obteniendo stock de ${sku}:`, error.response?.data || error.message);
      return 0;
    }
  }
}
