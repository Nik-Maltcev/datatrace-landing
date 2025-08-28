const axios = require('axios');

async function testLocalDomainSearch() {
  try {
    console.log('🔍 Testing local domain search API...');
    
    const response = await axios.post('http://localhost:3001/api/snusbase/domain-search', {
      domain: 'cdek.ru'
    });
    
    console.log('✅ Response status:', response.status);
    console.log('📊 Response data structure:');
    
    const data = response.data;
    
    console.log('- ok:', data.ok);
    console.log('- domain:', data.domain);
    console.log('- results type:', Array.isArray(data.results) ? 'array' : typeof data.results);
    console.log('- results length:', data.results?.length || 0);
    console.log('- has databases:', !!data.databases);
    console.log('- has analysis:', !!data.analysis);
    console.log('- has summary:', !!data.summary);
    
    if (data.results && data.results.length > 0) {
      console.log('📝 First result structure:');
      const firstResult = data.results[0];
      console.log('  - email:', firstResult.email || 'no email');
      console.log('  - database:', firstResult.database || 'no database');
      console.log('  - has password:', !!firstResult.password);
      console.log('  - has hash:', !!firstResult.hash);
      console.log('  - keys:', Object.keys(firstResult));
    }
    
    console.log('\n📋 Full response preview:');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testLocalDomainSearch();
