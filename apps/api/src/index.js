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
const PORT = process.env.PORT || 3000;

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
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log('✅ OpenAI client initialized successfully');
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
const KimiService = require('./services/KimiService');

const openaiService = new OpenAIService(OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o');
const deepseekService = new DeepSeekService(
  process.env.DEEPSEEK_API_KEY,
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
);
// Initialize Kimi service safely
let kimiService;
try {
  kimiService = new KimiService(
    process.env.KIMI_API_KEY,
    process.env.KIMI_BASE_URL || 'https://platform.moonshot.ai'
  );
} catch (error) {
  console.warn('⚠️ Failed to initialize Kimi service:', error.message);
  kimiService = { isAvailable: () => false, createFallbackResponse: () => ({}) };
}

// Choose AI services by use case
// Company summaries: prefer OpenAI if available (GPT-4o or GPT-4), fallback to DeepSeek, then fallback
const companyAIService = openaiService.isAvailable()
  ? openaiService
  : (deepseekService.isAvailable() ? deepseekService : openaiService);
const leaksAIService = kimiService.isAvailable() ? kimiService : (deepseekService.isAvailable() ? deepseekService : openaiService);

console.log(`🤖 Company AI service: ${companyAIService.isAvailable() ?
  (deepseekService.isAvailable() ? 'DeepSeek' : 'OpenAI') : 'None (fallback mode)'}`);
console.log(`🔍 Leaks AI service: ${leaksAIService.isAvailable() ?
  (kimiService.isAvailable() ? 'Kimi' : (deepseekService.isAvailable() ? 'DeepSeek' : 'OpenAI')) : 'None (fallback mode)'}`);

// Initialize DeHashed service
const dehashedService = new DeHashedService(
  process.env.DEHASHED_API_KEY,
  process.env.DEHASHED_BASE_URL || 'https://api.dehashed.com'
);

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

    // Устанавливаем общий таймаут для всего запроса
    const requestTimeout = setTimeout(() => {
      console.log('⏰ Request timeout reached, sending fallback');
      if (!res.headersSent) {
        const fallbackResponse = ErrorHandler.createFallbackResponse(
          { query, field, results }, 'leaks', 'timeout'
        );
        res.json(fallbackResponse);
      }
    }, 25000); // 25 секунд общий таймаут

      console.log(`Starting AI request with ${leaksAIService.isAvailable() ?
        (kimiService.isAvailable() ? 'Kimi' : (deepseekService.isAvailable() ? 'DeepSeek' : 'OpenAI'))
        : 'fallback'}...`);

    try {
      const compact = compactResults(results);
      const optimizedData = optimizeDataForAI(compact);

      // Используем Kimi для анализа утечек
      const response = await leaksAIService.generateSummary(
        { query, field, results: optimizedData }, 'leaks'
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

app.get('/api/health', (_req, res) => res.json({ ok: true, version: '2.0', design: 'modern' }));

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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});


