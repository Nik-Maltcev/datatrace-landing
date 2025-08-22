const axios = require('axios');
const ErrorHandler = require('../utils/ErrorHandler');

class KimiService {
  constructor(apiKey, baseUrl = 'htt  buildPrompt(data, type) {
    const { query, field, results } = data;
    
    // Проверяем, что results является массивом
    if (!Array.isArray(results)) {
      console.error('KimiService: results is not an array:', typeof results);
      return {
        system: 'Ты эксперт по анализу данных утечек.',
        user: `Не удалось обработать данные для запроса "${query}". Результаты имеют неверный формат.`
      };
    }
    
    let prompt = `Проанализируй результаты поиска утечек для запроса: "${query}" (тип поиска: ${field}) и верни результат в формате JSON.\n\n`;
    
    results.forEach((result, index) => {latform.moonshot.ai') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.isEnabled = !!(apiKey && apiKey.trim() !== '');
    
    if (!this.isEnabled) {
      console.warn('⚠️ Kimi API key not provided. Leak analysis will fall back to other services.');
    }
  }

  isAvailable() {
    return this.isEnabled;
  }

  /**
   * Generate AI summary using Kimi K2 API
   * @param {Object} data - Data to summarize (query and results)
   * @param {string} type - Type of summary ('leaks' or 'leak')
   * @returns {Promise<Object>} - AI summary response
   */
  async generateSummary(data, type = 'leaks') {
    if (!this.isAvailable()) {
      throw new Error('Kimi service not available');
    }

    try {
      const prompt = this.buildPrompt(data, type);
      
      const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, {
        model: 'moonshot-v1-128k',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(type)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
        top_p: 0.9,
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 45000
      });

      const aiResponse = response.data?.choices?.[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('Empty response from Kimi API');
      }

      return {
        ok: true,
        summary: this.parseSummaryResponse(aiResponse, type),
        provider: 'kimi',
        model: 'moonshot-v1-128k',
        usage: response.data?.usage
      };
    } catch (error) {
      console.error('Kimi API error:', error);
      
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        const errorData = error.response.data;
        
        if (status === 401) {
          throw new Error('Kimi API authentication failed. Check your API key.');
        } else if (status === 429) {
          throw new Error('Kimi API rate limit exceeded. Please try again later.');
        } else if (status === 400) {
          throw new Error(`Kimi API bad request: ${errorData?.error?.message || statusText}`);
        } else {
          throw new Error(`Kimi API error: ${status} ${statusText}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Kimi API request timeout');
      } else {
        throw new Error(`Kimi service error: ${error.message}`);
      }
    }
  }

  /**
   * Get system prompt for leak analysis
   * @param {string} type - Summary type
   * @returns {string} - System prompt
   */
  getSystemPrompt(type) {
    return `Ты - эксперт по кибербезопасности и анализу утечек данных. Твоя задача - проанализировать результаты поиска утечек и создать красивую структурированную сводку.

ВАЖНО: Ответь ТОЛЬКО валидным JSON объектом в следующем формате:
{
  "found": true/false,
  "sources": {
    "source_name": {
      "foundCount": число_найденных_записей,
      "notes": "описание_находок"
    }
  },
  "highlights": ["ключевые находки и важные моменты"],
  "person": {
    "name": null,
    "phones": ["найденные телефоны"],
    "emails": ["найденные email"],
    "usernames": ["найденные логины"],
    "ids": ["найденные ID"],
    "addresses": ["найденные адреса"]
  },
  "recommendations": [
    "🔒 Конкретные рекомендации по безопасности",
    "⚠️ Срочные действия",
    "🛡️ Долгосрочные меры защиты"
  ],
  "ai_analysis": "Подробный анализ утечек с оценкой рисков и объяснением найденных данных",
  "risk_level": "Критический/Высокий/Средний/Низкий",
  "summary_stats": {
    "total_sources": число_источников,
    "sources_with_data": число_источников_с_данными,
    "total_records": общее_количество_записей
  }
}

Требования:
- Отвечай ТОЛЬКО валидным JSON
- Проанализируй все источники данных
- Дай конкретные и практичные рекомендации
- Оцени реальный уровень риска
- Используй эмодзи в рекомендациях для наглядности
- Будь точным и полезным в советах`;
  }

  /**
   * Build prompt for leak analysis
   * @param {Object} data - Leak search data
   * @returns {string} - Formatted prompt
   */
  buildPrompt(data) {
    const { query, field, results } = data;
    
    let prompt = `Проанализируй результаты поиска утечек для запроса: "${query}" (тип поиска: ${field}) и верни результат в формате JSON.\n\n`;
    
    results.forEach((result, index) => {
      if (result.ok && result.items) {
        prompt += `=== Источник ${index + 1}: ${result.name} ===\n`;
        prompt += `Статус: Успешно\n`;
        
        if (Array.isArray(result.items)) {
          prompt += `Найдено записей: ${result.items.length}\n`;
          if (result.items.length > 0) {
            prompt += `Примеры данных: ${JSON.stringify(result.items.slice(0, 3), null, 2)}\n`;
          }
        } else if (typeof result.items === 'object') {
          const totalRecords = Object.values(result.items).reduce((sum, items) => {
            return sum + (Array.isArray(items) ? items.length : 0);
          }, 0);
          prompt += `Найдено записей: ${totalRecords}\n`;
          prompt += `Категории данных: ${Object.keys(result.items).join(', ')}\n`;
          prompt += `Примеры: ${JSON.stringify(result.items, null, 2).substring(0, 1000)}...\n`;
        }
        
        if (result.meta) {
          prompt += `Метаданные: ${JSON.stringify(result.meta)}\n`;
        }
      } else if (!result.ok) {
        prompt += `=== Источник ${index + 1}: ${result.name} ===\n`;
        prompt += `Статус: Ошибка\n`;
        prompt += `Ошибка: ${result.error?.message || 'Неизвестная ошибка'}\n`;
      }
      prompt += '\n';
    });
    
    prompt += `Проанализируй все данные и создай подробную сводку в формате JSON. Обязательно:
1. Оцени реальный уровень риска на основе найденных данных
2. Дай конкретные рекомендации по защите
3. Выдели ключевые находки
4. Структурируй информацию о найденных данных
5. Предоставь статистику по источникам`;
    
    return prompt;
  }

  /**
   * Parse AI response into structured format
   * @param {string} response - Raw AI response
   * @param {string} type - Summary type
   * @returns {Object} - Parsed summary
   */
  parseSummaryResponse(response, type) {
    try {
      // Пытаемся распарсить как JSON
      const jsonResponse = JSON.parse(response);
      return jsonResponse;
    } catch (error) {
      console.log('Failed to parse JSON response from Kimi, using fallback parsing');
      // Если не JSON, создаем структурированный ответ
      return {
        found: response.toLowerCase().includes('найден') || response.toLowerCase().includes('обнаружен'),
        sources: {},
        highlights: [response.substring(0, 200) + '...'],
        person: {
          name: null,
          phones: [],
          emails: [],
          usernames: [],
          ids: [],
          addresses: []
        },
        recommendations: ['Проверьте полный анализ ИИ для получения рекомендаций'],
        ai_analysis: response,
        risk_level: 'Требует оценки',
        summary_stats: {
          total_sources: 0,
          sources_with_data: 0,
          total_records: 0
        }
      };
    }
  }

  /**
   * Create fallback response when AI is not available
   * @param {Object} data - Original data
   * @param {string} type - Summary type
   * @returns {Object} - Fallback response
   */
  createFallbackResponse(data, type) {
    return ErrorHandler.createFallbackResponse(data, type, 'kimi-unavailable');
  }

  /**
   * Get service information
   * @returns {Object} - Service status
   */
  getServiceInfo() {
    return {
      isEnabled: this.isEnabled,
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      provider: 'kimi',
      model: 'moonshot-v1-128k',
      version: '1.0.0'
    };
  }
}

module.exports = KimiService;