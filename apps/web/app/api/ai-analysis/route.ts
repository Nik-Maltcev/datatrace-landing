import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

export async function POST(request: NextRequest) {
  try {
    const { checks } = await request.json()

    if (!checks || !Array.isArray(checks)) {
      return NextResponse.json({ error: 'Invalid checks data' }, { status: 400 })
    }

    // Подготавливаем данные для анализа
    const analysisData = prepareAnalysisData(checks)

    // Если есть DeepSeek API, используем его для более детального анализа
    if (DEEPSEEK_API_KEY) {
      try {
        const aiAnalysis = await generateDeepSeekAnalysis(analysisData)
        return NextResponse.json(aiAnalysis)
      } catch (error) {
        console.error('DeepSeek analysis failed, using fallback:', error)
      }
    }

    // Fallback анализ
    const fallbackAnalysis = generateFallbackAnalysis(analysisData)
    return NextResponse.json(fallbackAnalysis)

  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

function prepareAnalysisData(checks: any[]) {
  const totalLeaks = checks.reduce((sum, check) => 
    sum + check.results.reduce((s: number, r: any) => s + (r.count || 0), 0), 0
  )
  
  const compromisedSources = Array.from(new Set(
    checks.flatMap(check => 
      check.results.filter((r: any) => r.found).map((r: any) => r.source || r.name)
    )
  ))

  const sourceBreakdown = compromisedSources.map((source, idx) => ({
    name: source,
    value: checks.reduce((sum, check) => {
      const sourceResult = check.results.find((r: any) => (r.source || r.name) === source)
      return sum + (sourceResult?.count || 0)
    }, 0),
    color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'][idx % 6]
  }))

  const trends = generateTrendData(checks)
  
  // Детальный анализ утечек для рекомендаций
  const detailedLeaks = analyzeLeakDetails(checks)

  return {
    totalLeaks,
    compromisedSources,
    sourceBreakdown,
    trends,
    checksCount: checks.length,
    recentChecks: checks.slice(-5),
    detailedLeaks
  }
}

function analyzeLeakDetails(checks: any[]) {
  const leakDetails = {
    emailsFound: new Set(),
    phonesFound: new Set(),
    passwordsFound: new Set(),
    sitesWithPasswords: new Set(),
    socialNetworks: new Set(),
    financialServices: new Set(),
    governmentServices: new Set()
  }

  checks.forEach(check => {
    check.results.forEach((result: any) => {
      if (result.found && (result.items || result.data)) {
        const sourceName = result.source || result.name
        
        // Анализируем содержимое утечек
        const items = Array.isArray(result.items) ? result.items : 
                     result.data ? Object.values(result.data).flat() : []
        
        items.forEach((item: any) => {
          if (item.email) leakDetails.emailsFound.add(item.email)
          if (item.phone) leakDetails.phonesFound.add(item.phone)
          if (item.password) {
            leakDetails.passwordsFound.add(item.password)
            leakDetails.sitesWithPasswords.add(sourceName)
          }
          
          // Категоризация по типам сервисов
          if (sourceName.toLowerCase().includes('vk') || 
              sourceName.toLowerCase().includes('facebook') ||
              sourceName.toLowerCase().includes('instagram') ||
              sourceName.toLowerCase().includes('twitter')) {
            leakDetails.socialNetworks.add(sourceName)
          }
          
          if (sourceName.toLowerCase().includes('bank') ||
              sourceName.toLowerCase().includes('pay') ||
              sourceName.toLowerCase().includes('wallet')) {
            leakDetails.financialServices.add(sourceName)
          }
          
          if (sourceName.toLowerCase().includes('gov') ||
              sourceName.toLowerCase().includes('госуслуги') ||
              sourceName.toLowerCase().includes('налог')) {
            leakDetails.governmentServices.add(sourceName)
          }
        })
      }
    })
  })

  return {
    emailsFound: Array.from(leakDetails.emailsFound),
    phonesFound: Array.from(leakDetails.phonesFound),
    passwordsFound: Array.from(leakDetails.passwordsFound),
    sitesWithPasswords: Array.from(leakDetails.sitesWithPasswords),
    socialNetworks: Array.from(leakDetails.socialNetworks),
    financialServices: Array.from(leakDetails.financialServices),
    governmentServices: Array.from(leakDetails.governmentServices)
  }
}

function generateTrendData(checks: any[]) {
  const monthlyData: { [key: string]: number } = {}
  
  checks.forEach(check => {
    const month = new Date(check.date).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' })
    const leaks = check.results.reduce((sum: number, r: any) => sum + (r.count || 0), 0)
    monthlyData[month] = (monthlyData[month] || 0) + leaks
  })

  return Object.entries(monthlyData).map(([month, leaks]) => ({ month, leaks }))
}

async function generateDeepSeekAnalysis(data: any) {
  const prompt = `Проанализируй данные о кибербезопасности пользователя и создай детальный отчет в JSON формате:

Данные для анализа:
- Всего утечек: ${data.totalLeaks}
- Скомпрометированных источников: ${data.compromisedSources.length}
- Количество проверок: ${data.checksCount}
- Источники: ${data.compromisedSources.join(', ')}
- Найденные email: ${data.detailedLeaks.emailsFound.length}
- Найденные телефоны: ${data.detailedLeaks.phonesFound.length}
- Скомпрометированные пароли: ${data.detailedLeaks.passwordsFound.length}
- Сайты с паролями: ${data.detailedLeaks.sitesWithPasswords.join(', ')}
- Соцсети: ${data.detailedLeaks.socialNetworks.join(', ')}
- Финансовые сервисы: ${data.detailedLeaks.financialServices.join(', ')}
- Госуслуги: ${data.detailedLeaks.governmentServices.join(', ')}

Верни ТОЛЬКО валидный JSON в следующем формате:
{
  "riskLevel": "low|medium|high",
  "totalLeaks": ${data.totalLeaks},
  "compromisedSources": ${JSON.stringify(data.compromisedSources)},
  "recommendations": ["конкретная рекомендация с указанием где менять пароли"],
  "trends": ${JSON.stringify(data.trends)},
  "sourceBreakdown": ${JSON.stringify(data.sourceBreakdown)},
  "analysis": "Подробный анализ с указанием конкретных угроз и действий",
  "lastUpdated": "${new Date().toISOString()}",
  "priorityActions": ["приоритетные действия с конкретными сервисами"]
}

Требования:
- Укажи КОНКРЕТНО где нужно сменить пароли (соцсети, банки, госуслуги)
- Приоритизируй действия по критичности сервисов
- Дай специфические рекомендации для каждого типа утечек
- Используй профессиональную терминологию кибербезопасности`

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Ты эксперт по кибербезопасности. Анализируй данные об утечках и давай профессиональные рекомендации. Отвечай ТОЛЬКО валидным JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content from DeepSeek')
  }

  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to parse DeepSeek JSON:', error)
    throw error
  }
}

