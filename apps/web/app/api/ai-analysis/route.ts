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

  return {
    totalLeaks,
    compromisedSources,
    sourceBreakdown,
    trends,
    checksCount: checks.length,
    recentChecks: checks.slice(-5)
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

Верни ТОЛЬКО валидный JSON в следующем формате:
{
  "riskLevel": "low|medium|high",
  "totalLeaks": ${data.totalLeaks},
  "compromisedSources": ${JSON.stringify(data.compromisedSources)},
  "recommendations": ["рекомендация 1", "рекомендация 2", "рекомендация 3"],
  "trends": ${JSON.stringify(data.trends)},
  "sourceBreakdown": ${JSON.stringify(data.sourceBreakdown)},
  "analysis": "Подробный анализ ситуации с кибербезопасностью пользователя",
  "lastUpdated": "${new Date().toISOString()}"
}

Требования:
- Оцени уровень риска на основе количества утечек и источников
- Дай конкретные рекомендации по защите
- Проанализируй тренды и паттерны
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
  
  if (data.totalLeaks > 0) {
    recommendations.push('Немедленно смените пароли на всех важных аккаунтах')
    recommendations.push('Включите двухфакторную аутентификацию везде, где это возможно')
  }
  
  if (data.compromisedSources.length > 3) {
    recommendations.push('Рассмотрите возможность смены номера телефона или email')
  }
  
  if (data.totalLeaks > 50) {
    recommendations.push('Обратитесь к специалисту по кибербезопасности')
    recommendations.push('Рассмотрите использование VPN и анонимных платежных методов')
  }
  
  recommendations.push('Регулярно мониторьте свои данные на предмет новых утечек')

  const analysis = data.totalLeaks === 0 
    ? 'Отличные новости! Ваши данные не найдены в известных утечках. Продолжайте следовать рекомендациям по кибербезопасности.'
    : data.totalLeaks < 10
      ? `Найдено ${data.totalLeaks} записей в ${data.compromisedSources.length} источниках. Уровень риска низкий, но рекомендуется принять базовые меры защиты.`
      : data.totalLeaks < 50
        ? `Обнаружено ${data.totalLeaks} записей в ${data.compromisedSources.length} источниках. Средний уровень риска. Необходимо принять меры по защите данных.`
        : `Критический уровень: найдено ${data.totalLeaks} записей в ${data.compromisedSources.length} источниках. Требуются немедленные действия по защите.`

  return {
    riskLevel,
    totalLeaks: data.totalLeaks,
    compromisedSources: data.compromisedSources,
    recommendations,
    trends: data.trends,
    sourceBreakdown: data.sourceBreakdown,
    analysis,
    lastUpdated: new Date().toISOString()
  }
}