const axios = require('axios');

async function testAmazon() {
  try {
    // Step 1: Get access token
    const tokenResponse = await axios.post('https://api.amazon.com/auth/o2/token', {
      grant_type: 'refresh_token',
      refresh_token: 'Atzr|IwEBIKUbkzbLoP1QFBzkKue5VjwMMxyxHu59I3kzOVmW5GZJD37pHfGhdliYiEoDPQg9QqAcQWGZJcdiiB4YXxTud54Y4PSqo_Jir3RDMKmXov5XLMnQLYyGLz-5C-oxYumlIYwa3mYrNo9EQERwwhZJ8TZ1Pm6p2dQyBWEPIk20pYJZtFBDpBby8NZ_VK0Ddn-EwjdwVCgUm5keSCFWdlZ6ln5IiQCJIit-wL3PIm8fp9IZMqkTTu3uOWD02zmZjNrt5RUZvNdtXSHDQaF09ZAjk_xtu88WHJ26k5WMSQ-O77svw82kEbb-uRt9bTVlD4zxLBo',
      client_id: 'amzn1.application-oa2-client.76ef3e242d92441080c2b0bcdc0d87b1',
      client_secret: 'amzn1.oa2-cs.v1.8c6853f325fc9e0d304327c73bff26d6fae592efa234223da20e6a5932800649',
    });

    console.log('✅ Token obtained successfully');
    const accessToken = tokenResponse.data.access_token;

    // Step 2: Create listing
    const listing = {
      sellerSku: '76289822255194',
      productType: 'HOME',
      requirements: 'LISTING',
      attributes: {
        itemName: 'Audífonos Bluetooth 5.3 Moreka BL029 16 horas de musica iluminación RGB',
        brand: 'Moreka',
        conditionType: 'new_new',
        listPrice: {
          currencyCode: 'MXN',
          amount: '447.00'
        }
      }
    };

    console.log('📤 Creating listing...');
    const listingResponse = await axios.put(
      'https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/A1AM78C64UM0Y8/76289822255194',
      {
        productType: listing.productType,
        requirements: listing.requirements,
        attributes: listing.attributes,
      },
      {
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Listing created successfully!');
    console.log(JSON.stringify(listingResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAmazon();
