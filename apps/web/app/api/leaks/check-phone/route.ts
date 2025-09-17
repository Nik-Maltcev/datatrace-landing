import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Import normalizers
const ITPNormalizer = require('@/lib/utils/ITPNormalizer');
const DyxlessNormalizer = require('@/lib/utils/DyxlessNormalizer');
const LeakOsintNormalizer = require('@/lib/utils/LeakOsintNormalizer');
const UsersboxNormalizer = require('@/lib/utils/UsersboxNormalizer');
const VektorNormalizer = require('@/lib/utils/VektorNormalizer');

// API tokens from environment
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

function extractUsernameIfSocial(field: string, query: string): string {
  if (!query || (field !== 'vk' && field !== 'ok')) return query;
  try {
    if (/^https?:\/\//i.test(query)) {
      const u = new URL(query);
      const host = u.hostname.replace(/^www\./, '');
      if (host.includes('vk.com')) {
        const seg = u.pathname.split('/').filter(Boolean);
        if (seg.length > 0) return seg[seg.length - 1];
      }
      if (host.includes('ok.ru') || host.includes('odnoklassniki.ru')) {
        const seg = u.pathname.split('/').filter(Boolean);
        if (seg.length > 0) return seg[seg.length - 1];
      }
    }
    return query.replace(/^@+/, '');
  } catch {
    return query;
  }
}

async function searchITP(query: string, field: string) {
  try {
    const itpTypeMap: Record<string, string> = {
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
      { 
        headers: { 'x-api-key': TOKENS.ITP },
        timeout: 15000
      }
    );
    
    const data = res.data || {};
    const normalizedItems = data.data ? ITPNormalizer.normalizeRecords(data.data) : [];
    
    return { 
      name: 'ITP', 
      ok: true, 
      found: normalizedItems.length > 0,
      count: normalizedItems.length,
      data: normalizedItems,
      items: data.data // Сохраняем оригинальную структуру для совместимости
    };
  } catch (err: any) {
    return { name: 'ITP', ok: false, found: false, count: 0, error: err.message };
  }
}

async function searchDyxless(query: string, type: string = 'standart') {
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
      found: count > 0,
      count: count,
      data: items,
      items: items
    };
    
    console.log('🎯 About to call DyxlessNormalizer.normalizeResponse with:', {
      itemsLength: items.length,
      count: count,
      normalizerExists: typeof DyxlessNormalizer !== 'undefined',
      normalizeFuncExists: typeof DyxlessNormalizer?.normalizeResponse === 'function'
    });
    
    try {
      const result = DyxlessNormalizer.normalizeResponse(normalizedResponse);
      console.log('✅ DyxlessNormalizer completed successfully');
      return result;
    } catch (error: any) {
      console.error('❌ DyxlessNormalizer error:', error.message);
      console.error('📋 Stack trace:', error.stack);
      // Fallback - return non-normalized response
      return normalizedResponse;
    }
  };

  try {
    return await attempt();
  } catch (e1: any) {
    // Handle specific error cases from new API
    if (e1.response?.status === 401) {
      return { name: 'Dyxless', ok: false, found: false, count: 0, error: 'Неверный токен Dyxless API' };
    }
    if (e1.response?.status === 403) {
      const errorData = e1.response.data || {};
      return { name: 'Dyxless', ok: false, found: false, count: 0, error: errorData.message || 'Недостаточно средств на балансе' };
    }
    if (e1.response?.status === 404) {
      return { name: 'Dyxless', ok: true, found: false, count: 0, data: [], items: [] };
    }
    
    // Retry once after 600ms for other errors
    await new Promise((r) => setTimeout(r, 600));
    try {
      return await attempt();
    } catch (e2: any) {
      return { name: 'Dyxless', ok: false, found: false, count: 0, error: e2.message || 'Connection timeout' };
    }
  }
}

