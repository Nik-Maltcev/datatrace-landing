import { NextRequest, NextResponse } from 'next/server'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

export async function POST(request: NextRequest) {
  try {
    console.log('Starting news generation request')
    
    if (!PERPLEXITY_API_KEY) {
      console.error('Perplexity API key not configured')
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

    console.log('Making request to Perplexity API')
    
    const requestBody = {
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
    }
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Perplexity API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Perplexity API error:', response.status, errorText)
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Perplexity API response:', JSON.stringify(data, null, 2))
    
    const content = data.choices[0]?.message?.content

    if (!content) {
      console.error('No content received from Perplexity API')
      throw new Error('No content received from Perplexity API')
    }

    console.log('Raw content from Perplexity:', content)

    let newsData
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0]
        console.log('Extracted JSON string:', jsonString)
        newsData = JSON.parse(jsonString)
      } else {
        console.error('No JSON found in response')
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse JSON from Perplexity response:', parseError)
      console.error('Raw content was:', content)
      return NextResponse.json(
        { error: 'Failed to parse news data', rawContent: content },
        { status: 500 }
      )
    }

    console.log('Successfully parsed news data:', newsData)
    return NextResponse.json(newsData)

  } catch (error) {
    console.error('Error generating news:', error)
    return NextResponse.json(
      { error: 'Failed to generate news', details: error.message },
      { status: 500 }
    )
  }
}