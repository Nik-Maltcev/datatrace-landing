const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const OpenAI = require('openai'); // Используется для DeepSeek V3 (OpenAI-compatible API)
const ErrorHandler = require('./utils/ErrorHandler');
const AuthService = require('./services/AuthService');
const DeHashedService = require('./services/DeHashedService');
const { requireAuth, optionalAuth, requireAdmin, userRateLimit, authService } = require('./middleware/auth');
require('dotenv').config();

const app = express();
// Debug информация для Railway
console.log('🔧 Environment Debug Info:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT from env:', process.env.PORT);
console.log('- Working directory:', process.cwd());
console.log('- Platform:', process.platform);
console.log('- Node version:', process.version);
console.log('- Memory usage:', process.memoryUsage());

const PORT = process.env.PORT || 3001; // Railway автоматически назначает порт
console.log('- PORT resolved:', PORT);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Load tokens from env or fallback to docs (for local demo only)
const TOKENS = {
  ITP: process.env.ITP_TOKEN || '91b2c57abce2ca84f8ca068df2eda054',
  DYXLESS: process.env.DYXLESS_TOKEN || '38a634df-2317-4c8c-beb7-7ca4fd97f1e1',
  LEAKOSINT: process.env.LEAKOSINT_TOKEN || '466496291:r571DgY3',
  USERSBOX: process.env.USERSBOX_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkX2F0IjoxNzUyNTg0NTk5LCJhcHBfaWQiOjE3NTI1ODQ1OTl9.FqMGisO5V1xW2Xr8Ri5mQryy5I1sdBBWzuckCEPpK58',
  VEKTOR: process.env.VEKTOR_TOKEN || 'C45vAVuDkzNax2BF4sz8o4KEAZFBIIK'
};

const ITP_BASE = process.env.ITP_BASE || 'https://datatech.work';
const DYXLESS_BASE = process.env.DYXLESS_BASE || 'https://api-dyxless.cfd';
const LEAKOSINT_BASE = 'https://leakosintapi.com/';
const USERSBOX_BASE = 'https://api.usersbox.ru/v1';
const VEKTOR_BASE = 'https://infosearch54321.xyz';

// DeepSeek V3 client (OpenAI-compatible API)
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
let openai = null;

// Initialize DeepSeek V3 client (uses OpenAI-compatible API)
console.log('Checking DeepSeek API key...');
console.log('DEEPSEEK_API_KEY exists:', !!DEEPSEEK_API_KEY);
console.log('DEEPSEEK_API_KEY length:', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.length : 0);

if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY.trim() !== '') {
  try {
    openai = new OpenAI({ 
      apiKey: DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com', // DeepSeek V3 API endpoint
      timeout: 120000, // 120 секунд таймаут для DeepSeek V3
      maxRetries: 3
    });
    console.log('✅ DeepSeek V3 client initialized successfully');
    console.log('🔍 DeepSeek SDK version check...');
    console.log('📦 Available DeepSeek methods:', Object.getOwnPropertyNames(openai.chat.completions).slice(0, 5));
  } catch (error) {
    console.error('❌ Failed to initialize DeepSeek V3 client:', error.message);
    openai = null;
  }
} else {
  console.warn('⚠️ DeepSeek API key not found in environment variables');
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DEEPSEEK')));
}

// Company check providers
const DATANEWTON_BASE = process.env.DATANEWTON_BASE || 'https://api.datanewton.ru/v1';
const DATANEWTON_KEY = process.env.DATANEWTON_KEY || 'UeHgYI7e4ejX';
const CHECKO_BASE = process.env.CHECKO_BASE || 'https://api.checko.ru/v2';
const CHECKO_KEY = process.env.CHECKO_KEY || process.env.CHECKO_API_KEY || 'iWq90n732rGN2rex';

function extractUsernameIfSocial(field, query) {
  if (!query || (field !== 'vk' && field !== 'ok')) return query;
  try {
    // If it's a URL, parse and extract last meaningful segment
    if (/^https?:\/\//i.test(query)) {
      const u = new URL(query);
      const host = u.hostname.replace(/^www\./, '');
      if (host.includes('vk.com')) {
        // vk.com/id123 | vk.com/username | vk.com/club123 | vk.com/public123
        const seg = u.pathname.split('/').filter(Boolean);
        if (seg.length > 0) return seg[seg.length - 1];
      }
      if (host.includes('ok.ru') || host.includes('odnoklassniki.ru')) {
        // ok.ru/profile/123 | ok.ru/username
        const seg = u.pathname.split('/').filter(Boolean);
        if (seg.length > 0) return seg[seg.length - 1];
      }
    }
    // Otherwise return as-is (might be id12345 or username)
    return query.replace(/^@+/, '');
  } catch {
    return query;
  }
}

// Import normalizers
const ITPNormalizer = require('./utils/ITPNormalizer');
const DyxlessNormalizer = require('./utils/DyxlessNormalizer');
const LeakOsintNormalizer = require('./utils/LeakOsintNormalizer');
const UsersboxNormalizer = require('./utils/UsersboxNormalizer');

async function searchITP(query, field) {
  try {
    const itpTypeMap = {
      phone: 'phone',
      email: 'email',
      inn: 'inn',
      snils: 'snils',
      vk: 'username',
      ok: 'username'
    };
    const isSocial = field === 'vk' || field === 'ok';
    const adjustedQuery = isSocial ? extractUsernameIfSocial(field, query) : query;
    const itpType = itpTypeMap[field] || 'full_text';
    const res = await axios.post(
      ITP_BASE + '/public-api/data/search',
      {
        searchOptions: [
          { type: itpType, query: adjustedQuery }
        ]
      },
      { headers: { 'x-api-key': TOKENS.ITP } }
    );
    const data = res.data || {};
    
    // Логируем структуру ответа ITP для отладки
    console.log(`🔍 ITP response structure:`, {
      statusCode: res.status,
      hasData: !!data.data,
      dataType: typeof data.data,
      dataKeys: data.data ? Object.keys(data.data) : 'no data',
      dataLength: Array.isArray(data.data) ? data.data.length : 'not array',
      fullResponseKeys: Object.keys(data)
    });
    
    // Нормализуем данные ITP
    const normalizedItems = data.data ? ITPNormalizer.normalizeRecords(data.data) : [];
    
    console.log(`📊 ITP normalized ${normalizedItems.length} records from ${data.data?.length || 0} original records`);
    
    return { 
      name: 'ITP', 
      ok: true, 
      meta: { 
        records: data.records, 
        searchId: data.searchId,
        originalCount: data.data?.length || 0,
        normalizedCount: normalizedItems.length
      }, 
      items: normalizedItems,
      _originalItems: data.data // Сохраняем оригинальные данные для отладки
    };
  } catch (err) {
    return { name: 'ITP', ok: false, error: normalizeError(err) };
  }
}

async function searchDyxless(query, type = 'standart') {
  const attempt = async () => {
    const res = await axios.post(
      DYXLESS_BASE + '/query',
      { 
        token: TOKENS.DYXLESS,
        query: query,
        type: type // 'standart' (2₽) or 'telegram' (10₽)
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DataTrace/1.0'
        },
        timeout: 15000
      }
    );
    // If Cloudflare returns an HTML error page, treat as outage
    const ct = res.headers && res.headers['content-type'];
    if (ct && ct.includes('text/html') && typeof res.data === 'string') {
      throw { response: { status: res.status || 521, data: 'Cloudflare HTML error page' } };
    }
    
    const data = res.data || {};
    
    // Handle error responses based on new API format
    if (!data.status) {
      const errorMessage = data.message || 'Unknown error from Dyxless API';
      throw new Error(`Dyxless API Error: ${errorMessage}`);
    }
    
    const items = data.data || [];
    const count = data.counts || items.length || 0;
    
    // Нормализуем ответ Dyxless для красивого отображения
    const normalizedResponse = {
      name: 'Dyxless', 
      ok: data.status === true, 
      meta: { count: count }, 
      items: items
    };
    
    return DyxlessNormalizer.normalizeResponse(normalizedResponse);
  };

  try {
    return await attempt();
  } catch (e1) {
    // Handle specific error cases from new API
    if (e1.response?.status === 401) {
      return { name: 'Dyxless', ok: false, error: 'Неверный токен Dyxless API' };
    }
    if (e1.response?.status === 403) {
      const errorData = e1.response?.data || {};
      return { name: 'Dyxless', ok: false, error: errorData.message || 'Недостаточно средств на балансе' };
    }
    if (e1.response?.status === 404) {
      return { name: 'Dyxless', ok: true, meta: { count: 0 }, items: [] };
    }
    
    // Retry once after 600ms for other errors
    await new Promise((r) => setTimeout(r, 600));
    try {
      return await attempt();
    } catch (e2) {
      return { name: 'Dyxless', ok: false, error: normalizeError(e2) };
    }
  }
}

