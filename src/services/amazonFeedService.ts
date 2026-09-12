import axios from 'axios';
import { config } from '../config';
import { apiLogger } from './apiLogger';

/**
 * Servicio de Feeds API de Amazon para actualización masiva de inventario
 * Envía múltiples SKUs en un solo feed XML (mucho más eficiente)
 */
export class AmazonFeedService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  
  private readonly spApiEndpoint = 'https://sellingpartnerapi-na.amazon.com';
  private readonly tokenEndpoint = 'https://api.amazon.com/auth/o2/token';

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken!;
    }
    
    const response = await axios.post(
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
    return this.accessToken!;
  }

  /**
   * Genera XML de feed de inventario para múltiples SKUs
   * Formato: POST_PRODUCT_DATA o POST_INVENTORY_AVAILABILITY_DATA
   */
  private generateInventoryFeedXml(items: Array<{ sku: string; quantity: number }>): string {
    const messages = items.map((item, index) => `
      <Message>
        <MessageID>${index + 1}</MessageID>
        <OperationType>Update</OperationType>
        <Inventory>
          <SKU>${this.escapeXml(item.sku)}</SKU>
          <Quantity>${item.quantity}</Quantity>
          <FulfillmentLatency>1</FulfillmentLatency>
        </Inventory>
      </Message>`).join('\n');

    return `<?xml version="1.0" encoding="utf-8"?>
<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
  <Header>
    <DocumentVersion>1.01</DocumentVersion>
    <MerchantIdentifier>${config.amazon.sellerId}</MerchantIdentifier>
  </Header>
  <MessageType>Inventory</MessageType>
  ${messages}
</AmazonEnvelope>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Crear documento de feed en Amazon
   */
  private async createFeedDocument(): Promise<{ uploadUrl: string; encryptionDetails?: any; feedDocumentId: string }> {
    const token = await this.getAccessToken();
    
    const logEntry = apiLogger.log({
      service: 'amazon-feeds',
      method: 'POST',
      endpoint: '/feeds/2021-06-30/documents',
      status: 'pending',
      requestData: { contentType: 'text/xml; charset=utf-8' },
      durationMs: 0,
    });

    const start = Date.now();
    try {
      const response = await axios.post(
        `${this.spApiEndpoint}/feeds/2021-06-30/documents`,
        { contentType: 'text/xml; charset=utf-8' },
        {
          headers: {
            'x-amz-access-token': token,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const result = {
        uploadUrl: response.data.url,
        encryptionDetails: response.data.encryptionDetails,
        feedDocumentId: response.data.feedDocumentId,
      };

      logEntry.status = 'success';
      logEntry.statusCode = response.status;
      logEntry.durationMs = Date.now() - start;
      return result;
    } catch (error: any) {
      logEntry.status = 'error';
      logEntry.statusCode = error.response?.status;
      logEntry.errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
      logEntry.durationMs = Date.now() - start;
      throw error;
    }
  }

  /**
   * Subir XML al URL de Amazon
   */
  private async uploadFeedDocument(uploadUrl: string, xmlContent: string, encryptionDetails?: any): Promise<void> {
    // Si hay encriptación, necesitaríamos cifrar. Por ahora asumimos que no es necesario
    // para feeds pequeños. Si falla, se puede agregar lógica de cifrado.
    
    const logEntry = apiLogger.log({
      service: 'amazon-feeds',
      method: 'PUT',
      endpoint: uploadUrl.substring(0, 60) + '...',
      status: 'pending',
      requestData: { size: xmlContent.length },
      durationMs: 0,
    });

    const start = Date.now();
    try {
      await axios.put(uploadUrl, xmlContent, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        timeout: 60000,
      });

      logEntry.status = 'success';
      logEntry.statusCode = 200;
      logEntry.durationMs = Date.now() - start;
    } catch (error: any) {
      logEntry.status = 'error';
      logEntry.statusCode = error.response?.status;
      logEntry.errorMessage = error.message;
      logEntry.durationMs = Date.now() - start;
      throw error;
    }
  }

  /**
   * Crear el feed en Amazon
   */
  private async createFeed(feedDocumentId: string): Promise<string> {
    const token = await this.getAccessToken();
    
    const logEntry = apiLogger.log({
      service: 'amazon-feeds',
      method: 'POST',
      endpoint: '/feeds/2021-06-30/feeds',
      status: 'pending',
      requestData: { feedType: 'POST_INVENTORY_AVAILABILITY_DATA', feedDocumentId },
      durationMs: 0,
    });

    const start = Date.now();
    try {
      const response = await axios.post(
        `${this.spApiEndpoint}/feeds/2021-06-30/feeds`,
        {
          feedType: 'POST_INVENTORY_AVAILABILITY_DATA',
          marketplaceIds: [config.amazon.marketplaceId],
          inputFeedDocumentId: feedDocumentId,
        },
        {
          headers: {
            'x-amz-access-token': token,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      logEntry.status = 'success';
      logEntry.statusCode = response.status;
      logEntry.durationMs = Date.now() - start;
      return response.data.feedId;
    } catch (error: any) {
      logEntry.status = 'error';
      logEntry.statusCode = error.response?.status;
      logEntry.errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
      logEntry.durationMs = Date.now() - start;
      throw error;
    }
  }

  /**
   * Consultar estado del feed
   */
  private async getFeedStatus(feedId: string): Promise<{ status: string; resultFeedDocumentId?: string }> {
    const token = await this.getAccessToken();
    
    const response = await axios.get(
      `${this.spApiEndpoint}/feeds/2021-06-30/feeds/${feedId}`,
      {
        headers: { 'x-amz-access-token': token },
        timeout: 30000,
      }
    );

    return {
      status: response.data.processingStatus,
      resultFeedDocumentId: response.data.resultFeedDocumentId,
    };
  }

  /**
   * Actualizar inventario de múltiples SKUs en UNA SOLA llamada
   * Usa Amazon Feeds API en lugar de llamadas individuales
   */
  async updateInventoryBulk(items: Array<{ sku: string; quantity: number }>): Promise<{
    success: boolean;
    feedId?: string;
    message: string;
    processedCount: number;
  }> {
    if (!config.amazon.sellerId) {
      return {
        success: false,
        message: 'AMAZON_SELLER_ID no configurado en .env',
        processedCount: 0,
      };
    }

    if (items.length === 0) {
      return {
        success: true,
        message: 'No hay items para sincronizar',
        processedCount: 0,
      };
    }

    console.log(`[AmazonFeedService] Enviando ${items.length} SKUs en feed masivo...`);

    try {
      // 1. Generar XML
      const xmlContent = this.generateInventoryFeedXml(items);
      console.log(`[AmazonFeedService] XML generado (${xmlContent.length} bytes)`);

      // 2. Crear documento de feed
      const { uploadUrl, feedDocumentId } = await this.createFeedDocument();
      console.log(`[AmazonFeedService] Documento creado: ${feedDocumentId}`);

      // 3. Subir XML
      await this.uploadFeedDocument(uploadUrl, xmlContent);
      console.log(`[AmazonFeedService] XML subido exitosamente`);

      // 4. Crear feed
      const feedId = await this.createFeed(feedDocumentId);
      console.log(`[AmazonFeedService] Feed creado: ${feedId}`);

      // 5. Polling corto del estado (máximo 30 segundos)
      const maxAttempts = 6;
      const delayMs = 5000; // 5 segundos
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(r => setTimeout(r, delayMs));
        
        const status = await this.getFeedStatus(feedId);
        console.log(`[AmazonFeedService] Estado del feed (intento ${attempt}/${maxAttempts}): ${status.status}`);

        if (status.status === 'DONE') {
          return {
            success: true,
            feedId,
            message: 'Feed procesado exitosamente',
            processedCount: items.length,
          };
        }

        if (status.status === 'FATAL' || status.status === 'CANCELLED') {
          return {
            success: false,
            feedId,
            message: `Feed falló con estado: ${status.status}`,
            processedCount: 0,
          };
        }

        // Si sigue en progreso, continuar polling
      }

      return {
        success: true,
        feedId,
        message: `Feed enviado (${items.length} SKUs). Procesamiento en curso en Amazon (FeedID: ${feedId})`,
        processedCount: items.length,
      };

    } catch (error: any) {
      console.error('[AmazonFeedService] Error en feed masivo:', error.response?.data || error.message);
      return {
        success: false,
        message: `Error: ${error.response?.data?.errors?.[0]?.message || error.message}`,
        processedCount: 0,
      };
    }
  }
}
