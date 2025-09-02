import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 User phone check request received')
    
    // Получаем токен из заголовков
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        ok: false,
        error: { message: 'Токен авторизации не найден' }
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Проверяем токен
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return NextResponse.json({
        ok: false,
        error: { message: 'Недействительный токен' }
      }, { status: 401 })
    }

    // Получаем профиль пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.phone) {
      return NextResponse.json({
        ok: false,
        error: { message: 'Номер телефона не указан в профиле пользователя' }
      }, { status: 400 })
    }

    const phone = user.phone
    console.log(`📱 Checking phone: ${phone} for user: ${user.id}`)

    // Делаем запрос к внешнему API (Railway)
    const apiUrl = process.env.INTERNAL_API_URL || 'https://datatrace-landing-production.up.railway.app'

    try {
      const response = await fetch(`${apiUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: phone,
          field: 'phone'
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      // Подсчитываем общее количество найденных утечек
      const totalLeaks = data.results?.reduce((sum: number, step: any) => {
        if (!step.ok || !step.items) return sum

        if (step.name === 'ITP' && typeof step.items === 'object') {
          return sum + Object.values(step.items).reduce((itemSum: number, items: any) => {
            return itemSum + (Array.isArray(items) ? items.length : 0)
          }, 0)
        } else if (Array.isArray(step.items)) {
          return sum + step.items.length
        }
        return sum
      }, 0) || 0

      const foundSources = data.results?.filter((step: any) => step.ok && step.items &&
        (Array.isArray(step.items) ? step.items.length > 0 : Object.keys(step.items).length > 0)
      ).length || 0

      return NextResponse.json({
        ok: true,
        phone: phone,
        totalLeaks,
        foundSources,
        results: data.results || [],
        message: totalLeaks > 0
          ? `Найдено ${totalLeaks} утечек по номеру телефона в ${foundSources} источниках`
          : 'Утечек по данному номеру телефона не найдено',
        timestamp: new Date().toISOString()
      })
    } catch (apiError) {
      console.error('Internal API call failed:', apiError)
      return NextResponse.json({
        ok: false,
        error: { message: 'Ошибка при выполнении поиска' }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('User phone check error:', error)
    return NextResponse.json({
      ok: false,
      error: { message: 'Внутренняя ошибка сервера' }
    }, { status: 500 })
  }
}
