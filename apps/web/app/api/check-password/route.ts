import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import crypto from 'crypto'

const DEHASHED_API_KEY = process.env.DEHASHED_API_KEY || 'your_dehashed_api_key'
const DEHASHED_BASE = 'https://api.dehashed.com/search'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password check request received')

    const body = await request.json()
    const { password, userId } = body

    if (!password) {
      return NextResponse.json({
        ok: false,
        error: { message: 'Пароль не указан' }
      }, { status: 400 })
    }

    console.log(`🔍 Checking password hash...`)

    // Хешируем пароль в SHA1 для проверки
    const passwordHash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
    console.log(`🔐 Password SHA1 hash: ${passwordHash.slice(0, 10)}...`)

    try {
      // Делаем запрос к DeHashed API
      const response = await axios.get(DEHASHED_BASE, {
        params: {
          query: `hashed_password:${passwordHash}`,
          size: 100
        },
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${DEHASHED_API_KEY}:`).toString('base64')}`
        },
        timeout: 15000
      })

      const data = response.data || {}
      console.log(`📊 DeHashed response:`, {
        balance: data.balance,
        took: data.took,
        total: data.total,
        entries: data.entries?.length || 0
      })

      const isCompromised = data.total > 0
      const breaches = data.entries || []

      // Группируем утечки по базам данных
      const breachSummary = breaches.reduce((acc: any, entry: any) => {
        const database = entry.database || 'Unknown'
        if (!acc[database]) {
          acc[database] = {
            count: 0,
            emails: new Set(),
            usernames: new Set()
          }
        }
        acc[database].count++
        if (entry.email) acc[database].emails.add(entry.email)
        if (entry.username) acc[database].usernames.add(entry.username)
        return acc
      }, {})

      // Преобразуем в массив для отображения
      const breachList = Object.entries(breachSummary).map(([database, info]: [string, any]) => ({
        database,
        count: info.count,
        emails: Array.from(info.emails),
        usernames: Array.from(info.usernames)
      }))

      const message = isCompromised 
        ? `Пароль скомпрометирован! Найдено ${data.total} записей в ${breachList.length} базах данных`
        : 'Пароль не найден в известных утечках'

      return NextResponse.json({
        ok: true,
        isCompromised,
        totalBreaches: data.total,
        breachCount: breachList.length,
        breaches: breachList,
        message,
        timestamp: new Date().toISOString()
      })

    } catch (apiError: any) {
      console.error('❌ DeHashed API error:', apiError.message)
      
      if (apiError.response?.status === 401) {
        return NextResponse.json({
          ok: false,
          error: { message: 'Ошибка авторизации DeHashed API' }
        }, { status: 401 })
      }

      if (apiError.response?.status === 429) {
        return NextResponse.json({
          ok: false,
          error: { message: 'Превышен лимит запросов DeHashed API' }
        }, { status: 429 })
      }

      return NextResponse.json({
        ok: false,
        error: { message: 'Ошибка при обращении к DeHashed API' }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Password check error:', error)
    return NextResponse.json({
      ok: false,
      error: { message: 'Внутренняя ошибка сервера' }
    }, { status: 500 })
  }
}