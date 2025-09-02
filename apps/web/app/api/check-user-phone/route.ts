import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

// Импортируем функции поиска из API
const searchITP = require('../../../../api/src/services/itp')
const searchDyxless = require('../../../../api/src/services/dyxless')
const searchLeakOsint = require('../../../../api/src/services/leakosint')
const searchUsersbox = require('../../../../api/src/services/usersbox')
const searchVektor = require('../../../../api/src/services/vektor')

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

    // Используем существующую логику поиска
    const steps = []
    const finalQuery = phone.replace(/[\s\-\(\)]/g, '') // Нормализуем номер
    
    for (const [idx, fn] of [searchITP, searchDyxless, searchLeakOsint, searchUsersbox, searchVektor].entries()) {
      const result = idx === 0 ? await fn(finalQuery, 'phone') : await fn(finalQuery)
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

    // TODO: Сохранить результат проверки в базу данных

    return NextResponse.json({
      ok: true,
      phone: finalQuery,
      totalLeaks,
      foundSources,
      results: steps,
      message: totalLeaks > 0 
        ? `Найдено ${totalLeaks} утечек по номеру телефона в ${foundSources} источниках`
        : 'Утечек по данному номеру телефона не найдено',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('User phone check error:', error)
    return NextResponse.json({
      ok: false,
      error: { message: 'Внутренняя ошибка сервера' }
    }, { status: 500 })
  }
}
