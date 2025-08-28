const axios = require('axios');

async function testRailwayDomainSearch() {
  try {
    console.log('🚂 Testing Railway domain search API...');
    
    const response = await axios.post('https://datatrace-landing-production.up.railway.app/api/snusbase/domain-search', {
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
      
      console.log('\n📋 Sample results (first 3):');
      data.results.slice(0, 3).forEach((result, index) => {
        console.log(`${index + 1}. ${result.email} | DB: ${result.database} | Has password: ${!!result.password}`);
      });
    }
    
    if (data.summary) {
      console.log('\n📈 Summary:');
      console.log('- Total records:', data.summary.totalRecords);
      console.log('- Database count:', data.summary.databaseCount);
      console.log('- Risk level:', data.summary.riskLevel);
      console.log('- Has passwords:', data.summary.hasPasswords);
      console.log('- Has personal data:', data.summary.hasPersonalData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testRailwayDomainSearch();