function generateFallbackAnalysis(data: any) {
  const riskLevel = data.totalLeaks > 50 ? 'high' : data.totalLeaks > 10 ? 'medium' : 'low'
  
  const recommendations = []
  const priorityActions = []
  
  // Конкретные рекомендации на основе найденных утечек
  if (data.detailedLeaks.financialServices.length > 0) {
    recommendations.push(`🏦 КРИТИЧНО: Немедленно смените пароли в банковских сервисах: ${data.detailedLeaks.financialServices.join(', ')}`)
    priorityActions.push('Смена паролей в банках и платежных системах')
  }
  
  if (data.detailedLeaks.governmentServices.length > 0) {
    recommendations.push(`🏛️ ВАЖНО: Смените пароль на Госуслугах и других государственных сервисах: ${data.detailedLeaks.governmentServices.join(', ')}`)
    priorityActions.push('Смена пароля на Госуслугах')
  }
  
  if (data.detailedLeaks.socialNetworks.length > 0) {
    recommendations.push(`📱 Смените пароли в социальных сетях: ${data.detailedLeaks.socialNetworks.join(', ')}`)
    priorityActions.push('Смена паролей в соцсетях')
  }
  
  if (data.detailedLeaks.sitesWithPasswords.length > 0) {
    recommendations.push(`🔐 Найдены скомпрометированные пароли от сайтов: ${data.detailedLeaks.sitesWithPasswords.join(', ')}. Смените их немедленно!`)
  }
  
  if (data.detailedLeaks.emailsFound.length > 0) {
    recommendations.push(`📧 Скомпрометированы email адреса: ${data.detailedLeaks.emailsFound.slice(0, 3).join(', ')}${data.detailedLeaks.emailsFound.length > 3 ? '...' : ''}. Включите 2FA везде где возможно`)
  }
  
  if (data.detailedLeaks.phonesFound.length > 0) {
    recommendations.push(`📞 Скомпрометированы номера телефонов. Рассмотрите смену номера если утечек много`)
  }
  
  if (data.totalLeaks > 0) {
    recommendations.push('🛡️ Включите двухфакторную аутентификацию везде, где это возможно')
    recommendations.push('🔍 Используйте менеджер паролей для создания уникальных паролей')
  }
  
  if (data.totalLeaks > 50) {
    recommendations.push('⚠️ Обратитесь к специалисту по кибербезопасности')
    recommendations.push('🌐 Рассмотрите использование VPN для защиты трафика')
    priorityActions.push('Консультация со специалистом по кибербезопасности')
  }
  
  recommendations.push('📊 Регулярно мониторьте свои данные на предмет новых утечек')

  const analysis = data.totalLeaks === 0 
    ? 'Отличные новости! Ваши данные не найдены в известных утечках. Продолжайте следовать рекомендациям по кибербезопасности.'
    : `Обнаружено ${data.totalLeaks} записей в ${data.compromisedSources.length} источниках. ${data.detailedLeaks.financialServices.length > 0 ? 'КРИТИЧНО: найдены утечки финансовых данных! ' : ''}${data.detailedLeaks.passwordsFound.length > 0 ? `Скомпрометировано ${data.detailedLeaks.passwordsFound.length} паролей. ` : ''}Требуются немедленные действия по защите.`

  return {
    riskLevel,
    totalLeaks: data.totalLeaks,
    compromisedSources: data.compromisedSources,
    recommendations,
    trends: data.trends,
    sourceBreakdown: data.sourceBreakdown,
    analysis,
    priorityActions,
    lastUpdated: new Date().toISOString()
  }
}