async function searchLeakOsint(query) {
  try {
    const res = await axios.post(
      LEAKOSINT_BASE,
      { token: TOKENS.LEAKOSINT, request: query, limit: 100, lang: 'ru', type: 'json' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = res.data || {};
    
    // Логируем структуру ответа LeakOsint для отладки
    console.log(`🔍 LeakOsint response structure:`, {
      statusCode: res.status,
      hasData: !!data.List,
      dataType: typeof data.List,
      listKeys: data.List ? Object.keys(data.List).slice(0, 3) : 'no List',
      fullResponseKeys: Object.keys(data)
    });
    
    console.log('🔍 LeakOsint full response data:', JSON.stringify(data, null, 2));
    
    // Error path
    if (data && (data['Error code'] || data.Error || data.error)) {
      return { name: 'LeakOsint', ok: false, error: data };
    }
    
    // Check for "No results found" message - this means no leaks were found
    const responseText = JSON.stringify(data).toLowerCase();
    console.log('🔍 LeakOsint response text (for checking):', responseText.substring(0, 200));
    
    if (responseText.includes('no results found') || 
        responseText.includes('не найдено результатов') ||
        responseText.includes('нет результатов')) {
      console.log(`✅ LeakOsint: Detected "No results found" in response`);
      return { name: 'LeakOsint', ok: true, items: [] };
    }
    
    // Normal path
    const list = data.List || {};
    const items = Object.keys(list).map((k) => ({ db: k, info: list[k]?.InfoLeak, data: list[k]?.Data }));
    if (!Object.keys(list).length) {
      console.log(`✅ LeakOsint: No List property or empty List`);
      return { name: 'LeakOsint', ok: true, items: [] };
    }
    
    // More detailed filtering - check inside InfoLeak and Data fields
    const validItems = items.filter(item => {
      const itemText = JSON.stringify(item).toLowerCase();
      const hasNoResults = itemText.includes('no results found') || 
                          itemText.includes('не найдено результатов') ||
                          itemText.includes('нет результатов') ||
                          itemText.includes('по вашему запросу не найдено результатов');
      
      if (hasNoResults) {
        console.log(`🚫 LeakOsint: Filtering out item with "No results": ${item.db}`);
        return false;
      }
      
      // Also check if Data field is empty or contains only info messages
      if (item.data && Array.isArray(item.data) && item.data.length === 0) {
        console.log(`🚫 LeakOsint: Filtering out item with empty data array: ${item.db}`);
        return false;
      }
      
      return true;
    });
    
    if (validItems.length === 0) {
      console.log(`✅ LeakOsint: All items filtered out as empty/no results`);
      return { name: 'LeakOsint', ok: true, items: [] };
    }
    
    // Нормализуем данные LeakOsint
    const normalizedItems = LeakOsintNormalizer.normalizeRecords(validItems);
    
    console.log(`📊 LeakOsint normalized ${normalizedItems.length} records from ${validItems.length} valid items (filtered from ${items.length} total)`);
    
    return { name: 'LeakOsint', ok: true, items: normalizedItems };
  } catch (err) {
    return { name: 'LeakOsint', ok: false, error: normalizeError(err) };
  }
}

async function searchUsersbox(query) {
  try {
    const res = await axios.get(
      USERSBOX_BASE + '/search',
      {
        params: { q: query },
        headers: { Authorization: TOKENS.USERSBOX }
      }
    );
    const data = res.data || {};
    console.log('📊 Usersbox raw response:', JSON.stringify(data, null, 2));
    
    // Нормализуем данные
    const normalizedData = UsersboxNormalizer.normalizeUsersboxData(data);
    console.log('📋 Usersbox normalized data:', JSON.stringify(normalizedData, null, 2));
    
    return { 
      name: 'Usersbox', 
      ok: data.status === 'success', 
      items: normalizedData, 
      meta: { count: data.data?.count } 
    };
  } catch (err) {
    console.error('❌ Usersbox search error:', err.message);
    return { name: 'Usersbox', ok: false, error: normalizeError(err) };
  }
}

async function searchVektor(query) {
  try {
    const url = `${VEKTOR_BASE}/api/${encodeURIComponent(TOKENS.VEKTOR)}/search/${encodeURIComponent(query)}`;
    const res = await axios.get(url);
    const data = res.data || {};
    if (data && data.error) {
      return { name: 'Vektor', ok: false, error: data.error };
    }
    if (!data || !data.result) {
      return { name: 'Vektor', ok: false, error: { message: 'Пустой ответ или нет поля result', preview: data } };
    }
    return { name: 'Vektor', ok: true, items: data.result };
  } catch (err) {
    return { name: 'Vektor', ok: false, error: normalizeError(err) };
  }
}

function normalizeError(err) {
  if (err.response) {
    const status = err.response.status;
    const statusText = err.response.statusText;
    const data = err.response.data;
    const isString = typeof data === 'string';
    return {
      status,
      statusText,
      preview: isString ? String(data).slice(0, 600) : undefined,
      data: !isString ? data : undefined,
    };
  }
  if (err.request) {
    return { message: 'No response from server', code: err.code };
  }
  return { message: err.message, code: err.code };
}

// Sequential search
app.post('/api/search', optionalAuth, userRateLimit(30, 15 * 60 * 1000), async (req, res) => {
  try {
    const { query, field } = req.body || {};
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return res.status(400).json({ error: 'Введите корректный запрос (мин. 3 символа)' });
    }
    const allowedFields = new Set(['phone', 'email', 'vk', 'ok', 'inn', 'snils']);
    const f = allowedFields.has(field) ? field : 'full_text';

    const steps = [];
    // For social types, extract simplified username once
    const finalQuery = extractUsernameIfSocial(f, query);
    for (const [idx, fn] of [searchITP, searchDyxless, searchLeakOsint, searchUsersbox, searchVektor].entries()) {
      // eslint-disable-next-line no-await-in-loop
      const result = idx === 0 ? await fn(finalQuery, f) : await fn(finalQuery);
      steps.push(result);
    }

    res.json({ query: finalQuery, field: f, results: steps });
  } catch (e) {
    res.status(500).json({ error: normalizeError(e) });
  }
});

// Company search endpoints
async function searchDatanewton(inn) {
  try {
    const res = await axios.get(`${DATANEWTON_BASE}/counterparty`, {
      params: {
        key: DATANEWTON_KEY,
        inn,
        // include useful blocks by default
        filters: 'ADDRESS_BLOCK,OWNER_BLOCK,MANAGER_BLOCK,OKVED_BLOCK,CONTACT_BLOCK,NEGATIVE_LISTS_BLOCK'
      },
      timeout: 15000
    });
    // Avoid flooding logs with full payloads in production
    const dnKeys = res.data ? Object.keys(res.data) : [];
    console.log('Datanewton response ok. Top-level keys:', dnKeys.slice(0, 10));
    return { name: 'Datanewton', ok: true, items: res.data };
  } catch (err) {
    console.error('Datanewton error:', err.response?.data || err.message);
    return { name: 'Datanewton', ok: false, error: normalizeError(err) };
  }
}

async function searchChecko(inn) {
  if (!CHECKO_KEY || CHECKO_KEY.trim() === '') {
    return { name: 'Checko', ok: false, error: { message: 'Отсутствует CHECKO_KEY в .env файле' } };
  }
  try {
    const res = await axios.get(`${CHECKO_BASE}/company`, {
      params: { key: CHECKO_KEY, inn },
      timeout: 15000
    });
    // Avoid printing full Checko payload
    const ckKeys = res.data ? Object.keys(res.data) : [];
    console.log('Checko response ok. Top-level keys:', ckKeys.slice(0, 10));
    return { name: 'Checko', ok: true, items: res.data };
  } catch (err) {
    console.error('Checko error:', err.response?.data || err.message);
    return { name: 'Checko', ok: false, error: normalizeError(err) };
  }
}

async function getCheckoFinances(inn, ogrn, kpp, extended = false) {
  if (!CHECKO_KEY || CHECKO_KEY.trim() === '') {
    return { name: 'Checko Finances', ok: false, error: { message: 'Отсутствует CHECKO_KEY в .env файле' } };
  }
  try {
    const params = { key: CHECKO_KEY };
    
    // Предпочтительно использовать ОГРН, если он есть
    if (ogrn) {
      params.ogrn = ogrn;
    } else if (inn) {
      params.inn = inn;
      // Добавляем КПП если указан для точной идентификации
      if (kpp) {
        params.kpp = kpp;
      }
    } else {
      return { name: 'Checko Finances', ok: false, error: { message: 'Необходимо указать ИНН или ОГРН' } };
    }
    
    // Добавляем расширенную версию если запрошена
    if (extended) {
      params.extended = 'true';
    }

    const res = await axios.get(`${CHECKO_BASE}/finances`, {
      params,
      timeout: 20000 // Увеличиваем таймаут для финансовых данных
    });
    
    console.log('Checko Finances response ok. Data available:', !!res.data);
    return { name: 'Checko Finances', ok: true, items: res.data };
  } catch (err) {
    console.error('Checko Finances error:', err.response?.data || err.message);
    return { name: 'Checko Finances', ok: false, error: normalizeError(err) };
  }
}

async function getDatanewtonFinances(inn, ogrn) {
  if (!DATANEWTON_KEY || DATANEWTON_KEY.trim() === '') {
    return { name: 'Datanewton Finances', ok: false, error: { message: 'Отсутствует DATANEWTON_KEY в .env файле' } };
  }
  try {
    const params = { key: DATANEWTON_KEY };
    
    // Предпочтительно использовать ОГРН, если он есть
    if (ogrn) {
      params.ogrn = ogrn;
    } else if (inn) {
      params.inn = inn;
    } else {
      return { name: 'Datanewton Finances', ok: false, error: { message: 'Необходимо указать ИНН или ОГРН' } };
    }

    const res = await axios.get(`${DATANEWTON_BASE}/finance`, {
      params,
      timeout: 20000 // Увеличиваем таймаут для финансовых данных
    });
    
    console.log('Datanewton Finances response ok. Data available:', !!res.data);
    return { name: 'Datanewton Finances', ok: true, items: res.data };
  } catch (err) {
    console.error('Datanewton Finances error:', err.response?.data || err.message);
    return { name: 'Datanewton Finances', ok: false, error: normalizeError(err) };
  }
}

app.post('/api/company-search', optionalAuth, userRateLimit(20, 15 * 60 * 1000), async (req, res) => {
  try {
    const { inn } = req.body || {};
    if (!inn || !/^\d{10,12}$/.test(String(inn).trim())) {
      return res.status(400).json({ error: 'Введите корректный ИНН (10 или 12 цифр)' });
    }
    const steps = [];
    steps.push(await searchDatanewton(inn));
    steps.push(await searchChecko(inn));
    res.json({ query: String(inn).trim(), field: 'inn', results: steps });
  } catch (e) {
    res.status(500).json({ error: normalizeError(e) });
  }
});

// Новый эндпоинт для последовательного поиска по компаниям
app.post('/api/company-search-step', optionalAuth, userRateLimit(40, 15 * 60 * 1000), async (req, res) => {
  try {
    const { inn, step } = req.body || {};
    if (!inn || !/^\d{10,12}$/.test(String(inn).trim())) {
      return res.status(400).json({ error: 'Введите корректный ИНН (10 или 12 цифр)' });
    }

    let result;
    switch (step) {
      case 1:
        console.log('🔍 Step 1: Searching Datanewton...');
        result = await searchDatanewton(inn);
        break;
      case 2:
        console.log('🔍 Step 2: Searching Checko...');
        result = await searchChecko(inn);
        break;
      default:
        return res.status(400).json({ error: 'Invalid step' });
    }

    res.json({
      query: String(inn).trim(),
      field: 'inn',
      step,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: normalizeError(e) });
  }
});

// Новый эндпоинт для последовательного поиска утечек
app.post('/api/leak-search-step', optionalAuth, userRateLimit(50, 15 * 60 * 1000), async (req, res) => {
  try {
    const { query, field, step } = req.body || {};
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return res.status(400).json({ error: 'Введите корректный запрос (мин. 3 символа)' });
    }

    const allowedFields = new Set(['phone', 'email', 'vk', 'ok', 'inn', 'snils']);
    const f = allowedFields.has(field) ? field : 'full_text';
    const finalQuery = extractUsernameIfSocial(f, query);

    let result;
    switch (step) {
      case 1:
        console.log('🔍 Step 1: Searching ITP...');
        result = await searchITP(finalQuery, f);
        break;
      case 2:
        console.log('🔍 Step 2: Searching Dyxless...');
        result = await searchDyxless(finalQuery);
        break;
      case 3:
        console.log('🔍 Step 3: Searching LeakOsint...');
        result = await searchLeakOsint(finalQuery);
        break;
      case 4:
        console.log('🔍 Step 4: Searching Usersbox...');
        result = await searchUsersbox(finalQuery);
        break;
      case 5:
        console.log('🔍 Step 5: Searching Vektor...');
        result = await searchVektor(finalQuery);
        break;
      default:
        return res.status(400).json({ error: 'Invalid step' });
    }

    res.json({
      query: finalQuery,
      field: f,
      step,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: normalizeError(e) });
  }
});


