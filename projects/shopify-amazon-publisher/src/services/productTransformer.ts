import { ShopifyProduct, AmazonProductListing, AmazonAttributes } from '../types';

export class ProductTransformer {
  /**
   * Transforma un producto de Shopify a formato Amazon
   * Si se proporciona un ASIN existente, crea una oferta en lugar de un listing nuevo
   */
  transform(shopifyProduct: ShopifyProduct, existingAsin?: string, externalId?: string): AmazonProductListing {
    const variant = shopifyProduct.variants[0];
    const sku = variant?.sku || shopifyProduct.id;
    
    // Para ofertas en listings existentes, solo necesitamos campos básicos
    if (existingAsin) {
      return {
        shopifyProductId: shopifyProduct.id,
        sellerSku: sku,
        productType: this.detectProductType(shopifyProduct),
        requirements: 'LISTING_OFFER_ONLY',
        asin: existingAsin,
        externalId: externalId,
        externalIdType: externalId ? 'ean' : undefined,
        quantity: variant?.inventoryQuantity || 1,
      };
    }
    
    // Para listings nuevos, construir atributos completos
    const images = shopifyProduct.images || [];
    const mainImage = images[0];
    const otherImages = images.slice(1, 5);
    
    const attributes: AmazonAttributes = {
      itemName: this.cleanTitle(shopifyProduct.title),
      brand: shopifyProduct.vendor || 'Generic',
      conditionType: 'new_new',
      listPrice: {
        currencyCode: 'MXN',
        amount: variant?.price || '0',
      },
    };
    
    if (shopifyProduct.description) {
      const bullets = this.extractBulletPoints(shopifyProduct.description);
      if (bullets.length > 0) {
        attributes.bulletPoint = bullets;
      }
      attributes.productDescription = this.cleanDescription(shopifyProduct.description);
    }
    
    if (mainImage) {
      attributes.mainProductImageLocator = [{
        marketplaceId: 'A1AM78C64UM0Y8',
        mediaLocation: mainImage.src,
      }];
    }
    
    if (otherImages.length > 0) {
      attributes.otherProductImageLocator = otherImages.map(img => ({
        marketplaceId: 'A1AM78C64UM0Y8',
        mediaLocation: img.src,
      }));
    }
    
    if (variant?.weight && variant.weight > 0) {
      attributes.packageWeight = {
        unit: this.mapWeightUnit(variant.weightUnit),
        value: variant.weight,
      };
    }
    
    return {
      shopifyProductId: shopifyProduct.id,
      sellerSku: sku,
      productType: this.detectProductType(shopifyProduct),
      requirements: 'LISTING',
      attributes,
      quantity: variant?.inventoryQuantity || 1,
    };
  }
  
  private cleanTitle(title: string): string {
    return title.substring(0, 200).trim();
  }
  
  private cleanDescription(description: string): string {
    const plainText = description
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plainText.substring(0, 2000);
  }
  
  private extractBulletPoints(description: string): string[] {
    const sentences = description
      .replace(/<[^>]*>/g, ' ')
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 500)
      .slice(0, 5);
    
    return sentences;
  }
  
  private detectProductType(product: ShopifyProduct): string {
    const type = product.productType?.toLowerCase() || '';
    const title = product.title?.toLowerCase() || '';
    
    if (type.includes('electronic') || type.includes('audio') || type.includes('headphone') || 
        title.includes('audífono') || title.includes('headphone') || title.includes('earbud')) {
      return 'HEADPHONES';
    }
    if (type.includes('phone') || type.includes('mobile') || title.includes('phone')) {
      return 'CELLULAR_PHONE_CASE';
    }
    if (type.includes('light') || type.includes('lamp') || title.includes('lamp')) {
      return 'LIGHT_BULB';
    }
    if (type.includes('tool') || type.includes('drill') || title.includes('tool')) {
      return 'TOOLS';
    }
    if (type.includes('clean') || type.includes('vacuum') || title.includes('vacuum')) {
      return 'VACUUM_CLEANER';
    }
    if (title.includes('speaker') || title.includes('bocina') || title.includes('altavoz')) {
      return 'SPEAKER';
    }
    
    return 'PRODUCT';
  }
  
  private mapWeightUnit(unit: string): string {
    const unitMap: Record<string, string> = {
      'g': 'grams',
      'kg': 'kilograms',
      'oz': 'ounces',
      'lb': 'pounds',
    };
    return unitMap[unit?.toLowerCase()] || 'grams';
  }
}
