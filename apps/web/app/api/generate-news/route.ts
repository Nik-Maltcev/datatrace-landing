import { NextRequest, NextResponse } from 'next/server'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured' },
        { status: 500 }
      )
    }

    const prompt = `Найди топ 5-10 самых значимых новостей об утечках данных и кибербезопасности за последний месяц. Для каждой новости предоставь информацию в следующем JSON формате:

{
  "posts": [
    {
      "id": "уникальный-id",
      "title": "Заголовок новости",
      "summary": "Краткое описание инцидента и его последствий",
      "date": "2025-01-XX",
      "source": "Название источника",
      "sourceUrl": "https://ссылка-на-источник.com",
      "readingTime": "X мин",
      "tags": ["утечка данных", "кибербезопасность", "другие теги"],
      "keyFacts": [
        "Ключевой факт 1",
        "Ключевой факт 2",
        "Ключевой факт 3"
      ],
      "content": [
        "Подробное описание инцидента",
        "Анализ причин и последствий",
        "Рекомендации по защите"
      ]
    }
  ]
}

Фокусируйся на:
- Крупные утечки персональных данных
- Атаки на известные компании
- Новые методы кибератак
- Нарушения в области кибербезопасности
- Инциденты с финансовыми последствиями

Используй только проверенные источники и реальные события. Переводи все на русский язык.`

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false,
        web_search_options: {
          search_context_size: 'medium',
          latest_updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from Perplexity API')
    }

    let newsData
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        newsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse JSON from Perplexity response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse news data', rawContent: content },
        { status: 500 }
      )
    }

    return NextResponse.json(newsData)

  } catch (error) {
    console.error('Error generating news:', error)
    return NextResponse.json(
      { error: 'Failed to generate news' },
      { status: 500 }
    )
  }
}