// Initialize AI services - Only DeepSeek V3
const DeepSeekService = require('./services/DeepSeekService');

const deepseekService = new DeepSeekService(
  process.env.DEEPSEEK_API_KEY,
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
);

// Use DeepSeek V3 for all AI operations (more reliable than GPT-5)
const companyAIService = deepseekService.isAvailable() ? deepseekService : null;
const leaksAIService = deepseekService.isAvailable() ? deepseekService : null;

console.log(`🤖 Company AI service: ${companyAIService ? 'DeepSeek V3' : 'None (unavailable)'}`);
console.log(`🔍 Leaks AI service: ${leaksAIService ? 'DeepSeek V3' : 'None (unavailable)'}`);
console.log(`🎯 Using DeepSeek V3 for all AI operations (671B parameter model)`);
const dehashedService = new DeHashedService(
  process.env.DEHASHED_API_KEY,
  process.env.DEHASHED_BASE_URL || 'https://api.dehashed.com'
);

// Company finances endpoint - только для Checko API
app.post('/api/company-finances', optionalAuth, userRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { inn, ogrn, kpp, extended } = req.body || {};
    
    // Проверяем, что указан хотя бы ИНН или ОГРН
    if (!inn && !ogrn) {
      return res.status(400).json({ error: 'Необходимо указать ИНН или ОГРН компании' });
    }
    
    // Валидация ИНН если указан
    if (inn && !/^\d{10,12}$/.test(String(inn).trim())) {
      return res.status(400).json({ error: 'Введите корректный ИНН (10 или 12 цифр)' });
    }
    
    // Валидация ОГРН если указан
    if (ogrn && !/^\d{13,15}$/.test(String(ogrn).trim())) {
      return res.status(400).json({ error: 'Введите корректный ОГРН (13-15 цифр)' });
    }
    
    console.log('🏦 Requesting financial data for:', { inn, ogrn, kpp, extended });
    
    const result = await getCheckoFinances(inn, ogrn, kpp, !!extended);
    
    res.json({
      query: { inn, ogrn, kpp, extended: !!extended },
      result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Company finances error:', e);
    res.status(500).json({ error: normalizeError(e) });
  }
});

// Datanewton finances endpoint
app.post('/api/datanewton-finances', optionalAuth, userRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { inn, ogrn } = req.body || {};
    
    // Проверяем, что указан хотя бы ИНН или ОГРН
    if (!inn && !ogrn) {
      return res.status(400).json({ error: 'Необходимо указать ИНН или ОГРН компании' });
    }
    
    // Валидация ИНН если указан
    if (inn && !/^\d{10,12}$/.test(String(inn).trim())) {
      return res.status(400).json({ error: 'Введите корректный ИНН (10 или 12 цифр)' });
    }
    
    // Валидация ОГРН если указан
    if (ogrn && !/^\d{13,15}$/.test(String(ogrn).trim())) {
      return res.status(400).json({ error: 'Введите корректный ОГРН (13-15 цифр)' });
    }
    
    console.log('📊 Requesting Datanewton financial data for:', { inn, ogrn });
    
    const result = await getDatanewtonFinances(inn, ogrn);
    
    res.json({
      query: { inn, ogrn },
      result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Datanewton finances error:', e);
    res.status(500).json({ error: normalizeError(e) });
  }
});

