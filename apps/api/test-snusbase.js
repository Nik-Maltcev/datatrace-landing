const axios = require('axios');

async function testSnusbase() {
  console.log('🔍 Testing Snusbase API directly...');
  
  const apiKey = 'sb99cd2vxyohst65mh98ydz6ud844l';
  const domain = 'cdek.ru';
  
  try {
    // Test 1: Connection test
    console.log('\n1️⃣ Testing connection...');
    const statsResponse = await axios.get('https://api.snusbase.com/data/stats', {
      headers: {
        'Auth': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Connection successful! Total rows: ${statsResponse.data.rows}`);
    console.log(`📊 Available tables: ${Object.keys(statsResponse.data.tables).length}`);
    
    // Test 2: Domain search
    console.log(`\n2️⃣ Testing domain search for ${domain}...`);
    const searchResponse = await axios.post('https://api.snusbase.com/data/search', {
      terms: [`@${domain}`],
      types: ['email'],
      wildcard: false
    }, {
      headers: {
        'Auth': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 Search response:', JSON.stringify(searchResponse.data, null, 2));
    
    // Test 3: Alternative search
    console.log(`\n3️⃣ Testing alternative search for ${domain}...`);
    const altSearchResponse = await axios.post('https://api.snusbase.com/data/search', {
      terms: [domain],
      types: ['_domain'],
      wildcard: false
    }, {
      headers: {
        'Auth': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 Alternative search response:', JSON.stringify(altSearchResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('📊 Status:', error.response?.status);
    console.error('📋 Headers:', error.response?.headers);
  }
}

testSnusbase();
