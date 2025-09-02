import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import axios from 'axios'

// Токены и базовые URL (копируем из основного API)
const TOKENS = {
  ITP: process.env.ITP_TOKEN || '91b2c57abce2ca84f8ca068df2eda054',
  DYXLESS: process.env.DYXLESS_TOKEN || '38a634df-2317-4c8c-beb7-7ca4fd97f1e1',
  LEAKOSINT: process.env.LEAKOSINT_TOKEN || '466496291:r571DgY3',
  USERSBOX: process.env.USERSBOX_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkX2F0IjoxNzUyNTg0NTk5LCJhcHBfaWQiOjE3NTI1ODQ1OTl9.FqMGisO5V1xW2Xr8Ri5mQryy5I1sdBBWzuckCEPpK58',
  VEKTOR: process.env.VEKTOR_TOKEN || 'C45vAVuDkzNax2BF4sz8o4KEAZFBIIK'
}

const ITP_BASE = process.env.ITP_BASE || 'https://datatech.work'
const DYXLESS_BASE = process.env.DYXLESS_BASE || 'https://api-dyxless.cfd'
const LEAKOSINT_BASE = 'https://leakosintapi.com/'
const USERSBOX_BASE = 'https://api.usersbox.ru/v1'
const VEKTOR_BASE = 'https://infosearch54321.xyz'

// Функции поиска (копируем из основного API)
async function searchITP(query: string, field: string) {
  try {
    const itpTypeMap: { [key: string]: string } = {
      phone: 'phone',
      email: 'email',
      inn: 'inn',
      snils: 'snils',
      vk: 'username',
      ok: 'username'
    }
    const itpType = itpTypeMap[field] || 'full_text'
    const res = await axios.post(
      ITP_BASE + '/public-api/data/search',
      {
        searchOptions: [
          { type: itpType, query: query }
        ]
      },
      { headers: { 'x-api-key': TOKENS.ITP } }
    )
    const data = res.data || {}
    
    return { 
      name: 'ITP', 
      ok: true, 
      meta: { 
        records: data.records, 
        searchId: data.searchId,
        originalCount: data.data?.length || 0
      }, 
      items: data.data || []
    }
  } catch (err: any) {
    return { name: 'ITP', ok: false, error: normalizeError(err) }
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
    )
    const data = res.data || {}
    return { name: 'Dyxless', ok: !!data.status, meta: { count: data.counts }, items: data.data }
  }

  try {
    return await attempt()
  } catch (e1) {
    await new Promise((r) => setTimeout(r, 600))
    try {
      return await attempt()
    } catch (e2) {
      return { name: 'Dyxless', ok: false, error: normalizeError(e2) }
    }
  }
}

async function searchLeakOsint(query: string) {
  try {
    const res = await axios.post(
      LEAKOSINT_BASE,
      { token: TOKENS.LEAKOSINT, request: query, limit: 100, lang: 'ru', type: 'json' },
      { headers: { 'Content-Type': 'application/json' } }
    )
    const data = res.data || {}
    
    if (data && (data['Error code'] || data.Error || data.error)) {
      return { name: 'LeakOsint', ok: false, error: data }
    }
    
    const list = data.List || {}
    const items = Object.keys(list).map((k) => ({ db: k, info: list[k]?.InfoLeak, data: list[k]?.Data }))
    if (!Object.keys(list).length) {
      return { name: 'LeakOsint', ok: false, error: { message: 'Нет данных или неизвестный формат ответа', preview: data } }
    }
    
    return { name: 'LeakOsint', ok: true, items: items }
  } catch (err: any) {
    return { name: 'LeakOsint', ok: false, error: normalizeError(err) }
  }
}

async function searchUsersbox(query: string) {
  try {
    const res = await axios.get(
      USERSBOX_BASE + '/search',
      {
        params: { q: query },
        headers: { Authorization: TOKENS.USERSBOX }
      }
    )
    const data = res.data || {}
    
    return { 
      name: 'Usersbox', 
      ok: data.status === 'success', 
      items: data.data || [], 
      meta: { count: data.data?.count } 
    }
  } catch (err: any) {
    return { name: 'Usersbox', ok: false, error: normalizeError(err) }
  }
}

async function searchVektor(query: string) {
  try {
    const url = `${VEKTOR_BASE}/api/${encodeURIComponent(TOKENS.VEKTOR)}/search/${encodeURIComponent(query)}`
    const res = await axios.get(url)
    const data = res.data || {}
    if (data && data.error) {
      return { name: 'Vektor', ok: false, error: data.error }
    }
    if (!data || !data.result) {
      return { name: 'Vektor', ok: false, error: { message: 'Пустой ответ или нет поля result', preview: data } }
    }
    return { name: 'Vektor', ok: true, items: data.result }
  } catch (err: any) {
    return { name: 'Vektor', ok: false, error: normalizeError(err) }
  }
}

function normalizeError(err: any) {
  if (err.response) {
    const status = err.response.status
    const statusText = err.response.statusText
    const data = err.response.data
    const isString = typeof data === 'string'
    return {
      status,
      statusText,
      preview: isString ? String(data).slice(0, 600) : undefined,
      data: !isString ? data : undefined,
    }
  }
  if (err.request) {
    return { message: 'No response from server', code: err.code }
  }
  return { message: err.message || 'Unknown error' }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 User email check request received')

    // Получаем тело запроса
    const body = await request.json()
    const email = body.email

    if (!email) {
      return NextResponse.json({
        ok: false,
        error: { message: 'Email не указан' }
      }, { status: 400 })
    }

    console.log(`📧 Checking email: ${email}`)

    // Выполняем поиск по всем источникам
    const steps = []
    
    for (const [idx, fn] of [searchITP, searchDyxless, searchLeakOsint, searchUsersbox, searchVektor].entries()) {
      const result = idx === 0 ? await fn(email, 'email') : await fn(email)
      steps.push(result)
    }

    // Подсчитываем общее количество найденных утечек
    const totalLeaks = steps.reduce((sum, step) => {
      if (!step.ok || !step.items) return sum
      
      if (step.name === 'ITP' && typeof step.items === 'object') {
        return sum + Object.values(step.items).reduce((itemSum: number, items: any) => {
          return itemSum + (Array.isArray(items) ? items.length : 0)
        }, 0)
      } else if (Array.isArray(step.items)) {
        return sum + step.items.length
      }
      return sum
    }, 0)

    const foundSources = steps.filter(step => step.ok && step.items && 
      (Array.isArray(step.items) ? step.items.length > 0 : Object.keys(step.items).length > 0)
    ).length

    return NextResponse.json({
      ok: true,
      email: email,
      totalLeaks,
      foundSources,
      results: steps,
      message: totalLeaks > 0 
        ? `Найдено ${totalLeaks} утечек по email адресу в ${foundSources} источниках`
        : 'Утечек по данному email адресу не найдено',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('User email check error:', error)
    return NextResponse.json({
      ok: false,
      error: { message: 'Внутренняя ошибка сервера' }
    }, { status: 500 })
  }
}
