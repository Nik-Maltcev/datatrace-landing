const axios = require('axios');
const ErrorHandler = require('../utils/ErrorHandler');

class DeepSeekService {
  constructor(apiKey, baseUrl = 'https://api.deepseek.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.isEnabled = !!(apiKey && apiKey.trim() !== '');
    
    if (!this.isEnabled) {
      console.warn('⚠️ DeepSeek API key not provided. AI summarization will fall back to OpenAI.');
    }
  }

  isAvailable() {
    return this.isEnabled;
  }

  /**
   * Generate AI summary using DeepSeek API
   * @param {Object} data - Data to summarize (query and results)
   * @param {string} type - Type of summary ('leak' or 'company')
   * @returns {Promise<Object>} - AI summary response
   */
  async generateSummary(data, type = 'leak') {
    console.log('🤖 DeepSeek generateSummary called:', { type, hasData: !!data });
    
    if (!this.isAvailable()) {
      console.log('❌ DeepSeek service not available');
      throw new Error('DeepSeek service not available');
    }

    try {
      console.log('🔍 Building prompt...');
      const prompt = this.buildPrompt(data, type);
      console.log('📝 Prompt built, length:', prompt.length);
      
      const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, {
        model: 'deepseek-chat',
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

      console.log('✅ DeepSeek API response received:', {
        status: response.status,
        hasChoices: !!response.data?.choices,
        choicesLength: response.data?.choices?.length
      });

      const aiResponse = response.data?.choices?.[0]?.message?.content;
      
      if (!aiResponse) {
        console.log('❌ Empty response from DeepSeek API');
        throw new Error('Empty response from DeepSeek API');
      }

      console.log('🎉 DeepSeek response generated successfully');
      return {
        ok: true,
        summary: this.parseSummaryResponse(aiResponse, type),
        provider: 'deepseek',
        model: 'deepseek-chat',
        usage: response.data?.usage
      };
    } catch (error) {
      console.error('❌ DeepSeek API error:', error.message);
      if (error.response) {
        console.error('Response details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        const errorData = error.response.data;
        
        if (status === 401) {
          throw new Error('DeepSeek API authentication failed. Check your API key.');
        } else if (status === 429) {
          throw new Error('DeepSeek API rate limit exceeded. Please try again later.');
        } else if (status === 400) {
          throw new Error(`DeepSeek API bad request: ${errorData?.error?.message || statusText}`);
        } else {
          throw new Error(`DeepSeek API error: ${status} ${statusText}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('DeepSeek API request timeout');
      } else {
        throw new Error(`DeepSeek service error: ${error.message}`);
      }
    }
  }

  /**
   * Get system prompt based on summary type
   * @param {string} type - Summary type
   * @returns {string} - System prompt
   */
  getSystemPrompt(type) {
    if (type === 'company') {
      return `Ты - эксперт по анализу корпоративной информации. Твоя задача - создать структурированную сводку о компании на основе данных из различных источников.

ВАЖНО: Ответь ТОЛЬКО валидным JSON объектом в следующем формате:
{
  "company": {
    "name": "Название компании",
    "inn": "ИНН",
    "status": "Статус компании",
    "address": "Адрес",
    "contacts": {
      "phones": ["телефоны"],
      "emails": ["email адреса"],
      "sites": ["сайты"]
    }
  },
  "ceo": {
    "name": "ФИО руководителя",
    "position": "Должность"
  },
  "managers": [],
  "owners": [],
  "okved": {
    "main": "Основной вид деятельности",
    "additional": []
  },
  "risk_flags": ["список рисков"],
  "notes": ["Итоговый анализ ИИ с выводами о надежности и рисках"],
  "former_names": [],
  "predecessors": [],
  "ai_analysis": "Подробный анализ компании с выводами о надежности, рисках и рекомендациями",
  "reliability_score": "Высокая/Средняя/Низкая"
}

Требования:
- Отвечай ТОЛЬКО валидным JSON
- Заполни все поля на основе данных
- В ai_analysis дай подробный анализ
- В notes укажи ключевые выводы
- Оцени надежность компании`;
    } else if (type === 'leaks' || type === 'leak') {
      return `Ты - эксперт по кибербезопасности и анализу утечек данных. Твоя задача - проанализировать результаты поиска утечек.

ВАЖНО: Ответь ТОЛЬКО валидным JSON объектом в следующем формате:
{
  "found": true/false,
  "sources": {},
  "highlights": ["ключевые находки"],
  "person": {
    "name": null,
    "phones": [],
    "emails": [],
    "usernames": [],
    "ids": [],
    "addresses": []
  },
  "recommendations": ["рекомендации по безопасности"],
  "ai_analysis": "Подробный анализ утечек с оценкой рисков",
  "risk_level": "Высокий/Средний/Низкий"
}

Требования:
- Отвечай ТОЛЬКО валидным JSON
- Проанализируй все источники
- Дай конкретные рекомендации
- Оцени уровень риска`;
    } else {
      return `Ты - эксперт по анализу данных. Проанализируй предоставленную информацию и создай структурированную сводку на русском языке в формате JSON.`;
    }
  }

  /**
   * Build prompt for AI based on data and type
   * @param {Object} data - Data to analyze
   * @param {string} type - Analysis type
   * @returns {string} - Formatted prompt
   */
  buildPrompt(data, type) {
    if (type === 'company') {
      return this.buildCompanyPrompt(data);
    } else if (type === 'leaks' || type === 'leak') {
      return this.buildLeakPrompt(data);
    } else {
      return this.buildLeakPrompt(data); // fallback
    }
  }

  /**
   * Build company analysis prompt
   * @param {Object} data - Company data
   * @returns {string} - Formatted prompt
   */
  buildCompanyPrompt(data) {
    const { query, results } = data;
    
    let prompt = `Проанализируй информацию о компании с ИНН: ${query} и верни результат в формате JSON.\n\n`;
    
    results.forEach((result, index) => {
      if (result.ok && result.items) {
        prompt += `=== Источник ${index + 1}: ${result.name} ===\n`;
        // Сокращаем данные для уменьшения размера промпта
        const itemsStr = JSON.stringify(result.items, null, 2);
        if (itemsStr.length > 5000) {
          prompt += `${itemsStr.substring(0, 5000)}...[данные сокращены]\n\n`;
        } else {
          prompt += `${itemsStr}\n\n`;
        }
      } else if (!result.ok) {
        prompt += `=== Источник ${index + 1}: ${result.name} (ошибка) ===\n`;
        prompt += `Ошибка: ${result.error?.message || 'Неизвестная ошибка'}\n\n`;
      }
    });
    
    prompt += `Проанализируй данные и верни ТОЛЬКО валидный JSON объект согласно указанному формату. 
Обязательно заполни поля:
- company.name (извлеки из данных)
- company.status (статус компании)
- company.address (адрес)
- okved.main (основная деятельность)
- ai_analysis (твой подробный анализ)
- reliability_score (оценка надежности)
- risk_flags (выявленные риски)
- notes (ключевые выводы)`;
    
    return prompt;
  }

  /**
   * Build leak analysis prompt
   * @param {Object} data - Leak search data
   * @returns {string} - Formatted prompt
   */
  buildLeakPrompt(data) {
    const { query, field, results } = data;
    
    let prompt = `Проанализируй результаты поиска утечек для запроса: "${query}" (тип: ${field})\n\n`;
    
    results.forEach((result, index) => {
      if (result.ok && result.items) {
        prompt += `=== Источник ${index + 1}: ${result.name} ===\n`;
        if (Array.isArray(result.items)) {
          prompt += `Найдено записей: ${result.items.length}\n`;
          prompt += `Примеры данных: ${JSON.stringify(result.items.slice(0, 3), null, 2)}\n\n`;
        } else {
          prompt += `Данные: ${JSON.stringify(result.items, null, 2)}\n\n`;
        }
      } else if (!result.ok) {
        prompt += `=== Источник ${index + 1}: ${result.name} (ошибка) ===\n`;
        prompt += `Ошибка: ${result.error?.message || 'Неизвестная ошибка'}\n\n`;
      }
    });
    
    prompt += `Создай структурированную сводку, включающую:
1. Общую оценку найденных утечек
2. Типы скомпрометированных данных
3. Уровень риска (низкий/средний/высокий)
4. Конкретные рекомендации по защите
5. Приоритетные действия для пользователя`;
    
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
      console.log('Failed to parse JSON response, using fallback parsing');
      // Если не JSON, используем старый метод парсинга
      if (type === 'company') {
        return this.parseCompanyResponse(response);
      } else if (type === 'leaks' || type === 'leak') {
        return this.parseLeaksResponse(response);
      } else {
        return {
          text: response,
          type: type,
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  /**
   * Parse company analysis response into structured format
   * @param {string} response - AI response text
   * @returns {Object} - Structured company summary
   */
  parseCompanyResponse(response) {
    // Создаем структурированный ответ для компании
    return {
      company: {
        name: this.extractFromResponse(response, /название[:\s]*([^\n]+)/i) || "Не указано",
        inn: this.extractFromResponse(response, /инн[:\s]*([^\n]+)/i) || "Не указан",
        status: this.extractFromResponse(response, /статус[:\s]*([^\n]+)/i) || "Неизвестно",
        address: this.extractFromResponse(response, /адрес[:\s]*([^\n]+)/i) || "Не указан",
        contacts: {
          phones: [],
          emails: [],
          sites: []
        }
      },
      ceo: {
        name: this.extractFromResponse(response, /руководитель[:\s]*([^\n]+)/i) || null,
        position: "Руководитель"
      },
      managers: [],
      owners: [],
      okved: {
        main: this.extractFromResponse(response, /деятельность[:\s]*([^\n]+)/i) || null,
        additional: []
      },
      risk_flags: this.extractRisks(response),
      notes: [response], // Полный AI анализ
      former_names: [],
      predecessors: [],
      ai_analysis: response, // Добавляем полный AI анализ
      reliability_score: this.extractReliabilityScore(response)
    };
  }

  /**
   * Parse leaks analysis response into structured format
   * @param {string} response - AI response text
   * @returns {Object} - Structured leaks summary
   */
  parseLeaksResponse(response) {
    return {
      found: response.toLowerCase().includes('найден') || response.toLowerCase().includes('обнаружен'),
      sources: {},
      highlights: this.extractHighlights(response),
      person: {
        name: null,
        phones: [],
        emails: [],
        usernames: [],
        ids: [],
        addresses: []
      },
      recommendations: this.extractRecommendations(response),
      ai_analysis: response, // Полный AI анализ
      risk_level: this.extractRiskLevel(response)
    };
  }

  /**
   * Extract specific information from AI response using regex
   * @param {string} text - AI response text
   * @param {RegExp} pattern - Regex pattern to match
   * @returns {string|null} - Extracted text or null
   */
  extractFromResponse(text, pattern) {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract risk flags from AI response
   * @param {string} text - AI response text
   * @returns {Array} - Array of risk flags
   */
  extractRisks(text) {
    const risks = [];
    if (text.toLowerCase().includes('риск')) {
      risks.push('Выявлены потенциальные риски');
    }
    if (text.toLowerCase().includes('проблем')) {
      risks.push('Обнаружены проблемы');
    }
    return risks;
  }

  /**
   * Extract reliability score from AI response
   * @param {string} text - AI response text
   * @returns {string} - Reliability assessment
   */
  extractReliabilityScore(text) {
    if (text.toLowerCase().includes('высок')) return 'Высокая';
    if (text.toLowerCase().includes('средн')) return 'Средняя';
    if (text.toLowerCase().includes('низк')) return 'Низкая';
    return 'Требует анализа';
  }

  /**
   * Extract highlights from leaks response
   * @param {string} text - AI response text
   * @returns {Array} - Array of highlights
   */
  extractHighlights(text) {
    const highlights = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.includes('найден') || line.includes('обнаружен') || line.includes('утечк')) {
        highlights.push(line.trim());
      }
    });
    return highlights.length > 0 ? highlights : ['AI анализ завершен'];
  }

  /**
   * Extract recommendations from AI response
   * @param {string} text - AI response text
   * @returns {Array} - Array of recommendations
   */
  extractRecommendations(text) {
    const recommendations = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.includes('рекоменд') || line.includes('совет') || line.includes('следует')) {
        recommendations.push(line.trim());
      }
    });
    return recommendations.length > 0 ? recommendations : ['Следуйте рекомендациям AI анализа'];
  }

  /**
   * Extract risk level from leaks response
   * @param {string} text - AI response text
   * @returns {string} - Risk level
   */
  extractRiskLevel(text) {
    if (text.toLowerCase().includes('высокий риск')) return 'Высокий';
    if (text.toLowerCase().includes('средний риск')) return 'Средний';
    if (text.toLowerCase().includes('низкий риск')) return 'Низкий';
    return 'Требует оценки';
  }

  /**
   * Create fallback response when AI is not available
   * @param {Object} data - Original data
   * @param {string} type - Summary type
   * @returns {Object} - Fallback response
   */
  createFallbackResponse(data, type) {
    return ErrorHandler.createFallbackResponse(data, type, 'deepseek-unavailable');
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
      provider: 'deepseek',
      model: 'deepseek-chat',
      version: '1.0.0'
    };
  }
}

module.exports = DeepSeekService;