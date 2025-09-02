import { NextRequest, NextResponse } from 'next/server'
import { getCheckHistory, saveCheckResult } from '@/lib/checkHistory'

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received save check result request')
    const body = await request.json()
    console.log('📋 Request body:', JSON.stringify(body, null, 2))

    const { type, query, results, totalLeaks, foundSources, message, userId } = body

    const checkRecord = saveCheckResult({
      type,
      query,
      results,
      totalLeaks,
      foundSources,
      message,
      userId: userId || 'current-user'
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
    const userId = searchParams.get('userId') || 'current-user'

    const checks = getCheckHistory(userId)

    return NextResponse.json({
      ok: true,
      checks: checks
    })

  } catch (error) {
    console.error('Get check history error:', error)
    return NextResponse.json({
      ok: false,
      error: { message: 'Ошибка при получении истории проверок' }
    }, { status: 500 })
  }
}
