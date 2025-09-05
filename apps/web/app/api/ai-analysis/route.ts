import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI Analysis request received')
    
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({
        ok: false,
        error: 'DeepSeek API key not configured'
      }, { status: 500 })
    }

    const body = await request.json()
    const { checkHistory } = body

    if (!checkHistory || !Array.isArray(checkHistory)) {
      return NextResponse.json({
        ok: false,
        error: 'Check history is required'
      }, { status: 400 })
    }

    console.log(`📊 Analyzing ${checkHistory.length} checks`)

    // Подготавливаем данные для анализа
    const analysisData = prepareAnalysisData(checkHistory)
    
    // Создаем промпт для DeepSeek
    const prompt = buildAnalysisPrompt(analysisData)
    
    console.log('🔍 Sending request to DeepSeek...')
    
    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt()
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const aiAnalysis = data.choices?.[0]?.message?.content

    if (!aiAnalysis) {
      throw new Error('Empty response from DeepSeek')
    }

    console.log('✅ AI Analysis completed')

    return NextResponse.json({
      ok: true,
      analysis: aiAnalysis,
      model: 'deepseek-chat',
      timestamp: new Date().toISOString(),
      usage: data.usage
    })

  } catch (error) {
    console.error('❌ AI Analysis error:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'AI Analysis failed'
    }, { status: 500 })
  }
}

function prepareAnalysisData(checkHistory: any[]) {
  return checkHistory.map(check => ({
    type: check.type,
    query: check.query,
    date: check.date,
    totalLeaks: check.totalLeaks,
    foundSources: check.foundSources,
    sources: check.results?.map((result: any) => ({
      name: result.source,
      found: result.found,
      count: result.count,
      hasData: !!result.items
    })) || []
  }))
}

function buildAnalysisPrompt(analysisData: any[]) {
  let prompt = `Проанализируй историю проверок утечек данных пользователя:\n\n`
  
  analysisData.forEach((check, index) => {
    prompt += `=== Проверка ${index + 1} ===\n`
    prompt += `Тип: ${check.type === 'phone' ? 'Телефон' : 'Email'}\n`
    prompt += `Запрос: ${check.query}\n`
    prompt += `Дата: ${new Date(check.date).toLocaleDateString('ru-RU')}\n`
    prompt += `Найдено утечек: ${check.totalLeaks}\n`
    prompt += `Источников с данными: ${check.foundSources}\n`
    
    if (check.sources.length > 0) {
      prompt += `Источники:\n`
      check.sources.forEach((source: any) => {
        prompt += `- ${source.name}: ${source.found ? `${source.count} записей` : 'чисто'}\n`
      })
    }
    prompt += `\n`
  })

  prompt += `\nСоздай подробный анализ безопасности в формате markdown с разделами:

## 🔍 Общий анализ безопасности
- Общая оценка уровня компрометации данных
- Количество найденных утечек по типам данных

## 📊 Статистика по источникам  
- Какие источники чаще всего содержат утечки
- Самые проблемные базы данных

## ⚠️ Выявленные риски
- Конкретные риски на основе найденных данных
- Уровень критичности (🔴 Критический, 🟠 Высокий, 🟡 Средний)

## 🛡️ Рекомендации по защите
- Немедленные действия (первые 24 часа)
- Долгосрочная стратегия защиты
- Конкретные шаги для повышения безопасности

## 📈 Мониторинг и контроль
- Рекомендации по регулярным проверкам
- Настройка уведомлений о новых утечках

Используй эмодзи и структурированный markdown для лучшей читаемости.`

  return prompt
}

function getSystemPrompt() {
  return `Ты - эксперт по кибербезопасности и анализу утечек данных. Твоя специализация - создание персональных отчетов по безопасности на основе истории проверок утечек.

Требования к ответу:
- Используй только русский язык
- Отвечай в формате markdown с эмодзи
- Давай конкретные, практические рекомендации
- Оценивай реальные риски на основе данных
- Будь профессиональным, но понятным для обычного пользователя
- Структурируй ответ по указанным разделам`
}