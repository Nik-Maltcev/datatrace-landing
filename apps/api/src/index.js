const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const OpenAI = require('openai');
const OpenAIService = require('./services/OpenAIService');
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

// OpenAI client
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let openai = null;

// Initialize OpenAI client only if API key is available
console.log('Checking OpenAI API key...');
console.log('OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);

if (OPENAI_API_KEY && OPENAI_API_KEY.trim() !== '') {
  try {
    openai = new OpenAI({ 
      apiKey: OPENAI_API_KEY,
      timeout: 120000, // 120 секунд таймаут для GPT-5
      maxRetries: 3
    });
    console.log('✅ OpenAI client initialized successfully');
    console.log('🔍 OpenAI SDK version check...');
    console.log('📦 Available OpenAI methods:', Object.getOwnPropertyNames(openai.chat.completions).slice(0, 5));
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error.message);
    openai = null;
  }
} else {
  console.warn('⚠️ OpenAI API key not found in environment variables');
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('OPENAI')));
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
    return { name: 'ITP', ok: true, meta: { records: data.records, searchId: data.searchId }, items: data.data };
  } catch (err) {
    return { name: 'ITP', ok: false, error: normalizeError(err) };
  }
}

async function searchDyxless(query) {
  const attempt = async () => {
    const res = await axios.post(
      DYXLESS_BASE + '/query',
      { query, token: TOKENS.DYXLESS },
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
    return { name: 'Dyxless', ok: !!data.status, meta: { count: data.counts }, items: data.data };
  };

  try {
    return await attempt();
  } catch (e1) {
    // quick retry on 52x / network errors
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
    // Error path
    if (data && (data['Error code'] || data.Error || data.error)) {
      return { name: 'LeakOsint', ok: false, error: data };
    }
    // Normal path
    const list = data.List || {};
    const items = Object.keys(list).map((k) => ({ db: k, info: list[k]?.InfoLeak, data: list[k]?.Data }));
    if (!Object.keys(list).length) {
      return { name: 'LeakOsint', ok: false, error: { message: 'Нет данных или неизвестный формат ответа', preview: data } };
    }
    return { name: 'LeakOsint', ok: true, items };
  } catch (err) {
    return { name: 'LeakOsint', ok: false, error: normalizeError(err) };
  }
}

async function searchUsersbox(query) {
  try {
    const res = await axios.get(
      USERSBOX_BASE + '/explain',
      {
        params: { q: query },
        headers: { Authorization: TOKENS.USERSBOX }
      }
    );
    const data = res.data || {};
    return { name: 'Usersbox', ok: data.status === 'success', items: data.data?.items, meta: { count: data.data?.count } };
  } catch (err) {
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


// Initialize AI services
const DeepSeekService = require('./services/DeepSeekService');

const openaiService = new OpenAIService(OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-5');
const deepseekService = new DeepSeekService(
  process.env.DEEPSEEK_API_KEY,
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
);

// Choose AI services by use case
// Company summaries: prefer OpenAI if available (GPT-5 or GPT-4o), fallback to DeepSeek, then fallback
const companyAIService = openaiService.isAvailable()
  ? openaiService
  : (deepseekService.isAvailable() ? deepseekService : openaiService);
// Leaks summaries: также используем OpenAI для консистентности
const leaksAIService = openaiService.isAvailable()
  ? openaiService
  : (deepseekService.isAvailable() ? deepseekService : openaiService);

console.log(`🤖 Company AI service: ${companyAIService.isAvailable() ?
  'OpenAI' : 'None (fallback mode)'}`);
console.log(`🔍 Leaks AI service: ${leaksAIService.isAvailable() ?
  'OpenAI' : 'None (fallback mode)'}`);
console.log(`🎯 Both services using unified OpenAI for better consistency`);
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
    const { email, password, userData } = req.body;

    if (!email || !password) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ValidationError', message: 'Email and password are required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    const result = await authService.signUp(email, password, userData);

    if (result.ok) {
      res.json(result);
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
    res.json({
      ok: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user endpoint error:', error);
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

    // Проверяем доступность OpenAI
    if (!openai) {
      console.log('❌ OpenAI not available for profile formatting');
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

    const prompt = `Ты - эксперт по анализу данных утечек. Твоя задача - создать красивый структурированный профиль пользователя на основе данных из различных баз данных утечек.

ВАЖНЫЕ ПРАВИЛА:
1. Объединяй дублирующуюся информацию между источниками
2. Маскируй конфиденциальные данные (номера карт: 4276 88** **** 0319, паспорта: 9218 41****22)
3. Группируй информацию по логическим категориям
4. Используй эмодзи для визуального разделения
5. Пиши на русском языке
6. Не выдумывай данные - используй только то, что есть в источниках
7. Если нет данных для раздела - не включай его

СТРУКТУРА ОТВЕТА:
📋 Основная информация
- Полное имя
- Дата рождения  
- Пол
- Телефоны

📧 Email адреса
- Список email с описанием (основной, деловой, etc.)

🏠 Адреса проживания
- Основной адрес
- Дополнительные адреса

🔍 Telegram профиль
- ID и имена в контактах

🏦 Финансовые данные
- Банковские карты (замаскированные)
- Банки и услуги

📄 Документы
- Паспорт (замаскированный)
- СНИЛС (замаскированный)

🛒 Интернет-сервисы
- Группировка по категориям (книги, еда, доставка, etc.)

💰 Финансовые услуги
- МФО, займы, страхование

🎯 Дополнительные сведения
- VIP статусы, деятельность, география

ИСХОДНЫЕ ДАННЫЕ:
${truncatedData}

Создай красивый профиль на основе этих данных:`;

    try {
      console.log('🤖 Sending request to OpenAI for profile formatting...');
      console.log(`🔄 Trying model: gpt-5`);
      
      // Создаем параметры запроса для GPT-5
      const requestParams = {
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'Ты - эксперт по анализу данных и созданию структурированных профилей. Отвечай только на русском языке.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 4096
      };

      const completion = await openai.chat.completions.create(requestParams);
      console.log(`✅ Successfully used model: gpt-5`);

      const formattedProfile = completion.choices[0]?.message?.content;
      
      if (!formattedProfile || formattedProfile.trim() === '') {
        console.log('⚠️ Empty response from OpenAI, trying next model...');
        throw new Error('Empty response from GPT-5');
      }

      console.log('✅ OpenAI Chat Completions response received.');
      console.log('✅ AI service response received');
      console.log('✅ OpenAI profile formatting completed');
      console.log('📊 Response length:', formattedProfile.length);

      res.json({
        ok: true,
        model: 'gpt-5',
        profile: formattedProfile,
        meta: {
          sources_processed: leakData.length,
          data_length: truncatedData.length,
          original_data_length: rawDataText.length,
          response_length: formattedProfile.length
        }
      });

    } catch (aiError) {
      console.error('❌ OpenAI error in profile formatting:', aiError.message);
      
      // Provide fallback response when OpenAI fails
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

    // Подготавливаем данные для анализа - ограничиваем размер для GPT-5
    console.log('📦 Processing results for AI analysis...');
    
    // Создаем максимально сокращенную версию данных для GPT-5
    const summarizedResults = results.map(result => {
      if (!result.ok || !result.items) {
        return { name: result.name, status: 'no_data', error: result.error?.substring?.(0, 100) };
      }
      
      let itemCount = 0;
      let databases = [];
      let sampleRecord = null;
      
      if (result.name === 'ITP' && typeof result.items === 'object') {
        // Для ITP - только статистика + один пример
        for (const [dbName, dbData] of Object.entries(result.items)) {
          if (dbData.data && Array.isArray(dbData.data) && dbData.data.length > 0) {
            itemCount += dbData.data.length;
            databases.push(dbName);
            
            // Берем только первый пример, если еще нет
            if (!sampleRecord && dbData.data[0]) {
              sampleRecord = {
                database: dbName,
                hasPhone: !!dbData.data[0].phone,
                hasEmail: !!dbData.data[0].email,
                hasAddress: !!dbData.data[0].address,
                hasName: !!dbData.data[0].name,
                hasPassword: !!dbData.data[0].password
              };
            }
          }
        }
        return { 
          name: result.name, 
          status: 'found_data',
          totalRecords: itemCount, 
          databases: databases.slice(0, 3), // максимум 3 названия
          sampleRecord 
        };
      } else if (Array.isArray(result.items) && result.items.length > 0) {
        // Для других источников - только статистика + один пример
        itemCount = result.items.length;
        const firstItem = result.items[0];
        sampleRecord = {
          hasPhone: !!firstItem.phone,
          hasEmail: !!firstItem.email,
          hasPassword: !!firstItem.password,
          hasDatabase: !!firstItem.database,
          hasLogin: !!firstItem.login
        };
        return { 
          name: result.name, 
          status: 'found_data',
          totalRecords: itemCount, 
          sampleRecord 
        };
      }
      
      return { name: result.name, status: 'found_data', items: result.items };
    });
    
    const compressedData = JSON.stringify({
      query: query,
      field: field,
      sources: summarizedResults.filter(r => r.status === 'found_data')
    });
    
    console.log('📝 Sending compressed data to GPT-5, length:', compressedData.length);

    // Проверяем доступность OpenAI
    if (!openai) {
      console.error('❌ OpenAI client not initialized');
      return res.status(503).json({
        ok: false,
        error: 'ИИ анализ временно недоступен'
      });
    }

    console.log('📤 Starting GPT-5 analysis...');
    console.log('⏰ Request time:', new Date().toISOString());
    
    let response;
    const startTime = Date.now();
    
    try {
      // Улучшенный запрос к GPT-5 с правильными параметрами
      response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'Ты — аналитик данных. Анализируй кратко и сразу отвечай JSON. Не размышляй долго. Формат: {"risk_level": "low|medium|high", "summary": "краткое описание", "security_recommendations": {"password_change_sites": ["сайты"], "immediate_actions": ["действия"]}}.'
          },
          {
            role: 'user', 
            content: `Данные: ${compressedData}. Верни JSON анализ безопасности.`
          }
        ],
        max_completion_tokens: 800, // Возвращаем к 800, reasoning отключен
        reasoning_effort: "low" // Отключаем избыточное reasoning!
      });
      
      const endTime = Date.now();
      console.log(`⏰ GPT-5 response time: ${endTime - startTime}ms`);
      console.log('⏰ Completed at:', new Date().toISOString());
      
      // Нормализуем ответ с помощью новой функции
      const rawText = normalizeOpenAIText(response);
      console.log('🔍 Normalized AI response:', rawText);
      console.log('📏 Response length:', rawText.length);
      
      // ДЕТАЛЬНАЯ ДИАГНОСТИКА для пустых ответов
      console.log('🔍 Full response structure analysis:');
      console.log('- response type:', typeof response);
      console.log('- response.choices exists:', !!response.choices);
      console.log('- response.choices length:', response.choices?.length || 0);
      if (response.choices?.[0]) {
        console.log('- choices[0] exists:', true);
        console.log('- choices[0].message exists:', !!response.choices[0].message);
        console.log('- choices[0].message.content:', JSON.stringify(response.choices[0].message?.content));
        console.log('- choices[0].message.content type:', typeof response.choices[0].message?.content);
        console.log('- choices[0].message keys:', Object.keys(response.choices[0].message || {}));
      }
      console.log('- response.output_text:', JSON.stringify(response.output_text));
      console.log('- response.output exists:', !!response.output);
      console.log('- response keys:', Object.keys(response));
      
      // Проверяем finish_reason для диагностики
      const finishReason = response.choices?.[0]?.finish_reason;
      console.log('🏁 Finish reason:', finishReason);
      
      if (!rawText || rawText.length === 0) {
        console.warn('⚠️ Empty AI response detected!');
        console.log('🔍 FULL RESPONSE DUMP:', JSON.stringify(response, null, 2));
        
        // Попробуем альтернативные способы извлечения текста
        console.log('🧪 Testing alternative extraction methods:');
        console.log('- JSON.stringify(response.choices):', JSON.stringify(response.choices));
        console.log('- response.data:', JSON.stringify(response.data));
        console.log('- response.choices[0]?.delta:', JSON.stringify(response.choices?.[0]?.delta));
        
        throw new Error('GPT-5 returned empty response');
      }
      
      // Парсим JSON с улучшенной обработкой ошибок
      let analysis;
      try {
        analysis = JSON.parse(rawText);
        console.log('✅ JSON parsing successful');
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
        console.log('💔 Raw response that failed to parse:', JSON.stringify(rawText));
        throw new Error('Invalid JSON response from GPT-5: ' + parseError.message);
      }
      
      console.log('✅ AI leak analysis completed successfully');
      return res.json({
        ok: true,
        analysis,
        model: 'gpt-5',
        query,
        field,
        responseTime: endTime - startTime
      });
      
    } catch (error) {
      const endTime = Date.now();
      console.error('❌ GPT-5 request failed after', endTime - startTime, 'ms');
      console.error('❌ Error details:', error.message);
      console.error('❌ Full error:', error);
      
      // Fallback анализ при ошибке GPT-5
      console.log('🔄 Using fallback analysis due to GPT-5 error');
      const fallbackAnalysis = {
        risk_level: "medium", 
        summary: "Обнаружены данные в утечках. Рекомендуется сменить пароли на затронутых сервисах.",
        security_recommendations: {
          password_change_sites: ["затронутые сервисы"],
          immediate_actions: ["Смените пароли", "Включите двухфакторную аутентификацию"]
        }
      };
      
      console.log('✅ AI leak analysis completed with fallback');
      return res.json({
        ok: true,
        analysis: fallbackAnalysis,
        model: 'gpt-5-fallback',
        query,
        field,
        error: error.message
      });
    }

  } catch (error) {
    console.error('AI leak analysis error:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка при анализе данных'
    });
  }
});

// Функция для подготовки данных утечек для анализа
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
  res.status(200).send('OK');
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

app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check available at http://0.0.0.0:${PORT}/health`);
  console.log(`📊 API health at http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});