async function searchLeakOsint(query: string) {
  try {
    const res = await axios.post(
      LEAKOSINT_BASE,
      { token: TOKENS.LEAKOSINT, request: query, limit: 100, lang: 'ru', type: 'json' },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );
    
    const data = res.data || {};
    
    // Debug logging to understand the structure
    console.log('🔍 LeakOsint response data:', JSON.stringify(data, null, 2));
    
    if (data && (data['Error code'] || data.Error || data.error)) {
      return { name: 'LeakOsint', ok: false, found: false, count: 0, error: data };
    }
    
    // Check for "No results found" message - this means no leaks were found
    const responseText = JSON.stringify(data).toLowerCase();
    console.log('🔍 LeakOsint response text (for checking):', responseText.substring(0, 200));
    
    if (responseText.includes('no results found') || 
        responseText.includes('не найдено результатов') ||
        responseText.includes('нет результатов')) {
      console.log('✅ LeakOsint: Detected "No results found" in response');
      return { name: 'LeakOsint', ok: true, found: false, count: 0, data: [], items: [] };
    }
    
    const list = data.List || {};
    const items = Object.keys(list).map((k) => ({ db: k, info: list[k]?.InfoLeak, data: list[k]?.Data }));
    
    if (!Object.keys(list).length) {
      console.log('✅ LeakOsint: No List property or empty List');
      return { name: 'LeakOsint', ok: true, found: false, count: 0, data: [], items: [] };
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
      console.log('✅ LeakOsint: All items filtered out as empty/no results');
      return { name: 'LeakOsint', ok: true, found: false, count: 0, data: [], items: [] };
    }
    
    const normalizedItems = LeakOsintNormalizer.normalizeRecords(validItems);
    
    console.log(`📊 LeakOsint: Found ${normalizedItems.length} valid records after filtering ${items.length - validItems.length} empty items`);
    
    return { 
      name: 'LeakOsint', 
      ok: true, 
      found: normalizedItems.length > 0,
      count: normalizedItems.length,
      data: normalizedItems,
      items: normalizedItems
    };
  } catch (err: any) {
    return { name: 'LeakOsint', ok: false, found: false, count: 0, error: err.message };
  }
}

async function searchUsersbox(query: string) {
  try {
    const res = await axios.get(
      USERSBOX_BASE + '/search',
      {
        params: { q: query },
        headers: { Authorization: TOKENS.USERSBOX },
        timeout: 15000
      }
    );
    
    const data = res.data || {};
    const normalizedData = UsersboxNormalizer.normalizeUsersboxData(data);
    
    return { 
      name: 'Usersbox', 
      ok: data.status === 'success', 
      found: normalizedData.length > 0,
      count: normalizedData.length,
      data: normalizedData,
      items: normalizedData
    };
  } catch (err: any) {
    return { name: 'Usersbox', ok: false, found: false, count: 0, error: err.message };
  }
}

async function searchVektor(query: string) {
  try {
    const url = `${VEKTOR_BASE}/api/${encodeURIComponent(TOKENS.VEKTOR)}/search/${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 15000 });
    const data = res.data || {};
    
    if (data && data.error) {
      return { name: 'Vektor', ok: false, found: false, count: 0, error: data.error };
    }
    
    if (!data || !data.result) {
      return { name: 'Vektor', ok: false, found: false, count: 0, error: { message: 'Пустой ответ или нет поля result' } };
    }
    
    const items = Array.isArray(data.result) ? data.result : [data.result];
    
    return { 
      name: 'Vektor', 
      ok: true, 
      found: items.length > 0,
      count: items.length,
      data: items,
      items: items
    };
  } catch (err: any) {
    return { name: 'Vektor', ok: false, found: false, count: 0, error: err.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Phone number is required'
          }
        },
        { status: 400 }
      );
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    console.log(`🔍 Starting comprehensive phone search for: ${normalizedPhone}`);
    
    // Search all sources in parallel
    const searchPromises = [
      searchITP(normalizedPhone, 'phone'),
      searchDyxless(normalizedPhone, 'standart'), // Use 'standart' type for phone searches (2₽)
      searchLeakOsint(normalizedPhone),
      searchUsersbox(normalizedPhone),
      searchVektor(normalizedPhone)
    ];
    
    const results = await Promise.allSettled(searchPromises);
    
    // Process results
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const sourceNames = ['ITP', 'Dyxless', 'LeakOsint', 'Usersbox', 'Vektor'];
        return {
          name: sourceNames[index],
          ok: false,
          found: false,
          count: 0,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // Calculate total leaks found
    const totalLeaks = processedResults.reduce((sum, result) => sum + (result.count || 0), 0);
    const foundSources = processedResults.filter(result => result.found).length;

    console.log(`✅ Phone search completed: ${totalLeaks} total leaks from ${foundSources} sources`);

    // Подробное логирование структуры ответа для отладки фронтенда
    const responseData = {
      ok: true,
      found: totalLeaks > 0,  // Добавляем поле found для совместимости с фронтендом
      phone: normalizedPhone,
      totalLeaks,
      foundSources,
      results: processedResults,
      message: totalLeaks > 0 
        ? `Найдено ${totalLeaks} утечек по номеру телефона в ${foundSources} источниках`
        : 'Утечек по данному номеру телефона не найдено',
      timestamp: new Date().toISOString()
    };

    console.log('📤 Final API Response Structure:', {
      ok: responseData.ok,
      found: responseData.found,
      totalLeaks: responseData.totalLeaks,
      foundSources: responseData.foundSources,
      resultsCount: responseData.results.length,
      resultsSample: responseData.results.map(r => ({
        name: r.name,
        found: r.found,
        count: r.count,
        hasItems: !!(r.items && r.items.length > 0),
        itemsCount: r.items ? r.items.length : 0
      }))
    });

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Check phone endpoint error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    );
  }
}