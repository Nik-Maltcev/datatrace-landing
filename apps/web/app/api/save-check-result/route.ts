import { NextRequest, NextResponse } from 'next/server'

// Временное хранилище в памяти (в production нужно использовать базу данных)
let checkHistory: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, query, results, totalLeaks, foundSources, message, userId } = body

    // Создаем запись о проверке
    const checkRecord = {
      id: Date.now().toString(),
      userId: userId || 'anonymous',
      type: type, // 'phone' or 'email'
      query: query,
      date: new Date().toISOString(),
      status: 'completed',
      totalLeaks: totalLeaks || 0,
      foundSources: foundSources || 0,
      message: message || '',
      results: results?.map((result: any) => ({
        source: result.name,
        found: result.ok && (
          Array.isArray(result.items) ? result.items.length > 0 : 
          (typeof result.items === 'object' && result.items !== null) ? Object.keys(result.items).length > 0 : 
          false
        ),
        count: Array.isArray(result.items) ? result.items.length : 
               (typeof result.items === 'object' && result.items !== null) ? 
               Object.values(result.items).reduce((sum: number, items: any) => sum + (Array.isArray(items) ? items.length : 0), 0) : 0,
        ok: result.ok,
        error: result.error
      })) || []
    }

    // Сохраняем в временное хранилище
    checkHistory.push(checkRecord)

    console.log(`💾 Saved check result: ${type} - ${query} - ${totalLeaks} leaks`)

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
    const userId = searchParams.get('userId') || 'anonymous'

    // Фильтруем проверки по пользователю
    const userChecks = checkHistory.filter(check => check.userId === userId)
    
    // Сортируем по дате (новые сначала)
    const sortedChecks = userChecks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log(`📋 Retrieved ${sortedChecks.length} checks for user: ${userId}`)

    return NextResponse.json({
      ok: true,
      checks: sortedChecks
    })

  } catch (error) {
    console.error('Get check history error:', error)
    return NextResponse.json({
      ok: false,
      error: { message: 'Ошибка при получении истории проверок' }
    }, { status: 500 })
  }
}
