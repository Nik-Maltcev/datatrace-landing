// Временное хранилище в памяти (в production нужно использовать базу данных)
let checkHistory: any[] = []

export interface CheckRecord {
  id: string
  userId: string
  type: 'phone' | 'email'
  query: string
  date: string
  status: 'completed' | 'failed'
  totalLeaks: number
  foundSources: number
  message: string
  results: Array<{
    source: string
    found: boolean
    count: number
    ok: boolean
    error?: any
    items?: any // Добавляем поддержку детальных данных
  }>
}

export function saveCheckResult(data: {
  type: 'phone' | 'email'
  query: string
  results: any[]
  totalLeaks: number
  foundSources: number
  message: string
  userId?: string
}): CheckRecord {
  const { type, query, results, totalLeaks, foundSources, message, userId } = data

  // Создаем запись о проверке
  const checkRecord: CheckRecord = {
    id: Date.now().toString(),
    userId: userId || 'current-user',
    type: type,
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
      error: result.error,
      items: result.items // Сохраняем нормализованные данные
    })) || []
  }

  // Сохраняем в временное хранилище
  checkHistory.push(checkRecord)
  
  console.log(`💾 Saved check result: ${type} - ${query} - ${totalLeaks} leaks`)
  console.log(`📊 Total checks in history: ${checkHistory.length}`)

  return checkRecord
}

export function saveCheckHistory(userId: string, data: any): void {
  console.log(`💾 Saving check history for user: ${userId}`)
  console.log(`📊 Data type: ${data.type}`)
  
  const checkRecord = {
    id: Date.now().toString(),
    userId: userId,
    type: data.type,
    query: data.query,
    date: data.timestamp || new Date().toISOString(),
    status: 'completed',
    totalLeaks: data.results?.DeHashed?.count || 0,
    foundSources: data.results?.DeHashed?.found ? 1 : 0,
    message: data.results?.DeHashed?.found ? 'Пароль скомпрометирован' : 'Пароль безопасен',
    results: data.results
  }
  
  checkHistory.push(checkRecord)
  console.log(`✅ Saved check history. Total records: ${checkHistory.length}`)
}

export function getCheckHistory(userId: string = 'current-user'): CheckRecord[] {
  console.log(`🔍 GET request for user: ${userId}`)
  console.log(`📊 Total checks in history: ${checkHistory.length}`)

  // Фильтруем проверки по пользователю
  const userChecks = checkHistory.filter(check => check.userId === userId)
  
  // Сортируем по дате (новые сначала)
  const sortedChecks = userChecks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  console.log(`📋 Retrieved ${sortedChecks.length} checks for user: ${userId}`)

  return sortedChecks
}
