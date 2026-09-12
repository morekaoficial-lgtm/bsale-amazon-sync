import axios from 'axios';
import { config } from '../config';
import { AmazonProductListing, PublishResult } from '../types';

export class AmazonPublishService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  
  private readonly spApiEndpoint = 'https://sellingpartnerapi-na.amazon.com';
  private readonly tokenEndpoint = 'https://api.amazon.com/auth/o2/token';

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }
    
    try {
      const refreshToken = process.env.AMAZON_REFRESH_TOKEN || config.amazon.refreshToken;
      const clientId = process.env.AMAZON_LWA_CLIENT_ID || config.amazon.lwaClientId;
      const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET || config.amazon.lwaClientSecret;
      
      console.log('[Amazon] Solicitando token...');
      
      const response = await axios.post(this.tokenEndpoint, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      });
      
      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
      
      console.log('[Amazon] ✅ Token obtenido');
      return this.accessToken!;
    } catch (error: any) {
      console.error('[Amazon] ❌ Error obteniendo token:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }

  async createListing(listing: AmazonProductListing): Promise<PublishResult> {
    try {
      const token = await this.getAccessToken();
      
      const sellerId = config.amazon.sellerId;
      const marketplaceId = config.amazon.marketplaceId;
      
      // Construir payload según si es listing nuevo o oferta en existente
      const attributes: any = {
        condition_type: [{
          value: 'new_new',
          marketplace_id: marketplaceId
        }],
        fulfillment_availability: [{
          quantity: listing.quantity || 1,
          fulfillment_channel_code: 'DEFAULT',
          marketplace_id: marketplaceId
        }]
      };
      
      // Si tenemos ASIN, crear oferta en listing existente
      if (listing.asin) {
        attributes.merchant_suggested_asin = [{
          value: listing.asin,
          marketplace_id: marketplaceId
        }];
      }
      
      // Si tenemos identificador externo (EAN/UPC)
      if (listing.externalId) {
        attributes.externally_assigned_product_identifier = [{
          value: listing.externalId,
          type: listing.externalIdType || 'ean',
          marketplace_id: marketplaceId
        }];
      }
      
      // Para listings nuevos, agregar atributos completos
      if (!listing.asin && listing.attributes) {
        Object.assign(attributes, listing.attributes);
      }
      
      const payload = {
        productType: listing.productType,
        requirements: listing.asin ? 'LISTING_OFFER_ONLY' : 'LISTING',
        attributes
      };
      
      console.log(`[Amazon] 📤 Publicando SKU: ${listing.sellerSku}...`);
      
      const url = `${this.spApiEndpoint}/listings/2021-08-01/items/${sellerId}/${listing.sellerSku}?marketplaceIds=${marketplaceId}`;
      
      const response = await axios.put(url, payload, {
        headers: {
          'x-amz-access-token': token,
          'Content-Type': 'application/json',
        },
      });
      
      const result = response.data;
      
      if (result.status === 'ACCEPTED') {
        console.log(`[Amazon] ✅ Producto publicado exitosamente`);
        return {
          shopifyProductId: listing.shopifyProductId || '',
          sku: listing.sellerSku,
          success: true,
          amazonSku: listing.sellerSku,
          message: 'Producto publicado exitosamente en Amazon México',
          timestamp: new Date().toISOString(),
        };
      } else {
        const issues = result.issues?.map((i: any) => i.message).join('; ') || 'Errores de validación';
        console.log(`[Amazon] ⚠️ Producto con issues: ${issues}`);
        return {
          shopifyProductId: listing.shopifyProductId || '',
          sku: listing.sellerSku,
          success: false,
          amazonSku: listing.sellerSku,
          message: issues,
          errors: result.issues || [],
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error('[Amazon] ❌ Error:', JSON.stringify(errorData, null, 2) || error.message);
      
      return {
        shopifyProductId: listing.shopifyProductId || '',
        sku: listing.sellerSku,
        success: false,
        amazonSku: listing.sellerSku,
        message: 'Error publicando en Amazon',
        errors: errorData?.errors?.map((e: any) => e.message) || [error.message],
        timestamp: new Date().toISOString(),
      };
    }
  }

  async searchExistingProducts(keywords: string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const marketplaceId = config.amazon.marketplaceId;
      
      const response = await axios.get(
        `${this.spApiEndpoint}/catalog/2022-04-01/items?marketplaceIds=${marketplaceId}&keywords=${encodeURIComponent(keywords)}&includedData=identifiers,summaries`,
        {
          headers: {
            'x-amz-access-token': token,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.items || [];
    } catch (error: any) {
      console.error('[Amazon] Error buscando productos:', error.message);
      return [];
    }
  }

  async uploadImage(sku: string, imageUrl: string): Promise<boolean> {
    console.log(`[Amazon] Subir imagen para ${sku}: ${imageUrl}`);
    return true;
  }
}