// Authentication endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, phone, ...additionalData } = req.body;

    // Валидация обязательных полей
    if (!email || !password || !name || !phone) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Email, password, name, and phone are required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    // Базовая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Invalid email format' },
        req
      );
      return res.status(statusCode).json(response);
    }

    // Валидация пароля
    if (password.length < 6) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Password must be at least 6 characters long' },
        req
      );
      return res.status(statusCode).json(response);
    }

    // Подготовка данных пользователя
    const userData = {
      name: name.trim(),
      phone: phone.trim(),
      ...additionalData
    };

    const result = await authService.signUp(email.trim().toLowerCase(), password, userData);

    if (result.ok) {
      // Удаляем чувствительные данные из ответа
      const sanitizedResult = {
        ...result,
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          user_metadata: result.user.user_metadata,
          created_at: result.user.created_at
        } : null
      };
      res.json(sanitizedResult);
    } else {
      const statusCode = result.error.code === 'AUTH_ERROR' ? 400 : 500;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error('Signup endpoint error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Email and password are required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    const result = await authService.signIn(email, password);

    if (result.ok) {
      res.json(result);
    } else {
      const statusCode = result.error.code === 'AUTH_ERROR' ? 401 : 500;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error('Signin endpoint error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

app.post('/api/auth/signout', requireAuth, async (req, res) => {
  try {
    const result = await authService.signOut();
    res.json(result);
  } catch (error) {
    console.error('Signout endpoint error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

app.get('/api/auth/user', requireAuth, async (req, res) => {
  try {
    // Получаем дополнительную информацию из профиля
    const profileResult = await authService.getUserProfile(req.user.id);
    
    const response = {
      ok: true,
      user: {
        ...req.user,
        profile: profileResult.ok ? profileResult.profile : null
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get user endpoint error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

// Endpoint для получения профиля пользователя
app.get('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const profileResult = await authService.getUserProfile(req.user.id);
    
    if (profileResult.ok) {
      res.json(profileResult);
    } else {
      res.status(404).json({
        ok: false,
        error: { message: 'Профиль не найден' }
      });
    }
  } catch (error) {
    console.error('Get profile endpoint error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Refresh token is required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    const result = await authService.refreshSession(refresh_token);

    if (result.ok) {
      res.json(result);
    } else {
      const statusCode = 401;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error('Refresh endpoint error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Email is required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    const result = await authService.resetPassword(email);
    res.json(result);
  } catch (error) {
    console.error('Reset password endpoint error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

app.post('/api/auth/update-password', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'New password is required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    const result = await authService.updatePassword(req.token, password);
    res.json(result);
  } catch (error) {
    console.error('Update password endpoint error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

// Password checking endpoints
app.post('/api/password-check', optionalAuth, userRateLimit(20, 15 * 60 * 1000), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Password is required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    if (password.length < 1 || password.length > 200) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Password length must be between 1 and 200 characters' },
        req
      );
      return res.status(statusCode).json(response);
    }

    if (!dehashedService.isAvailable()) {
      return res.json({
        ok: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Сервис проверки паролей временно недоступен'
        }
      });
    }

    console.log('🔐 Password check request received');

    const result = await dehashedService.checkPassword(password);

    // Log for monitoring (without exposing the actual password)
    console.log(`🔍 Password check completed: compromised=${result.isCompromised}, breaches=${result.breachCount}`);

    res.json(result);
  } catch (error) {
    console.error('Password check endpoint error:', error);

    // Don't expose detailed error information for security
    const sanitizedError = {
      name: 'ServiceError',
      message: 'Ошибка при проверке пароля. Попробуйте позже.'
    };

    const { statusCode, response } = ErrorHandler.formatErrorResponse(sanitizedError, req);
    res.status(statusCode).json(response);
  }
});

app.post('/api/dehashed-search', optionalAuth, requireAuth, userRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { query, field = 'email' } = req.body;

    if (!query || typeof query !== 'string') {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Search query is required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    if (!dehashedService.isAvailable()) {
      return res.json({
        ok: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Сервис поиска утечек временно недоступен'
        }
      });
    }

    const allowedFields = ['email', 'username', 'name', 'phone'];
    if (!allowedFields.includes(field)) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: `Field must be one of: ${allowedFields.join(', ')}` },
        req
      );
      return res.status(statusCode).json(response);
    }

    console.log(`🔍 DeHashed search request: field=${field}`);

    const result = await dehashedService.searchByField(query, field);

    console.log(`✅ DeHashed search completed: found=${result.found}, total=${result.total}`);

    res.json(result);
  } catch (error) {
    console.error('DeHashed search endpoint error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

app.post('/api/company-summarize', optionalAuth, userRateLimit(50, 15 * 60 * 1000), async (req, res) => {
  try {
    console.log('Company summarize request received');
    const { inn, results } = req.body || {};
    console.log('Request data:', { inn, resultsLength: results?.length });

    if (!inn || !Array.isArray(results)) {
      console.log('Missing inn or results');
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        new Error('Missing inn or results'), req
      );
      return res.status(statusCode).json(response);
    }

    // Проверяем доступность AI сервиса для компаний
    console.log('🔍 Checking company AI service availability...');

    if (!companyAIService.isAvailable()) {
      console.log('❌ Company AI service not available, using fallback');
      const fallbackResponse = ErrorHandler.createFallbackResponse(
        { query: inn, results }, 'company', 'ai-unavailable'
      );
      return res.json(fallbackResponse);
    }

    // Устанавливаем общий таймаут для всего запроса
    const requestTimeout = setTimeout(() => {
      console.log('⏰ Request timeout reached, sending fallback');
      if (!res.headersSent) {
        const fallbackResponse = ErrorHandler.createFallbackResponse(
          { query: inn, results }, 'company', 'timeout'
        );
        res.json(fallbackResponse);
      }
    }, 40000); // 40 секунд общий таймаут для DeepSeek V3

    console.log('Starting AI request...');

    try {
      console.log('🚀 Normalizing company data...');
      const normalizedData = optimizeCompanyDataForAI(results);

      console.log('🚀 Using AI service for company analysis...');
      // Используем AI сервис для анализа компаний (если доступен)
      const response = await companyAIService.generateSummary(
        { query: inn, summary: normalizedData }, 'company'
      );

      clearTimeout(requestTimeout);
      console.log('✅ Company data normalized successfully:', {
        ok: response.ok,
        provider: response.provider,
        model: response.model
      });

      if (!res.headersSent) {
        res.json(response);
      }
    } catch (aiError) {
      console.log('❌ AI service failed, using fallback:', aiError.message);
      console.log('Error details:', aiError);
      clearTimeout(requestTimeout);

      if (!res.headersSent) {
        const fallbackResponse = companyAIService.createFallbackResponse(
          { query: inn, results }, 'company'
        );
        res.json(fallbackResponse);
      }
    }
  } catch (e) {
    console.error('Company summarize error:', e.message, e.stack);
    ErrorHandler.logError(e, { endpoint: '/api/company-summarize', inn, resultsCount: results?.length });

    if (!res.headersSent) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(e, req);
      res.status(statusCode).json(response);
    }
  }
});

// Leak summarization endpoint
app.post('/api/summarize', optionalAuth, userRateLimit(30, 15 * 60 * 1000), async (req, res) => {
  try {
    console.log('Leak summarize request received');
    const { query, field, results } = req.body || {};
    console.log('Request data:', { query, field, resultsLength: results?.length });

    if (!query || !Array.isArray(results)) {
      console.log('Missing query or results');
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        new Error('Missing query or results'), req
      );
      return res.status(statusCode).json(response);
    }

    // Проверяем доступность AI сервиса для утечек
    console.log('🔍 Checking leaks AI service availability...');

    if (!leaksAIService.isAvailable()) {
      console.log('❌ Leaks AI service not available, using fallback');
      const fallbackResponse = ErrorHandler.createFallbackResponse(
        { query, field, results }, 'leaks', 'ai-unavailable'
      );
      return res.json(fallbackResponse);
    }

    // Адаптивные timeout'ы для разных сред
    const isProduction = process.env.NODE_ENV === 'production';
    const generalTimeout = isProduction ? 180000 : 250000; // 180s для production, 250s для development
    
    const requestTimeout = setTimeout(() => {
      console.log('⏰ Request timeout reached, sending fallback');
      if (!res.headersSent) {
        const fallbackResponse = ErrorHandler.createFallbackResponse(
          { query, field, results }, 'leaks', 'timeout'
        );
        res.json(fallbackResponse);
      }
    }, generalTimeout);

      console.log(`Starting AI request with ${leaksAIService.isAvailable() ?
        'OpenAI' : 'fallback'}...`);

    try {
      const compact = compactResults(results);
      const optimizedData = optimizeDataForAI(compact);

      // Используем Kimi для анализа утечек
      const response = await leaksAIService.generateSummary(
        { query, field, results: results }, 'leaks' // Передаем оригинальные results как массив
      );

      clearTimeout(requestTimeout);
      console.log('✅ AI service response received');

      if (!res.headersSent) {
        res.json(response);
      }
    } catch (aiError) {
      console.log('❌ AI service failed, using fallback:', aiError.message);
      clearTimeout(requestTimeout);

      if (!res.headersSent) {
        const fallbackResponse = leaksAIService.createFallbackResponse(
          { query, field, results }, 'leaks'
        );
        res.json(fallbackResponse);
      }
    }
  } catch (e) {
    console.error('Leak summarize error:', e.message, e.stack);
    ErrorHandler.logError(e, { endpoint: '/api/summarize', query, resultsCount: results?.length });

    if (!res.headersSent) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(e, req);
      res.status(statusCode).json(response);
    }
  }
});

function createLeakFallbackSummary(query, field, compact) {
  let found = false;
  let sources = {};
  let highlights = [];
  let person = {
    name: null,
    phones: [],
    emails: [],
    usernames: [],
    ids: [],
    addresses: []
  };

  // Анализируем результаты каждого источника
  for (const [sourceName, sourceData] of Object.entries(compact)) {
    if (sourceData.ok && sourceData.data) {
      found = true;
      let foundCount = 0;

      if (sourceName === 'ITP' && typeof sourceData.data === 'object') {
        for (const [category, items] of Object.entries(sourceData.data)) {
          if (Array.isArray(items) && items.length > 0) {
            foundCount += items.length;
            highlights.push(`${category}: ${items.length} записей`);
          }
        }
      } else if (Array.isArray(sourceData.data)) {
        foundCount = sourceData.data.length;
        if (foundCount > 0) {
          highlights.push(`${sourceName}: ${foundCount} записей`);
        }
      }

      sources[sourceName] = { foundCount, notes: foundCount > 0 ? 'Данные найдены' : 'Нет данных' };
    } else {
      sources[sourceName] = { foundCount: 0, notes: 'Источник недоступен или нет данных' };
    }
  }

  // Если ничего не найдено
  if (!found) {
    highlights.push('Информация по запросу не найдена');
  }

  return {
    found,
    sources,
    highlights,
    person
  };
}

function compactResults(results) {
  const out = {};
  for (const r of results || []) {
    if (!r || !r.name) continue;
    if (r.name === 'ITP') {
      const groups = r.items || {};
      const obj = {};
      const names = Object.keys(groups).slice(0, 3);
      for (const key of names) {
        const arr = Array.isArray(groups[key]?.data) ? groups[key].data.slice(0, 3) : [];
        obj[key] = arr;
      }
      out.ITP = { ok: r.ok, meta: r.meta, data: obj };
    } else if (r.name === 'Dyxless') {
      const arr = Array.isArray(r.items) ? r.items.slice(0, 8) : [];
      out.Dyxless = { ok: r.ok, meta: r.meta, data: arr };
    } else if (r.name === 'LeakOsint') {
      const arr = Array.isArray(r.items) ? r.items.slice(0, 3).map(g => ({ db: g.db, info: g.info, data: Array.isArray(g.data) ? g.data.slice(0, 3) : [] })) : [];
      out.LeakOsint = { ok: r.ok, data: arr };
    } else if (r.name === 'Usersbox') {
      const arr = Array.isArray(r.items) ? r.items.slice(0, 10) : [];
      out.Usersbox = { ok: r.ok, meta: r.meta, data: arr };
    } else if (r.name === 'Vektor') {
      out.Vektor = { ok: r.ok, data: r.items };
    }
  }
  return out;
}

function optimizeDataForAI(compact) {
  const optimized = {};

  for (const [sourceName, sourceData] of Object.entries(compact)) {
    if (!sourceData.ok || !sourceData.data) {
      optimized[sourceName] = { ok: false, count: 0 };
      continue;
    }

    const summary = { ok: true, count: 0, samples: [], databases: [] };

    if (sourceName === 'ITP') {
      for (const [groupName, records] of Object.entries(sourceData.data)) {
        if (Array.isArray(records)) {
          summary.count += records.length;
          summary.samples.push(...records.slice(0, 2)); // Только первые 2 записи
          summary.databases.push(groupName);
        }
      }
    } else if (sourceName === 'Dyxless') {
      if (Array.isArray(sourceData.data)) {
        summary.count = sourceData.data.length;
        summary.samples = sourceData.data.slice(0, 3); // Только первые 3 записи
        // Извлекаем уникальные базы данных
        const dbs = [...new Set(sourceData.data.map(r => r.database).filter(Boolean))];
        summary.databases = dbs.slice(0, 5); // Максимум 5 баз
      }
    } else if (sourceName === 'LeakOsint') {
      if (Array.isArray(sourceData.data)) {
        summary.databases = sourceData.data.map(leak => leak.db).filter(Boolean);
        summary.count = sourceData.data.reduce((sum, leak) => sum + (leak.data?.length || 0), 0);
        // Берем по одной записи из каждой базы
        sourceData.data.forEach(leak => {
          if (leak.data && leak.data.length > 0) {
            summary.samples.push(leak.data[0]);
          }
        });
      }
    } else if (sourceName === 'Usersbox') {
      if (Array.isArray(sourceData.data)) {
        summary.count = sourceData.data.length;
        summary.samples = sourceData.data.slice(0, 3);
      }
    } else if (sourceName === 'Vektor') {
      if (Array.isArray(sourceData.data)) {
        summary.count = sourceData.data.length;
        summary.samples = sourceData.data.slice(0, 3);
      } else if (sourceData.data) {
        summary.count = 1;
        summary.samples = [sourceData.data];
      }
    }

    optimized[sourceName] = summary;
  }

  return optimized;
}

// Нормализация данных компании для передачи в AI (до GPT)
function optimizeCompanyDataForAI(results) {
  const summary = {
    company: {
      name: null,
      fullName: null,
      shortName: null,
      inn: null,
      ogrn: null,
      kpp: null,
      opf: null,
      registration_date: null,
      years_from_registration: null,
      status: null,
      address: null,
      activity: null,
      charter_capital: null,
      contacts: { phones: [], emails: [], sites: [] }
    },
    ceo: { name: null, fio: null, position: null, post: null },
    managers: [],
    owners: [],
    okved: { main: {}, additional: [] },
    risk_flags: [],
    notes: []
  };

  try {
    for (const r of results || []) {
      if (!r || !r.ok || !r.items) continue;
      const it = r.items;

      // Название / ИНН / базовые поля (варианты ключей в разных источниках)
      summary.company.shortName = summary.company.shortName || it?.company_names?.short_name || it?.short_name || it?.shortName || null;
      summary.company.fullName = summary.company.fullName || it?.company_names?.full_name || it?.full_name || it?.fullName || null;
      summary.company.name = summary.company.name || it?.name || summary.company.shortName || summary.company.fullName || null;
      summary.company.inn = summary.company.inn || it?.inn || it?.ИНН || null;
      summary.company.ogrn = summary.company.ogrn || it?.ogrn || it?.ОГРН || null;
      summary.company.kpp = summary.company.kpp || it?.kpp || it?.КПП || null;
      summary.company.opf = summary.company.opf || it?.opf || it?.OPF || it?.["ОПФ"] || null;
      summary.company.status = summary.company.status || it?.status || it?.state || null;

      // Адрес
      summary.company.address = summary.company.address || it?.address?.line_address || it?.address || null;

      // Деятельность
      summary.company.activity = summary.company.activity || it?.okved_main?.value || it?.activity || null;

      // Контакты
      if (Array.isArray(it?.phones)) summary.company.contacts.phones = it.phones;
      if (Array.isArray(it?.emails)) summary.company.contacts.emails = it.emails;
      if (Array.isArray(it?.sites)) summary.company.contacts.sites = it.sites;

      // Руководство
      if (it?.ceo?.name || it?.manager?.name) {
        summary.ceo.name = summary.ceo.name || it?.ceo?.name || it?.manager?.name || null;
        summary.ceo.fio = summary.ceo.fio || it?.ceo?.fio || it?.manager?.fio || null;
        summary.ceo.position = summary.ceo.position || it?.ceo?.position || it?.manager?.position || null;
        summary.ceo.post = summary.ceo.post || it?.ceo?.post || it?.manager?.post || null;
      }

      // ОКВЭД
      if (it?.okved_main) {
        summary.okved.main = summary.okved.main || {
          code: it?.okved_main?.code,
          text: it?.okved_main?.value || it?.okved_main?.text,
          title: it?.okved_main?.title
        };
      }
      if (Array.isArray(it?.okveds)) {
        summary.okved.additional = it.okveds.slice(0, 10).map(x => ({ code: x.code, text: x.value || x.text, title: x.title }));
      }

      // Негативные списки / риски
      if (Array.isArray(it?.negative_lists)) {
        for (const flag of it.negative_lists) {
          if (flag && typeof flag === 'string') summary.risk_flags.push(flag);
        }
      }
    }
  } catch (e) {
    console.warn('optimizeCompanyDataForAI error:', e.message);
  }

  return summary;
}

// Новый эндпоинт для получения информации о компании (заглушка)
app.get('/api/company', async (req, res) => {
  try {
    const { inn } = req.query;
    if (!inn || !/^\d{10,12}$/.test(String(inn).trim())) {
      return res.status(400).json({ error: 'Введите корректный ИНН (10 или 12 цифр)' });
    }

    // Используем существующую логику поиска компании
    const steps = [];
    steps.push(await searchDatanewton(inn));
    steps.push(await searchChecko(inn));

    res.json({
      inn: String(inn).trim(),
      results: steps,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: normalizeError(e) });
  }
});

// Эндпоинт для автоматической проверки телефона пользователя
app.post('/api/check-user-phone', requireAuth, userRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    console.log('🔍 User phone check request received');

    // Получаем профиль пользователя
    const profileResult = await authService.getUserProfile(req.user.id);

    if (!profileResult.ok || !profileResult.profile?.phone) {
      return res.status(400).json({
        ok: false,
        error: { message: 'Номер телефона не указан в профиле пользователя' }
      });
    }

    const phone = profileResult.profile.phone;
    console.log(`📱 Checking phone: ${phone} for user: ${req.user.id}`);

    // Используем существующую логику поиска
    const steps = [];
    const finalQuery = phone.replace(/[\s\-\(\)]/g, ''); // Нормализуем номер

    for (const [idx, fn] of [searchITP, searchDyxless, searchLeakOsint, searchUsersbox, searchVektor].entries()) {
      const result = idx === 0 ? await fn(finalQuery, 'phone') : await fn(finalQuery);
      steps.push(result);
    }

    // Подсчитываем общее количество найденных утечек
    const totalLeaks = steps.reduce((sum, step) => {
      if (!step.ok || !step.items) return sum;

      if (step.name === 'ITP' && typeof step.items === 'object') {
        return sum + Object.values(step.items).reduce((itemSum, items) => {
          return itemSum + (Array.isArray(items) ? items.length : 0);
        }, 0);
      } else if (Array.isArray(step.items)) {
        return sum + step.items.length;
      }
      return sum;
    }, 0);

    const foundSources = steps.filter(step => step.ok && step.items &&
      (Array.isArray(step.items) ? step.items.length > 0 : Object.keys(step.items).length > 0)
    ).length;

    // Сохраняем результат проверки в базу данных (если нужно)
    // TODO: Добавить сохранение в таблицу user_checks

    res.json({
      ok: true,
      phone: finalQuery,
      totalLeaks,
      foundSources,
      results: steps,
      message: totalLeaks > 0
        ? `Найдено ${totalLeaks} утечек по номеру телефона в ${foundSources} источниках`
        : 'Утечек по данному номеру телефона не найдено',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('User phone check error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

// Эндпоинт для автоматической проверки email пользователя
app.post('/api/check-user-email', requireAuth, userRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    console.log('🔍 User email check request received');

    const email = req.user.email;
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: { message: 'Email не найден в профиле пользователя' }
      });
    }

    console.log(`📧 Checking email: ${email} for user: ${req.user.id}`);

    // Используем существующую логику поиска
    const steps = [];

    for (const [idx, fn] of [searchITP, searchDyxless, searchLeakOsint, searchUsersbox, searchVektor].entries()) {
      const result = idx === 0 ? await fn(email, 'email') : await fn(email);
      steps.push(result);
    }

    // Подсчитываем общее количество найденных утечек
    const totalLeaks = steps.reduce((sum, step) => {
      if (!step.ok || !step.items) return sum;

      if (step.name === 'ITP' && typeof step.items === 'object') {
        return sum + Object.values(step.items).reduce((itemSum, items) => {
          return itemSum + (Array.isArray(items) ? items.length : 0);
        }, 0);
      } else if (Array.isArray(step.items)) {
        return sum + step.items.length;
      }
      return sum;
    }, 0);

    const foundSources = steps.filter(step => step.ok && step.items &&
      (Array.isArray(step.items) ? step.items.length > 0 : Object.keys(step.items).length > 0)
    ).length;

    // Сохраняем результат проверки в базу данных (если нужно)
    // TODO: Добавить сохранение в таблицу user_checks

    res.json({
      ok: true,
      email: email,
      totalLeaks,
      foundSources,
      results: steps,
      message: totalLeaks > 0
        ? `Найдено ${totalLeaks} утечек по email адресу в ${foundSources} источниках`
        : 'Утечек по данному email адресу не найдено',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('User email check error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
});

// Новый эндпоинт для красивого форматирования профиля утечек через GPT-4
app.post('/api/format-leak-profile', optionalAuth, userRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    console.log('🎨 Format leak profile request received');
    
    const { leakData } = req.body;
    
    if (!leakData || !Array.isArray(leakData) || leakData.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Данные утечек не предоставлены' 
      });
    }

    // Проверяем доступность DeepSeek V3
    if (!openai) {
      console.log('❌ DeepSeek V3 not available for profile formatting');
      return res.status(503).json({
        ok: false,
        error: 'ИИ форматирование временно недоступно',
        fallback: true
      });
    }

    // Подготавливаем данные для анализа
    const rawDataText = leakData.map(source => {
      if (!source.ok || !source.items) return '';
      
      let text = `=== ${source.name} ===\n`;
      
      if (typeof source.items === 'object' && !Array.isArray(source.items)) {
        // ITP формат
        Object.entries(source.items).forEach(([category, items]) => {
          if (Array.isArray(items) && items.length > 0) {
            text += `${category}:\n`;
            // Ограничиваем количество записей для уменьшения размера
            items.slice(0, 3).forEach(item => {
              text += `${JSON.stringify(item, null, 2)}\n`;
            });
            if (items.length > 3) {
              text += `... и еще ${items.length - 3} записей\n`;
            }
          }
        });
      } else if (Array.isArray(source.items)) {
        // Другие источники - ограничиваем до 5 записей
        source.items.slice(0, 5).forEach(item => {
          text += `${JSON.stringify(item, null, 2)}\n`;
        });
        if (source.items.length > 5) {
          text += `... и еще ${source.items.length - 5} записей\n`;
        }
      }
      
      return text;
    }).filter(Boolean).join('\n\n');

    // Ограничиваем размер данных для отправки в OpenAI
    const maxDataLength = 8000; // Ограничение на размер данных
    const truncatedData = rawDataText.length > maxDataLength 
      ? rawDataText.substring(0, maxDataLength) + '\n\n[ДАННЫЕ ОБРЕЗАНЫ ДЛЯ ОБРАБОТКИ]'
      : rawDataText;

    console.log('📝 Prepared data length:', truncatedData.length);

    const prompt = `Проанализируй предоставленные данные об утечках для номера телефона или email и представь полный отчет в формате профессионального аудита кибербезопасности. 

ВАЖНО: Используй ТОЛЬКО звездочки (**) для выделения заголовков, НЕ используй символы ## или #.

Отчет должен содержать следующие блоки:

1. **Детализированный анализ источников утечек:**
   Представь данные в виде маркдаун-таблицы со столбцами: "Источник утечки", "Год", "Отрасль", "Кол-во записей", "Типы данных", "Уровень критичности". Упорядочь таблицу по уровню критичности (от высшего к низшему). Критичность определяй на основе чувствительности данных (связка ФИО+адрес+телефон — критично и т.д.).

2. **Карта цифрового следа:**
   Создай markdown-таблицу, которая наглядно показывает найденные данные и их источники. Используй столбцы: "Тип данных", "Значение", "Источник утечки", "Дополнительная информация". Группируй связанные данные (например, телефон + ФИО из одного источника).

3. **Оценка рисков и последствий:**
   Сгенерируй список из 3-5 самых критичных рисков. Для каждого риска укажи:
   - Краткое название (например, "Целевой фишинг").
   - Уровень опасности (🔴 Критический, 🟠 Высокий, 🟡 Средний).
   - Развернутое объяснение с *конкретным сценарием* того, как злоумышленник может использовать именно эти данные. Объяснения должны быть простыми, но избегай общих фраз.

4. **Персональный план по защите (Roadmap):**
   Предложи четкий, пошаговый план действий, разделенный на этапы:
   - **ШАГ 1: НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ (Первые 24 часа)** (самые срочные меры: смена паролей, включение 2FA).
   - **ШАГ 2: ПРОАКТИВНАЯ ЗАЩИТА (Неделя)** (меры для усиления защиты: настройка виртуальных номеров, проверка настроек).
   - **ШАГ 3: ДОЛГОСРОЧНАЯ СТРАТЕГИЯ** (привычки и мониторинг: регулярные проверки, менеджеры паролей).
   Каждый пункт должен быть конкретным и выполнимым.

5. **Приоритетный список сайтов для смены паролей:**
   На основе найденных данных составь конкретный список сайтов и сервисов, где пользователю необходимо НЕМЕДЛЕННО сменить пароли. Включай:
   - Банки и финансовые сервисы (если есть связанные данные)
   - Популярные онлайн-сервисы (VK, Mail.ru, Yandex, Google)
   - Интернет-магазины (Wildberries, OZON, Lamoda)
   - Госуслуги и официальные порталы
   - Другие сервисы на основе найденных утечек
   Формат: маркированный список с ссылками и кратким объяснением риска для каждого.

**Тон отчета:** Профессиональный, экспертный, но понятный конечному пользователю. В конце отчета добавь призыв к действию, предлагающий провести глубокий аудит или удалить данные с помощью нашего сервиса.

**Данные для анализа:**
${truncatedData}

Создай профессиональный отчет по кибербезопасности на основе этих данных:`;

    try {
      console.log('🤖 Sending request to DeepSeek V3 for profile formatting...');
      console.log(`🔄 Using model: deepseek-chat`);
      
      // Создаем параметры запроса для DeepSeek V3
      const requestParams = {
        model: 'deepseek-chat', // DeepSeek V3 model
        messages: [
          {
            role: 'system',
            content: 'Ты - старший специалист по кибербезопасности и анализу утечек данных. Твоя специализация - создание профессиональных аудиторских отчетов по безопасности для корпоративных клиентов. Отвечай только на русском языке, используй терминологию кибербезопасности, но объясняй сложные концепции простым языком.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 6000, // Увеличено для подробного анализа
        temperature: 0.2 // Низкая температура для точного профессионального анализа
      };

      const completion = await openai.chat.completions.create(requestParams);
      console.log(`✅ Successfully used model: deepseek-chat`);

      const formattedProfile = completion.choices[0]?.message?.content;
      
      if (!formattedProfile || formattedProfile.trim() === '') {
        console.log('⚠️ Empty response from DeepSeek V3');
        throw new Error('Empty response from DeepSeek V3');
      }

      console.log('✅ DeepSeek V3 Chat Completions response received.');
      console.log('✅ AI service response received');
      console.log('✅ DeepSeek V3 profile formatting completed');
      console.log('📊 Response length:', formattedProfile.length);

      res.json({
        ok: true,
        model: 'deepseek-chat',
        profile: formattedProfile,
        meta: {
          sources_processed: leakData.length,
          data_length: truncatedData.length,
          original_data_length: rawDataText.length,
          response_length: formattedProfile.length
        }
      });

    } catch (aiError) {
      console.error('❌ DeepSeek V3 error in profile formatting:', aiError.message);
      
      // Provide fallback response when DeepSeek V3 fails
      const fallbackProfile = `📊 Анализ данных по запросу\n\nК сожалению, детальный анализ временно недоступен. Показаны базовые результаты поиска.`;
      
      res.status(500).json({
        ok: false,
        error: 'Ошибка форматирования профиля',
        details: aiError.message,
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Error in format-leak-profile:', error);
    res.status(500).json({
      ok: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// Функция для создания практического анализа безопасности на основе реальных данных
function createPracticalSecurityAnalysis(results, query, field) {
  const analysis = {
    critical_findings: [],
    affected_services: [],
    immediate_actions: [],
    risk_level: 'low'
  };

  let totalRecords = 0;
  let hasPasswords = false;
  let hasPersonalData = false;

  results.forEach(source => {
    if (!source.ok || !source.items) return;

    if (source.name === 'ITP' && typeof source.items === 'object') {
      // Анализируем базы ITP
      Object.entries(source.items).forEach(([dbName, dbData]) => {
        if (dbData.data && Array.isArray(dbData.data) && dbData.data.length > 0) {
          const records = dbData.data.length;
          totalRecords += records;
          
          const sampleRecord = dbData.data[0];
          const dataTypes = [];
          
          if (sampleRecord.phone) dataTypes.push('телефон');
          if (sampleRecord.email) dataTypes.push('email'); 
          if (sampleRecord.name) dataTypes.push('имя');
          if (sampleRecord.address) dataTypes.push('адрес');
          if (sampleRecord.password) {
            dataTypes.push('пароль');
            hasPasswords = true;
          }
          
          if (dataTypes.length > 2) hasPersonalData = true;

          // Определяем сервис по названию базы
          const serviceName = extractServiceName(dbName);
          const serviceUrl = getServiceUrl(serviceName);
          
          analysis.affected_services.push({
            source: 'ITP',
            database: dbName,
            service: serviceName,
            url: serviceUrl,
            records_found: records,
            data_types: dataTypes,
            risk_level: hasPasswords ? 'critical' : (hasPersonalData ? 'high' : 'medium')
          });

          analysis.critical_findings.push(
            `Найдено ${records} записей в базе "${dbName}" с данными: ${dataTypes.join(', ')}`
          );
        }
      });
    } else if (['Dyxless', 'LeakOsint', 'Usersbox', 'Vektor'].includes(source.name)) {
      // Анализируем другие источники
      if (Array.isArray(source.items) && source.items.length > 0) {
        totalRecords += source.items.length;
        
        analysis.affected_services.push({
          source: source.name,
          records_found: source.items.length,
          risk_level: 'medium'
        });

        analysis.critical_findings.push(
          `Найдено ${source.items.length} записей в базе ${source.name}`
        );
      }
    }
  });

  // Определяем общий уровень риска
  if (hasPasswords) {
    analysis.risk_level = 'critical';
  } else if (hasPersonalData || totalRecords > 5) {
    analysis.risk_level = 'high';
  } else if (totalRecords > 0) {
    analysis.risk_level = 'medium';
  }

  // Генерируем конкретные действия
  analysis.immediate_actions = generateSpecificActions(analysis.affected_services, hasPasswords);

  return {
    risk_level: analysis.risk_level,
    summary: `Обнаружено ${totalRecords} записей с вашими данными в ${analysis.affected_services.length} источниках`,
    security_recommendations: {
      password_change_sites: analysis.affected_services
        .filter(s => s.url)
        .map(s => s.url),
      immediate_actions: analysis.immediate_actions
    },
    detailed_findings: analysis.critical_findings,
    affected_services: analysis.affected_services
  };
}

// Извлекает название сервиса из названия базы данных
function extractServiceName(dbName) {
  const serviceMap = {
    'авито': 'Авито',
    'avito': 'Авито', 
    '2 берега': '2 Берега',
    'вконтакте': 'ВКонтакте',
    'vk': 'ВКонтакте',
    'одноклассники': 'Одноклассники',
    'ok': 'Одноклассники',
    'mail': 'Mail.ru',
    'яндекс': 'Яндекс',
    'yandex': 'Яндекс'
  };

  const dbLower = dbName.toLowerCase();
  for (const [key, value] of Object.entries(serviceMap)) {
    if (dbLower.includes(key)) {
      return value;
    }
  }
  
  return dbName; // Возвращаем оригинальное название если не нашли
}

// Получает URL сервиса для смены пароля
function getServiceUrl(serviceName) {
  const urlMap = {
    'Авито': 'avito.ru',
    '2 Берега': '2berega.ru',
    'ВКонтакте': 'vk.com',
    'Одноклассники': 'ok.ru', 
    'Mail.ru': 'mail.ru',
    'Яндекс': 'passport.yandex.ru'
  };
  
  return urlMap[serviceName] || null;
}

// Генерирует конкретные действия на основе найденных сервисов
function generateSpecificActions(services, hasPasswords) {
  const actions = [];
  
  if (hasPasswords) {
    actions.push('🔥 КРИТИЧНО: Обнаружены пароли! Немедленно смените пароли на всех сервисах');
  }
  
  services.forEach(service => {
    if (service.url) {
      actions.push(`Смените пароль на ${service.url} (найдено ${service.records_found} записей)`);
    }
  });
  
  actions.push('Включите двухфакторную аутентификацию на всех важных сервисах');
  actions.push('Проверьте банковские карты и счета на подозрительную активность');
  
  return actions;
}

// Функция для нормализации ответа OpenAI (поддержка разных форматов)
function normalizeOpenAIText(res) {
  if (!res || typeof res !== "object") return "";
  
  // 1) Chat Completions shape (наш текущий случай)
  const chatContent = res.choices?.[0]?.message?.content;
  if (chatContent && typeof chatContent === "string") {
    return chatContent.trim();
  }
  
  // 2) Responses API shape (если GPT-5 использует это)
  if (typeof res.output_text === "string" && res.output_text.length > 0) {
    return res.output_text.trim();
  }
  
  // 3) output[].content[].text
  const outputText = res.output?.flatMap(o => 
    o?.content?.flatMap(c => c?.text?.value || c?.text)?.filter(Boolean)
  )?.join("\n");
  if (outputText) return outputText.trim();
  
  // 4) Legacy completions
  const legacyText = res.choices?.[0]?.text;
  if (legacyText && typeof legacyText === "string") {
    return legacyText.trim();
  }
  
  return "";
}

// Новый эндпоинт для ИИ анализа утечек
app.post('/api/ai-leak-analysis', optionalAuth, userRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  console.log('🚀 AI Leak Analysis endpoint hit!');
  console.log('📥 Request method:', req.method);
  console.log('📋 Content-Type:', req.headers['content-type']);
  console.log('📦 Body exists:', !!req.body);
  
  try {
    const { query, field, results } = req.body || {};
    console.log('🔍 AI Leak Analysis request received');
    console.log('� Request data:');
    console.log('- Query:', query);
    console.log('- Field:', field);
    console.log('- Results count:', results?.length || 0);
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      console.log('❌ No results provided or invalid format');
      return res.status(400).json({ 
        ok: false,
        error: 'Данные для анализа не предоставлены или неверный формат' 
      });
    }

    // Проверяем, что это действительно данные утечек, а не компаний
    const isLeakData = results.some(result => 
      result.name && ['ITP', 'Dyxless', 'LeakOsint', 'Usersbox', 'Vektor'].includes(result.name)
    );
    
    if (!isLeakData) {
      console.log('❌ Not leak data:', results.map(r => r.name));
      return res.status(400).json({ 
        ok: false,
        error: 'ИИ анализ доступен только для результатов поиска утечек' 
      });
    }

    // Проверяем есть ли реальные утечки в данных
    const hasActualLeaks = results.some(result => {
      if (!result.ok || !result.items) return false;
      
      // Для каждого источника проверяем наличие данных
      const sourceName = result.name;
      if (sourceName === 'ITP' && typeof result.items === 'object') {
        // ITP возвращает объект с базами данных
        return Object.values(result.items).some(db => 
          db.data && Array.isArray(db.data) && db.data.length > 0
        );
      } else if (['Dyxless', 'LeakOsint', 'Usersbox', 'Vektor'].includes(sourceName)) {
        // Остальные возвращают массив
        return Array.isArray(result.items) && result.items.length > 0;
      }
      return false;
    });

    if (!hasActualLeaks) {
      console.log('📋 No actual leak data found, returning clean analysis');
      return res.json({
        ok: true,
        analysis: {
          risk_level: "low",
          summary: "Утечки данных не обнаружены для указанного запроса",
          security_recommendations: {
            password_change_sites: [],
            immediate_actions: ["Продолжайте использовать надежные пароли и двухфакторную аутентификацию"]
          }
        },
        model: 'static-clean',
        query,
        field
      });
    }

    // Проверяем доступность OpenAI
    if (!openai) {
      return res.status(503).json({
        ok: false,
        error: 'ИИ анализ временно недоступен'
      });
    }

    // Подготавливаем данные для анализа DeepSeek V3
    console.log('📦 Processing results for DeepSeek V3 analysis...');
    
    // Создаем максимально сокращенную версию данных для DeepSeek V3
    const summarizedResults = results.map(result => {
      if (!result.ok || !result.items) {
        return { name: result.name, status: 'no_data', error: result.error?.substring?.(0, 100) };
      }
      
      let itemCount = 0;
      let databases = [];
      let sampleRecord = null;
      
      if (result.name === 'ITP' && typeof result.items === 'object') {
        // Для ITP - передаем ВСЕ данные из всех баз (с лимитом) для полного AI анализа
        const allITPData = {};
        let totalRecords = 0;
        
        for (const [dbName, dbData] of Object.entries(result.items)) {
          if (dbData.data && Array.isArray(dbData.data) && dbData.data.length > 0) {
            // Берем до 8 записей из каждой базы для AI анализа
            allITPData[dbName] = {
              totalCount: dbData.data.length,
              samples: dbData.data.slice(0, 8) // Образцы данных для анализа
            };
            totalRecords += dbData.data.length;
          }
        }
        
        return { 
          name: result.name, 
          status: 'found_data',
          totalRecords: totalRecords,
          data: allITPData // Полные данные для AI анализа
        };
      } else if (Array.isArray(result.items) && result.items.length > 0) {
        // Для других источников - передаем ВСЕ записи (с лимитом) для полного AI анализа
        const limitedData = result.items.slice(0, 15); // До 15 записей для AI анализа
        
        return { 
          name: result.name, 
          status: 'found_data',
          totalRecords: result.items.length,
          data: limitedData // Полные данные вместо только статистики
        };
      }
      
      return { name: result.name, status: 'found_data', items: result.items };
    });
    
    const compressedData = JSON.stringify({
      query: query,
      field: field,
      sources: summarizedResults.filter(r => r.status === 'found_data')
    });
    
    console.log('📝 Sending compressed data to DeepSeek V3, length:', compressedData.length);

    // Проверяем доступность DeepSeek V3
    if (!openai) {
      console.error('❌ DeepSeek V3 client not initialized');
      return res.status(503).json({
        ok: false,
        error: 'ИИ анализ временно недоступен'
      });
    }

    console.log('📤 Starting DeepSeek V3 security analysis...');
    console.log('⏰ Analysis time:', new Date().toISOString());
    
    const startTime = Date.now();
    
    try {
      // Системный промпт для анализа утечек безопасности (профессиональный)
      const systemPrompt = `Ты - старший специалист по кибербезопасности и анализу утечек данных. Твоя специализация - создание профессиональных аудиторских отчетов по безопасности для корпоративных клиентов. Отвечай только на русском языке, используй терминологию кибербезопасности, но объясняй сложные концепции простым языком.`;

      const userPrompt = `Проанализируй предоставленные данные об утечках для запроса "${query}" (поле: ${field}) и представь полный отчет в формате профессионального аудита кибербезопасности. 

ВАЖНО: Используй ТОЛЬКО звездочки (**) для выделения заголовков, НЕ используй символы ## или #.

Отчет должен содержать следующие блоки:

1. **Детализированный анализ источников утечек:**
   Представь данные в виде маркдаун-таблицы со столбцами: "Источник утечки", "Год", "Отрасль", "Кол-во записей", "Типы данных", "Уровень критичности". Упорядочь таблицу по уровню критичности (от высшего к низшему). Критичность определяй на основе чувствительности данных (связка ФИО+адрес+телефон — критично и т.д.).

2. **Карта цифрового следа:**
   Создай markdown-таблицу, которая наглядно показывает найденные данные и их источники. Используй столбцы: "Тип данных", "Значение", "Источник утечки", "Дополнительная информация". Группируй связанные данные (например, телефон + ФИО из одного источника).

3. **Оценка рисков и последствий:**
   Сгенерируй список из 3-5 самых критичных рисков. Для каждого риска укажи:
   - Краткое название (например, "Целевой фишинг").
   - Уровень опасности (🔴 Критический, 🟠 Высокий, 🟡 Средний).
   - Развернутое объяснение с *конкретным сценарием* того, как злоумышленник может использовать именно эти данные. Объяснения должны быть простыми, но избегай общих фраз.

4. **Персональный план по защите (Roadmap):**
   Предложи четкий, пошаговый план действий, разделенный на этапы:
   - **ШАГ 1: НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ (Первые 24 часа)** (самые срочные меры: смена паролей, включение 2FA).
   - **ШАГ 2: ПРОАКТИВНАЯ ЗАЩИТА (Неделя)** (меры для усиления защиты: настройка виртуальных номеров, проверка настроек).
   - **ШАГ 3: ДОЛГОСРОЧНАЯ СТРАТЕГИЯ** (привычки и мониторинг: регулярные проверки, менеджеры паролей).
   Каждый пункт должен быть конкретным и выполнимым.

5. **Приоритетный список сайтов для смены паролей:**
   На основе найденных данных составь конкретный список сайтов и сервисов, где пользователю необходимо НЕМЕДЛЕННО сменить пароли. Включай:
   - Банки и финансовые сервисы (если есть связанные данные)
   - Популярные онлайн-сервисы (VK, Mail.ru, Yandex, Google)
   - Интернет-магазины (Wildberries, OZON, Lamoda)
   - Госуслуги и официальные порталы
   - Другие сервисы на основе найденных утечек
   Формат: маркированный список с ссылками и кратким объяснением риска для каждого.

**Тон отчета:** Профессиональный, экспертный, но понятный конечному пользователю. В конце отчета добавь призыв к действию, предлагающий провести глубокий аудит или удалить данные с помощью нашего сервиса.

**Данные для анализа:**
${compressedData}

Создай профессиональный отчет по кибербезопасности на основе этих данных:`;

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 6000, // Увеличено для подробного анализа безопасности
        temperature: 0.2, // Низкая температура для точного анализа
        top_p: 0.8, // Более низкий top_p для фокуса
        stream: false // Убеждаемся что не используем streaming
      });

      const analysis = completion.choices[0].message.content;
      const endTime = Date.now();
      
      console.log(`⏰ DeepSeek V3 analysis completed in ${endTime - startTime}ms`);
      console.log('✅ DeepSeek V3 analysis preview:', analysis.substring(0, 200) + '...');
      
      return res.json({
        ok: true,
        analysis,
        model: 'deepseek-chat',
        query,
        field,
        responseTime: endTime - startTime,
        usage: completion.usage
      });

    } catch (aiError) {
      console.error('❌ DeepSeek V3 analysis error:', aiError);
      
      // Fallback к программному анализу при ошибке ИИ
      const fallbackAnalysis = createPracticalSecurityAnalysis(results, query, field);
      const endTime = Date.now();
      
      return res.json({
        ok: true,
        analysis: `⚠️ ИИ анализ временно недоступен. Показан базовый анализ:\n\n${JSON.stringify(fallbackAnalysis, null, 2)}`,
        model: 'fallback-analysis',
        query,
        field,
        responseTime: endTime - startTime,
        error: aiError.message
      });
    }

  } catch (error) {
    console.error('AI leak analysis error:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка при анализе данных'
    });
  }
});// Функция для подготовки данных утечек для анализа
function summarizeLeakData(results) {
  let summary = '';
  
  results.forEach(result => {
    if (!result.ok || !result.items) {
      summary += `${result.name}: Нет данных\n`;
      return;
    }

    const sourceName = result.name;
    let count = 0;
    let databases = [];

    // Подсчитываем записи по типу источника
    if (sourceName === 'ITP' && typeof result.items === 'object') {
      for (const [category, items] of Object.entries(result.items)) {
        if (Array.isArray(items) && items.length > 0) {
          count += items.length;
          databases.push(category);
        }
      }
    } else if (Array.isArray(result.items)) {
      count = result.items.length;
      // Пытаемся извлечь названия баз данных
      const dbNames = result.items.map(item => item.database || item.source).filter(Boolean);
      databases = [...new Set(dbNames)];
    }

    if (count > 0) {
      summary += `${sourceName}: ${count} записей`;
      if (databases.length > 0) {
        summary += ` в базах: ${databases.slice(0, 3).join(', ')}`;
        if (databases.length > 3) summary += ` и еще ${databases.length - 3}`;
      }
      summary += '\n';
    }
  });

  return summary || 'Данные не найдены';
}

// Новая функция для детального анализа утечек
function extractDetailedLeakData(results) {
  let detailedData = '';
  let totalLeaks = 0;
  let uniqueDatabases = new Set();
  let sensitiveData = [];

  results.forEach(result => {
    if (!result.ok || !result.items) {
      detailedData += `${result.name}: Нет данных\n`;
      return;
    }

    const sourceName = result.name;
    detailedData += `\n=== ${sourceName} ===\n`;

    if (sourceName === 'ITP' && typeof result.items === 'object') {
      for (const [category, items] of Object.entries(result.items)) {
        if (Array.isArray(items) && items.length > 0) {
          detailedData += `${category}: ${items.length} записей\n`;
          totalLeaks += items.length;
          uniqueDatabases.add(category);
          
          // Берем первые 2-3 записи для анализа
          items.slice(0, 3).forEach(item => {
            if (item.password) sensitiveData.push(`Пароль: ${item.password}`);
            if (item.email) sensitiveData.push(`Email: ${item.email}`);
            if (item.phone) sensitiveData.push(`Телефон: ${item.phone}`);
            if (item.login) sensitiveData.push(`Логин: ${item.login}`);
          });
        }
      }
    } else if (Array.isArray(result.items)) {
      detailedData += `Найдено: ${result.items.length} записей\n`;
      totalLeaks += result.items.length;
      
      // Берем первые 3 записи для анализа
      result.items.slice(0, 3).forEach(item => {
        if (item.database) uniqueDatabases.add(item.database);
        if (item.source) uniqueDatabases.add(item.source);
        
        if (item.password) sensitiveData.push(`Пароль: ${item.password}`);
        if (item.email) sensitiveData.push(`Email: ${item.email}`);
        if (item.phone) sensitiveData.push(`Телефон: ${item.phone}`);
        if (item.login) sensitiveData.push(`Логин: ${item.login}`);
        if (item.data) sensitiveData.push(`Данные: ${JSON.stringify(item.data).substring(0, 100)}`);
      });
    }
  });

  // Добавляем сводку
  detailedData += `\n=== СВОДКА ===\n`;
  detailedData += `Общее количество утечек: ${totalLeaks}\n`;
  detailedData += `Затронутые базы данных: ${Array.from(uniqueDatabases).join(', ')}\n`;
  
  if (sensitiveData.length > 0) {
    detailedData += `\nПримеры утечек (первые записи):\n`;
    detailedData += sensitiveData.slice(0, 10).join('\n');
  }

  return detailedData;
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({ 
    ok: true, 
    version: '2.0', 
    design: 'modern',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// Простой healthcheck для Railway
app.get('/health', (_req, res) => {
  try {
    // Проверяем что сервер отвечает
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      port: PORT,
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({ 
    message: 'DataTrace API Server', 
    version: '2.0',
    endpoints: ['/api/health', '/health', '/modern']
  });
});

// Новый дизайн на отдельном endpoint
app.get('/modern', (_req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '..', 'public', 'datatrace-modern.html'));
});

// Старый дизайн для отладки
app.get('/old', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'datatrace-styled.html'));
});

app.get('*', (_req, res) => {
  // Отключаем кеширование
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '..', 'public', 'datatrace-modern.html'));
});

// Snusbase API endpoints
const SnusbaseService = require('./services/SnusbaseService');
const snusbaseService = new SnusbaseService();

// Snusbase connection test endpoint (без аутентификации для диагностики)
app.get('/api/snusbase/test', userRateLimit(3, 60 * 60 * 1000), async (req, res) => {
  try {
    console.log('🔍 Snusbase connection test request');

    const testResult = await snusbaseService.testConnection();

    if (!testResult.success) {
      console.error('❌ Snusbase connection test failed:', testResult.error);
      return res.status(500).json({
        ok: false,
        error: testResult.error || 'Ошибка подключения к Snusbase'
      });
    }

    console.log('✅ Snusbase connection test successful');

    res.json({
      ok: true,
      connection: 'successful',
      rows: testResult.rows,
      tablesCount: testResult.tablesCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Snusbase connection test error:', error);
    res.status(500).json({
      ok: false,
      error: 'Внутренняя ошибка сервера при тестировании подключения'
    });
  }
});

// Domain search endpoint for Snusbase (без аутентификации для тестирования)
app.post('/api/snusbase/domain-search', userRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Домен обязателен для поиска'
      });
    }

    // Простая валидация домена
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain.trim())) {
      return res.status(400).json({
        ok: false,
        error: 'Введите корректный домен (например: company.com)'
      });
    }

    console.log(`🌐 Snusbase domain search request for: ${domain}`);

    const cleanDomain = domain.trim().toLowerCase();
    const searchResult = await snusbaseService.searchByDomain(cleanDomain);

    if (!searchResult.success) {
      console.error(`❌ Snusbase search failed for ${cleanDomain}:`, searchResult.error);
      return res.status(500).json({
        ok: false,
        error: searchResult.error || 'Ошибка поиска в базе данных утечек'
      });
    }

    // Форматируем результаты для фронтенда
    const formattedResult = snusbaseService.formatForFrontend(searchResult);

    console.log(`✅ Snusbase search completed for ${cleanDomain}: ${formattedResult.totalResults} results`);
    console.log(`📊 Results structure:`, {
      totalResults: formattedResult.totalResults,
      resultsLength: formattedResult.results?.length,
      hasResults: Array.isArray(formattedResult.results),
      firstResult: formattedResult.results?.[0] ? 'has data' : 'empty',
      analysisPresent: !!formattedResult.analysis
    });

    res.json({
      ok: true,
      domain: cleanDomain,
      results: formattedResult.results,
      databases: formattedResult.databases,
      analysis: formattedResult.analysis,
      summary: formattedResult.summary,
      metadata: formattedResult.metadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Snusbase domain search error:', error);
    res.status(500).json({
      ok: false,
      error: 'Внутренняя ошибка сервера при поиске утечек'
    });
  }
});

// Snusbase stats endpoint
app.post('/api/snusbase/stats', requireAuth, userRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Домен обязателен для получения статистики'
      });
    }

    console.log(`📊 Snusbase stats request for: ${domain}`);

    const cleanDomain = domain.trim().toLowerCase();
    const statsResult = await snusbaseService.getDomainStats(cleanDomain);

    if (!statsResult.success) {
      console.error(`❌ Snusbase stats failed for ${cleanDomain}:`, statsResult.error);
      return res.status(500).json({
        ok: false,
        error: statsResult.error || 'Ошибка получения статистики'
      });
    }

    console.log(`✅ Snusbase stats completed for ${cleanDomain}`);

    res.json({
      ok: true,
      domain: cleanDomain,
      stats: statsResult.stats,
      metadata: statsResult.metadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Snusbase stats error:', error);
    res.status(500).json({
      ok: false,
      error: 'Внутренняя ошибка сервера при получении статистики'
    });
  }
});

// Snusbase databases list endpoint
app.get('/api/snusbase/databases', requireAuth, userRateLimit(3, 60 * 60 * 1000), async (req, res) => {
  try {
    console.log('📋 Snusbase databases list request');

    const databasesResult = await snusbaseService.getDatabases();

    if (!databasesResult.success) {
      console.error('❌ Snusbase databases list failed:', databasesResult.error);
      return res.status(500).json({
        ok: false,
        error: databasesResult.error || 'Ошибка получения списка баз данных'
      });
    }

    console.log(`✅ Snusbase databases list completed: ${databasesResult.databases.length} databases`);

    res.json({
      ok: true,
      databases: databasesResult.databases,
      metadata: databasesResult.metadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Snusbase databases error:', error);
    res.status(500).json({
      ok: false,
      error: 'Внутренняя ошибка сервера при получении списка баз данных'
    });
  }
});

app.listen(PORT, '0.0.0.0', (error) => {
  if (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
  
  // eslint-disable-next-line no-console
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check available at http://0.0.0.0:${PORT}/health`);
  console.log(`📊 API health at http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Server started successfully at ${new Date().toISOString()}`);
});

// Обработчики ошибок процесса для Railway
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  process.exit(0);
});


