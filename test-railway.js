// Тест Railway развертывания
const axios = require('axios');

// Замените на ваш Railway URL
const RAILWAY_URL = 'https://your-app.railway.app'; // <-- УКАЖИТЕ ВАШ URL

async function testRailwayAPI() {
  console.log('🚀 Testing Railway deployment...');
  console.log('URL:', RAILWAY_URL);
  
  try {
    // Тест health check
    console.log('\n1. Testing health check...');
    const health = await axios.get(`${RAILWAY_URL}/api/health`);
    console.log('✅ Health:', health.data);
    
    // Тест проверки телефона
    console.log('\n2. Testing phone check...');
    const phoneResponse = await axios.post(`${RAILWAY_URL}/api/check-user-phone`, {
      phone: '+79991234567'
    });
    
    console.log('✅ Phone check:', {
      ok: phoneResponse.data.ok,
      totalLeaks: phoneResponse.data.totalLeaks,
      sources: phoneResponse.data.results?.map(r => ({
        name: r.name,
        found: r.found,
        count: r.count,
        hasItems: !!r.items
      }))
    });
    
    // Тест истории проверок
    console.log('\n3. Testing check history...');
    const history = await axios.get(`${RAILWAY_URL}/api/save-check-result?userId=current-user`);
    console.log('✅ History:', {
      ok: history.data.ok,
      checksCount: history.data.checks?.length
    });
    
    console.log('\n🎉 Railway deployment working!');
    console.log(`\n🌐 Test the UI at: ${RAILWAY_URL}/dashboard/checks`);
    
  } catch (error) {
    console.error('❌ Railway test failed:', {
      status: error.response?.status,
      message: error.response?.data || error.message,
      url: error.config?.url
    });
  }
}

testRailwayAPI();