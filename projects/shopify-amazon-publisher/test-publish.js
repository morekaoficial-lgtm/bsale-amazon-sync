const axios = require('axios');
const { config } = require('./dist/config');

async function test() {
  console.log('Token length:', config.amazon.refreshToken.length);
  console.log('Token starts with:', config.amazon.refreshToken.substring(0, 20));
  
  try {
    const response = await axios.post('https://api.amazon.com/auth/o2/token', {
      grant_type: 'refresh_token',
      refresh_token: config.amazon.refreshToken,
      client_id: config.amazon.lwaClientId,
      client_secret: config.amazon.lwaClientSecret,
    });
    
    console.log('✅ Token funciona!');
    console.log('Access token:', response.data.access_token.substring(0, 30) + '...');
    
    // Ahora probar crear listing
    const token = response.data.access_token;
    const listing = {
      sellerSku: '76289822255194',
      productType: 'HOME',
      requirements: 'LISTING',
      attributes: {
        itemName: 'Audífonos Bluetooth 5.3 Moreka BL029',
        brand: 'Moreka',
        conditionType: 'new_new',
        listPrice: {
          currencyCode: 'MXN',
          amount: '447.00'
        }
      }
    };
    
    console.log('\n📤 Enviando listing...');
    const listingResponse = await axios.put(
      `https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/${config.amazon.marketplaceId}/${listing.sellerSku}`,
      {
        productType: listing.productType,
        requirements: listing.requirements,
        attributes: listing.attributes,
      },
      {
        headers: {
          'x-amz-access-token': token,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Listing creado!');
    console.log(JSON.stringify(listingResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', JSON.stringify(error.response?.data, null, 2) || error.message);
  }
}

test();
