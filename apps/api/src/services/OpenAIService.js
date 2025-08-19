const OpenAI = require('openai');

class OpenAIService {
  constructor(apiKey, model = 'gpt-5') {
    this.apiKey = apiKey;
    this.model = model;
    this.client = null;
    this.isInitialized = false;
    
    this.initialize();
  }

  initialize() {
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.warn('⚠️ OpenAI API key not provided');
      return;
    }

    try {
      this.client = new OpenAI({ apiKey: this.apiKey });
      this.isInitialized = true;
      console.log('✅ OpenAI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error.message);
      this.isInitialized = false;
    }
  }

  isAvailable() {
    return this.isInitialized && this.client !== null;
  }

  isGPT5Model() {
    return this.model && this.model.toLowerCase().includes('gpt-5');
  }

  async generateSummary(data, type = 'company') {
    if (!this.isAvailable()) {
      // Provide a structured fallback immediately to avoid breaking flows
      return this.createFallbackResponse(data, type);
    }

    const prompt = this.createPrompt(data, type);
    
    try {
      if (this.isGPT5Model()) {
        return await this.handleResponsesAPI(prompt);
      } else {
        return await this.handleChatCompletionsAPI(prompt);
      }
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      throw error;
    }
  }

  async handleResponsesAPI(prompt) {
    console.log('🚀 Using OpenAI Responses API for GPT-5...');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timeout (20s)')), 20000);
    });

    try {
      const responsePromise = this.client.responses.create({
        model: this.model,
        input: prompt.system + '\n\n' + JSON.stringify(prompt.instruction),
        text: {
          format: {
            type: 'json_object'
          }
        },
        temperature: 0.7,
        max_output_tokens: 2000
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      // Extract text from Responses API format
      let responseText = '';
      if (response.output && response.output.length > 0) {
        const firstOutput = response.output[0];
        if (firstOutput.type === 'message' && firstOutput.content) {
          const textContent = firstOutput.content.find(c => c.type === 'output_text');
          if (textContent) {
            responseText = textContent.text;
          }
        }
      }

      // Fallback for different response formats
      if (!responseText && response.output_text) {
        responseText = response.output_text;
      }

      console.log('✅ Responses API response received');
      
      let parsed;
      try {
        parsed = JSON.parse(responseText || '{}');
      } catch {
        parsed = { raw: responseText, error: 'Failed to parse JSON' };
      }

      return {
        ok: true,
        model: this.model,
        summary: parsed,
        raw_response: responseText
      };

    } catch (error) {
      console.log('❌ Responses API failed, falling back to Chat Completions:', error.message);
      
      // Fallback to Chat Completions API
      return await this.handleChatCompletionsAPI(prompt);
    }
  }

  async handleChatCompletionsAPI(prompt) {
    console.log('🔄 Using Chat Completions API...');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Chat completions timeout (15s)')), 15000);
    });

    const chatPromise = this.client.chat.completions.create({
      model: this.model.includes('gpt-5') ? 'gpt-4' : this.model, // Fallback model for GPT-5
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: JSON.stringify(prompt.instruction) }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const completion = await Promise.race([chatPromise, timeoutPromise]);
    console.log('✅ Chat completions response received');
    
    const messageContent = completion.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(messageContent);
    } catch {
      parsed = { raw: messageContent };
    }

    return {
      ok: true,
      model: this.model.includes('gpt-5') ? 'gpt-4-fallback' : this.model,
      summary: parsed
    };
  }

  createPrompt(data, type) {
    if (type === 'company') {
      return this.createCompanyPrompt(data);
    } else if (type === 'leaks') {
      return this.createLeaksPrompt(data);
    }
    
    throw new Error(`Unknown prompt type: ${type}`);
  }

  createCompanyPrompt(data) {
    const system = 'Ты — эксперт-аналитик корпоративных данных с использованием GPT-5. Твоя задача — создать максимально полную и структурированную сводку о компании для красивого отображения в интерфейсе.';
    
    const instruction = {
      task: 'Проанализируй и объедини данные о компании из всех источников (Datanewton, Checko). Создай полную структурированную сводку для красивого отображения в UI.',
      language: 'ru',
      enhanced_processing: 'Используй возможности GPT-5 для глубокого анализа и нормализации данных',
      schema: {
        company: {
          name: 'string|null - приоритет краткому названию',
          fullName: 'string|null - полное официальное название',
          shortName: 'string|null - краткое название',
          inn: 'string|null - нормализованный ИНН',
          ogrn: 'string|null - нормализованный ОГРН',
          kpp: 'string|null',
          opf: 'string|null - организационно-правовая форма',
          registration_date: 'string|null - дата в формате YYYY-MM-DD или DD.MM.YYYY',
          years_from_registration: 'number|null - количество лет с регистрации',
          status: 'string|null - статус: Действует/Ликвидирована/и т.д.',
          address: 'string|null - полный нормализованный адрес',
          charter_capital: 'string|null - уставной капитал с валютой',
          contacts: {
            phones: 'string[] - нормализованные телефоны в формате +7(XXX)XXX-XX-XX',
            emails: 'string[] - валидные email адреса',
            sites: 'string[] - веб-сайты без http/https префикса'
          }
        },
        ceo: {
          name: 'string|null - ФИО руководителя',
          fio: 'string|null - альтернативное поле ФИО',
          position: 'string|null - должность',
          post: 'string|null - альтернативное поле должности'
        },
        managers: '[{ name: string, fio?: string, position?: string, post?: string }] - все руководители',
        owners: '[{ name: string, type?: string, inn?: string, share_text?: string, share_percent?: number }] - учредители и владельцы',
        okved: {
          main: '{ code?: string, text?: string, title?: string } - основной ОКВЭД',
          additional: '[{ code?: string, text?: string, title?: string }] - дополнительные ОКВЭДы'
        },
        risk_flags: 'string[] - флаги рисков и негативные факторы',
        notes: 'string[] - дополнительные заметки и важная информация',
        former_names: 'string[] - прежние названия компании',
        predecessors: 'string[] - предшественники'
      },
      rules: [
        'Используй возможности GPT-5 для максимально точной обработки данных',
        'Отвечай строго JSON без комментариев и дополнительного текста',
        'Объединяй данные из всех источников, приоритет более полным данным',
        'Удаляй дубликаты и нормализуй форматы (телефоны, даты, адреса)',
        'Если данные противоречат друг другу, выбирай наиболее достоверные',
        'Заполняй years_from_registration на основе registration_date',
        'Нормализуй телефоны в российский формат +7(XXX)XXX-XX-XX',
        'Если поле недоступно — ставь null или пустой массив',
        'Добавляй в risk_flags любые негативные факторы из источников',
        'В notes включай важную дополнительную информацию'
      ],
      inn: data.query,
      sources: data.results
    };

    return { system, instruction };
  }

  createLeaksPrompt(data) {
    const system = 'Ты — эксперт по кибербезопасности и анализу утечек данных. Проанализируй результаты поиска утечек и создай структурированную сводку.';
    
    const instruction = {
      task: 'Проанализируй результаты поиска утечек данных из всех источников и создай понятную сводку для пользователя.',
      language: 'ru',
      schema: {
        found: 'boolean - найдены ли утечки',
        sources: 'object - статус по каждому источнику',
        highlights: 'string[] - ключевые находки',
        person: {
          name: 'string|null',
          phones: 'string[]',
          emails: 'string[]',
          usernames: 'string[]',
          ids: 'string[]',
          addresses: 'string[]'
        },
        recommendations: 'string[] - рекомендации по безопасности'
      },
      query: data.query,
      field: data.field,
      sources: data.results
    };

    return { system, instruction };
  }

  createFallbackResponse(data, type) {
    if (type === 'company') {
      return this.createCompanyFallback(data);
    } else if (type === 'leaks') {
      return this.createLeaksFallback(data);
    }
    
    return {
      ok: true,
      model: 'fallback',
      summary: { error: 'Unknown type for fallback response' }
    };
  }

  createCompanyFallback(data) {
    const { query: inn, results } = data;
    
    let fallbackSummary = {
      company: {
        name: "Информация недоступна",
        inn: inn,
        status: "Неизвестно",
        address: "Не указан",
        contacts: { phones: [], emails: [], sites: [] }
      },
      ceo: { name: null, position: null },
      managers: [],
      owners: [],
      okved: { main: null, additional: [] },
      risk_flags: [],
      notes: ["Базовая информация получена из открытых источников"],
      former_names: [],
      predecessors: []
    };

    // Извлекаем базовую информацию из результатов
    try {
      for (const result of results) {
        if (result.ok && result.items) {
          const items = result.items;

          // Название компании
          if (items.company_names?.short_name) {
            fallbackSummary.company.name = items.company_names.short_name;
          } else if (items.company_names?.full_name) {
            fallbackSummary.company.name = items.company_names.full_name;
          } else if (items.name) {
            fallbackSummary.company.name = items.name;
          }

          // Адрес
          if (items.address?.line_address) {
            fallbackSummary.company.address = items.address.line_address;
          } else if (items.address) {
            fallbackSummary.company.address = items.address;
          }

          // Статус
          if (items.status) {
            fallbackSummary.company.status = items.status;
          } else if (items.state) {
            fallbackSummary.company.status = items.state;
          }

          // Руководитель
          if (items.ceo?.name || items.manager?.name) {
            fallbackSummary.ceo = {
              name: items.ceo?.name || items.manager?.name,
              position: items.ceo?.position || items.manager?.position || 'Руководитель'
            };
          }
        }
      }

      // Обновляем сводку если есть данные
      if (fallbackSummary.company.name !== "Информация недоступна") {
        fallbackSummary.notes = [
          `Компания ${fallbackSummary.company.name} с ИНН ${inn}.`,
          `Статус: ${fallbackSummary.company.status}.`,
          'ИИ анализ недоступен, показаны базовые данные.'
        ];
      }
    } catch (error) {
      console.error('Fallback processing error:', error);
      fallbackSummary.notes.push('Ошибка при обработке данных');
    }

    return {
      ok: true,
      model: 'fallback',
      summary: fallbackSummary
    };
  }

  createLeaksFallback(data) {
    const { query, field, results } = data;
    
    let found = false;
    let sources = {};
    let highlights = [];
    let person = {
      name: null,
      phones: [],
      emails: [],
      usernames: [],
      ids: [],
      addresses: []
    };

    // Анализируем результаты каждого источника
    for (const result of results) {
      if (result && result.name) {
        let foundCount = 0;
        let notes = 'Источник недоступен или нет данных';

        if (result.ok && result.items) {
          found = true;
          
          if (result.name === 'ITP' && typeof result.items === 'object') {
            for (const [category, items] of Object.entries(result.items)) {
              if (Array.isArray(items) && items.length > 0) {
                foundCount += items.length;
                highlights.push(`${category}: ${items.length} записей`);
              }
            }
          } else if (Array.isArray(result.items)) {
            foundCount = result.items.length;
            if (foundCount > 0) {
              highlights.push(`${result.name}: ${foundCount} записей`);
            }
          }

          notes = foundCount > 0 ? 'Данные найдены' : 'Нет данных';
        }

        sources[result.name] = { foundCount, notes };
      }
    }

    if (!found) {
      highlights.push('Информация по запросу не найдена');
    }

    return {
      ok: true,
      model: 'fallback',
      summary: {
        found,
        sources,
        highlights,
        person,
        recommendations: [
          'ИИ анализ недоступен',
          'Показаны базовые результаты поиска',
          'Рекомендуется повторить запрос позже'
        ]
      }
    };
  }
}

module.exports = OpenAIService;