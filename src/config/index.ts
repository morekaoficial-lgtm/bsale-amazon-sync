import 'dotenv/config';

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3004', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  bsale: {
    token: process.env.BSALE_API_TOKEN || '',
    baseUrl: process.env.BSALE_BASE_URL || 'https://api.bsale.io/v1',
    officeId: parseInt(process.env.BSALE_OFFICE_ID || '2', 10),
  },
  
  amazon: {
    lwaClientId: process.env.AMAZON_LWA_CLIENT_ID || '',
    lwaClientSecret: process.env.AMAZON_LWA_CLIENT_SECRET || '',
    refreshToken: process.env.AMAZON_REFRESH_TOKEN || '',
    marketplaceId: process.env.AMAZON_MARKETPLACE_ID || 'A1AM78C64UM0Y8',
    productType: process.env.AMAZON_PRODUCT_TYPE || 'PRODUCT',
    sellerId: process.env.AMAZON_SELLER_ID || '',
  },
  
  sync: {
    intervalMinutes: 0, // SOLO webhook, NUNCA auto-sync periódico
    stockThreshold: parseInt(process.env.STOCK_THRESHOLD || '0', 10),
  },
};
