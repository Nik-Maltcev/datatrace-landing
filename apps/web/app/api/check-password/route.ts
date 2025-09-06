import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import crypto from 'crypto'
import { saveCheckHistory } from '../../../lib/checkHistory'

const DEHASHED_API_KEY = process.env.DEHASHED_API_KEY || 'your_dehashed_api_key'
const DEHASHED_BASE = 'https://api.dehashed.com'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password check request received')

    const body = await request.json()
    const { password, userEmail } = body

    if (!password) {
      return NextResponse.json({
        ok: false,
        error: { message: 'Пароль не указан' }
      }, { status: 400 })
    }

    if (!DEHASHED_API_KEY || DEHASHED_API_KEY === 'your_dehashed_api_key') {
      return NextResponse.json({
        ok: false,
        error: { message: 'DeHashed API key не настроен' }
      }, { status: 500 })
    }

    console.log(`🔍 Checking password hash...`)

    // Хешируем пароль в SHA-256 для DeHashed v2 API
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    console.log(`🔐 Password SHA256 hash: ${passwordHash.slice(0, 10)}...`)

    try {
      // Используем DeHashed v2 API для проверки паролей
      const response = await axios.post(`${DEHASHED_BASE}/v2/search-password`, {
        sha256_hashed_password: passwordHash
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Dehashed-Api-Key': DEHASHED_API_KEY
        },
        timeout: 15000
      })

      const data = response.data || {}
      console.log(`📊 DeHashed response:`, {
        results_found: data.results_found || 0
      })

      const isCompromised = (data.results_found || 0) > 0
      const breachCount = data.results_found || 0

      let detailedResults = []
      let uniqueDatabases = new Set()

      // Если найдены результаты, получаем детальную информацию
      if (isCompromised) {
        try {
          const searchResponse = await axios.post(`${DEHASHED_BASE}/v2/search`, {
            query: `password:${password}`,
            page: 1,
            size: 100,
            de_dupe: true
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Dehashed-Api-Key': DEHASHED_API_KEY
            },
            timeout: 15000
          })

          detailedResults = searchResponse.data.entries || []
          
          // Собираем уникальные базы данных
          detailedResults.forEach(entry => {
            if (entry.database_name) {
              uniqueDatabases.add(entry.database_name)
            }
          })
        } catch (searchError) {
          console.log('⚠️ Could not get detailed results:', searchError.message)
        }
      }

      // Сохраняем результат в историю
      if (userEmail) {
        console.log('💾 Saving password check history...')
        console.log('📊 Detailed results count:', detailedResults.length)
        console.log('🗄️ Unique databases:', Array.from(uniqueDatabases))
        
        const historyData = {
          type: 'password',
          query: '***скрыто***',
          timestamp: new Date().toISOString(),
          results: {
            DeHashed: {
              found: isCompromised,
              count: breachCount,
              databases: Array.from(uniqueDatabases),
              entries: detailedResults.map(entry => {
                console.log('📝 Processing entry:', {
                  database_name: entry.database_name,
                  email: entry.email,
                  username: entry.username,
                  hasPassword: !!entry.password
                })
                return {
                  ...entry,
                  password: ['***скрыто***']
                }
              })
            }
          }
        }

        console.log('💾 Final history data structure:', JSON.stringify(historyData, null, 2))

        try {
          await saveCheckHistory(userEmail, historyData)
          console.log('✅ Password check history saved successfully')
        } catch (historyError) {
          console.error('❌ Failed to save history:', historyError)
        }
      }

      // Генерируем рекомендации
      const recommendations = []
      if (isCompromised) {
        recommendations.push('🚨 КРИТИЧНО: Этот пароль найден в утечках данных!')
        recommendations.push('Немедленно смените пароль на всех аккаунтах где он используется')
        if (breachCount > 1) {
          recommendations.push(`Пароль найден в ${breachCount} различных утечках`)
        }
        if (uniqueDatabases.size > 0) {
          recommendations.push(`Найден в ${uniqueDatabases.size} различных базах данных`)
        }
        recommendations.push('Включите двухфакторную аутентификацию на важных аккаунтах')
      } else {
        recommendations.push('✅ Пароль не найден в известных утечках данных')
        recommendations.push('Продолжайте использовать уникальные пароли для каждого сервиса')
      }
      recommendations.push('Рекомендуется использовать менеджер паролей')

      const message = isCompromised 
        ? `Пароль скомпрометирован! Найдено ${breachCount} записей в ${uniqueDatabases.size || 1} базах данных`
        : 'Пароль не найден в известных утечках'

      return NextResponse.json({
        ok: true,
        isCompromised,
        breachCount,
        databaseCount: uniqueDatabases.size,
        databases: Array.from(uniqueDatabases),
        recommendations,
        message,
        timestamp: new Date().toISOString()
      })

    } catch (apiError: any) {
      console.error('❌ DeHashed API error:', apiError)
      
      if (apiError.response?.status === 401) {
        return NextResponse.json({
          ok: false,
          error: { message: 'Ошибка авторизации DeHashed API. Проверьте API ключ.' }
        }, { status: 401 })
      }

      if (apiError.response?.status === 429) {
        return NextResponse.json({
          ok: false,
          error: { message: 'Превышен лимит запросов DeHashed API' }
        }, { status: 429 })
      }

      if (apiError.response?.status === 403) {
        return NextResponse.json({
          ok: false,
          error: { message: 'Доступ к DeHashed API запрещен. Проверьте подписку.' }
        }, { status: 403 })
      }

      return NextResponse.json({
        ok: false,
        error: { message: `Ошибка DeHashed API: ${apiError.message}` }
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