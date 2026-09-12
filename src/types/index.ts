// ============================================
// BSale Types
// ============================================

export interface BsaleStock {
  variantId: number;
  quantity: number;
  quantityAvailable: number;
  quantityReserved: number;
  variant?: BsaleVariant; // Cuando se usa expand=variant
}

export interface BsaleVariant {
  id: number;
  description: string;
  code: string;           // SKU
  barcode: string;
  productId: number;
  productName: string;
  stock: BsaleStock[];
}

export interface BsaleProduct {
  id: number;
  name: string;
  description: string;
  productTypeId: number;
  variants: BsaleVariant[];
}

export interface BsaleStockResponse {
  items: BsaleStock[];
  count: number;
}

export interface BsaleVariantResponse {
  items: BsaleVariant[];
  count: number;
}

export interface BsaleWebhookPayload {
  topic: string;
  officeId: number;
  resource: string;
  resourceId: number;
  action: string;
  timestamp: number;
}

// ============================================
// Amazon SP-API Types
// ============================================

export interface AmazonInventoryItem {
  sellerSku: string;
  quantity: number;
  fulfillmentChannelSku?: string;
  supplyDetail?: AmazonSupplyDetail[];
}

export interface AmazonSupplyDetail {
  supplyType: string;
  quantity: number;
  earliestAvailableToPick?: AmazonDateTime;
  latestAvailableToPick?: AmazonDateTime;
}

export interface AmazonDateTime {
  time?: string;
  precision?: string;
}

export interface AmazonInventoryPayload {
  inventory: AmazonInventoryItem[];
}

export interface AmazonTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// ============================================
// Sync Types
// ============================================

export interface SkuMapping {
  bsaleSku: string;
  amazonSku: string;
}

export interface SyncResult {
  bsaleSku: string;
  amazonSku: string;
  bsaleStock: number;
  amazonStockUpdated: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface SyncLog {
  id: string;
  startedAt: string;
  finishedAt?: string;
  totalProducts: number;
  successCount: number;
  errorCount: number;
  results: SyncResult[];
  triggeredBy: 'webhook' | 'scheduled' | 'manual';
}
