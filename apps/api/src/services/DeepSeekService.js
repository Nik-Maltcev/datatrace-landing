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

Требования к ответу:
- Отвечай ТОЛЬКО на русском языке
- Создай краткую, но информативную сводку
- Структурируй информацию логично
- Выдели ключевые факты о компании
- Укажи потенциальные риски или проблемы, если они есть
- Будь объективным и фактическим`;
    } else if (type === 'leaks' || type === 'leak') {
      return `Ты - эксперт по кибербезопасности и анализу утечек данных. Твоя задача - проанализировать результаты поиска утечек и создать структурированную сводку.

Требования к ответу:
- Отвечай ТОЛЬКО на русском языке
- Проанализируй найденные данные из всех источников
- Оцени уровень риска для пользователя
- Дай конкретные рекомендации по безопасности
- Структурируй информацию по важности
- Будь точным и практичным в советах`;
    } else {
      return `Ты - эксперт по анализу данных. Проанализируй предоставленную информацию и создай структурированную сводку на русском языке.`;
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
    
    let prompt = `Проанализируй информацию о компании с ИНН: ${query}\n\n`;
    
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
    
    prompt += `Создай краткую структурированную сводку о компании, включающую:
1. Основную информацию (название, статус, адрес)
2. Сферу деятельности
3. Руководство и владельцев
4. Потенциальные риски или проблемы
5. Общую оценку надежности компании`;
    
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
    // For now, return the response as-is since DeepSeek provides well-structured responses
    // In the future, we could add more sophisticated parsing
    return {
      text: response,
      type: type,
      timestamp: new Date().toISOString()
    };
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