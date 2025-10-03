import { NextRequest, NextResponse } from 'next/server'
import { saveCheckToDatabase, getUserChecks } from '@/lib/supabaseCheckHistory'

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received save check result request')
    const body = await request.json()
    console.log('📋 Request body:', JSON.stringify(body, null, 2))

    const { type, query, results, totalLeaks, foundSources, message, userId } = body

    if (!userId) {
      return NextResponse.json({
        ok: false,
        error: { message: 'userId is required' }
      }, { status: 400 })
    }

    const checkRecord = await saveCheckToDatabase({
      userId,
      type,
      query,
      results,
      totalLeaks: totalLeaks || 0,
      foundSources: foundSources || 0,
      message: message || ''
    })

    return NextResponse.json({
      ok: true,
      message: 'Результат проверки сохранен',
      checkId: checkRecord.id
    })

  } catch (error) {
    console.error('Save check result error:', error)
    return NextResponse.json({
      ok: false,
      error: { message: 'Ошибка при сохранении результата' }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        ok: false,
        error: { message: 'userId is required' }
      }, { status: 400 })
    }

    const checks = await getUserChecks(userId)

    // Преобразуем формат из БД в формат фронтенда
    const formattedChecks = checks.map(check => ({
      id: check.id,
      type: check.type,
      query: check.query,
      date: check.created_at,
      status: 'completed',
      totalLeaks: check.total_leaks,
      foundSources: check.found_sources,
      results: check.results
    }))

    return NextResponse.json({
      ok: true,
      checks: formattedChecks
    })

  } catch (error) {
    console.error('Get check history error:', error)
    return NextResponse.json({
      ok: false,
      error: { message: 'Ошибка при получении истории проверок' }
    }, { status: 500 })
  }
}
