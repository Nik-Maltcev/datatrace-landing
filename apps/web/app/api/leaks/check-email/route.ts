import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Import normalizers
const ITPNormalizer = require('@/lib/utils/ITPNormalizer');
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

async function searchITP(query: string, field: string) {
  try {
    const res = await axios.post(
      ITP_BASE + '/public-api/data/search',
      {
        searchOptions: [
          { type: field, query: query }
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
      items: data.data
    };
  } catch (err: any) {
    return { name: 'ITP', ok: false, found: false, count: 0, error: err.message };
  }
}

async function searchDyxless(query: string) {
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
    
    const ct = res.headers && res.headers['content-type'];
    if (ct && ct.includes('text/html') && typeof res.data === 'string') {
      throw { response: { status: res.status || 521, data: 'Cloudflare HTML error page' } };
    }
    
    const data = res.data || {};
    const items = data.data || [];
    
    return { 
      name: 'Dyxless', 
      ok: !!data.status, 
      found: items.length > 0,
      count: items.length,
      data: items,
      items: items
    };
  };

  try {
    return await attempt();
  } catch (e1) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      return await attempt();
    } catch (e2: any) {
      return { name: 'Dyxless', ok: false, found: false, count: 0, error: e2.message };
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
    
    if (data && (data['Error code'] || data.Error || data.error)) {
      return { name: 'LeakOsint', ok: false, found: false, count: 0, error: data };
    }
    
    const list = data.List || {};
    const items = Object.keys(list).map((k) => ({ db: k, info: list[k]?.InfoLeak, data: list[k]?.Data }));
    
    if (!Object.keys(list).length) {
      return { name: 'LeakOsint', ok: false, found: false, count: 0, error: { message: 'Нет данных или неизвестный формат ответа' } };
    }
    
    const normalizedItems = LeakOsintNormalizer.normalizeRecords(items);
    
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required'
          }
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format'
          }
        },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Starting comprehensive email search for: ${email}`);
    
    // Search all sources in parallel
    const searchPromises = [
      searchITP(email, 'email'),
      searchDyxless(email),
      searchLeakOsint(email),
      searchUsersbox(email),
      searchVektor(email)
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

    console.log(`✅ Email search completed: ${totalLeaks} total leaks from ${foundSources} sources`);

    return NextResponse.json({
      ok: true,
      email: email,
      totalLeaks,
      foundSources,
      results: processedResults,
      message: totalLeaks > 0 
        ? `Найдено ${totalLeaks} утечек по email адресу в ${foundSources} источниках`
        : 'Утечек по данному email адресу не найдено',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Check email endpoint error:', error);
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