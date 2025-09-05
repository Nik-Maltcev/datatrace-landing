// Тестовый файл для проверки API запросов
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPhoneCheck() {
  console.log('🔍 Testing phone check API...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/check-user-phone`, {
      phone: '+79991234567'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Phone check response:', {
      ok: response.data.ok,
      totalLeaks: response.data.totalLeaks,
      foundSources: response.data.foundSources,
      resultsCount: response.data.results?.length
    });
    
    // Проверяем структуру результатов
    if (response.data.results) {
      response.data.results.forEach((result, index) => {
        console.log(`📊 Source ${index + 1}: ${result.name}`, {
          ok: result.ok,
          found: result.found,
          count: result.count,
          hasItems: !!result.items,
          itemsType: typeof result.items
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Phone check error:', error.response?.data || error.message);
  }
}

async function testEmailCheck() {
  console.log('🔍 Testing email check API...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/check-user-email`, {
      email: 'test@example.com'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Email check response:', {
      ok: response.data.ok,
      totalLeaks: response.data.totalLeaks,
      foundSources: response.data.foundSources,
      resultsCount: response.data.results?.length
    });
    
    // Проверяем структуру результатов
    if (response.data.results) {
      response.data.results.forEach((result, index) => {
        console.log(`📊 Source ${index + 1}: ${result.name}`, {
          ok: result.ok,
          found: result.found,
          count: result.count,
          hasItems: !!result.items,
          itemsType: typeof result.items
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Email check error:', error.response?.data || error.message);
  }
}

async function testCheckHistory() {
  console.log('🔍 Testing check history API...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/save-check-result?userId=current-user`);
    
    console.log('✅ Check history response:', {
      ok: response.data.ok,
      checksCount: response.data.checks?.length
    });
    
    if (response.data.checks) {
      response.data.checks.forEach((check, index) => {
        console.log(`📋 Check ${index + 1}:`, {
          type: check.type,
          query: check.query,
          totalLeaks: check.totalLeaks,
          foundSources: check.foundSources,
          resultsCount: check.results?.length
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Check history error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  await testPhoneCheck();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testEmailCheck();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testCheckHistory();
  
  console.log('\n✅ All tests completed!');
}

// Запускаем тесты
runTests().catch(console.error);