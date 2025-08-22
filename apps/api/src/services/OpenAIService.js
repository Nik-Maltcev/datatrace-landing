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

  async generateSummary(data, type = 'company') {
    if (!this.isAvailable()) {
      console.log('❌ OpenAI service is not available, returning fallback.');
      return this.createFallbackResponse(data, type);
    }

    const { system, user } = this.createPrompt(data, type);

    try {
      console.log(`🚀 Calling OpenAI Chat Completions API with model ${this.model}...`);
    
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI request timed out after 30 seconds')), 30000);
      });

      // Пробуем разные модели с fallback
      const modelsToTry = [this.model, 'gpt-4o', 'gpt-4o-mini'];
      let completion;
      let usedModel = this.model;
      
      for (const model of modelsToTry) {
        try {
          console.log(`🔄 Trying model: ${model}`);
          
          const chatPromise = this.client.chat.completions.create({
            model: model,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user }
            ],
            temperature: 0.5,
            max_tokens: 2048,
          });

          completion = await Promise.race([chatPromise, timeoutPromise]);
          usedModel = model;
          console.log(`✅ Successfully used model: ${model}`);
          break;
          
        } catch (modelError) {
          console.log(`❌ Model ${model} failed: ${modelError.message}`);
          if (model === modelsToTry[modelsToTry.length - 1]) {
            throw modelError; // Если это последняя модель, пробрасываем ошибку
          }
          continue;
        }
      }
      console.log('✅ OpenAI Chat Completions response received.');
    
    const messageContent = completion.choices?.[0]?.message?.content || '{}';
      let parsedSummary;
      try {
        parsedSummary = JSON.parse(messageContent);
      } catch (e) {
        console.error('❌ Failed to parse JSON response from OpenAI:', e);
        parsedSummary = { error: 'Failed to parse AI response', raw: messageContent };
    }

    return {
      ok: true,
        summary: parsedSummary,
        provider: 'openai',
        model: usedModel,
        usage: completion.usage,
      };

    } catch (error) {
      console.error('❌ OpenAI API call failed:', error.message);
      // Return a structured error response with a fallback
      return this.createFallbackResponse(data, type, error);
    }
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
    const system = `Ты — эксперт-аналитик корпоративных данных (GPT-5 класс). Тебе передают уже сгруппированные структурированные сведения о компании из разных источников.
Задача: собрать из этого аккуратную, нормализованную сводку и ответить ТОЛЬКО валидным JSON по схеме ниже.`;

    const user = `Входные данные (сводка по компании для ИНН: ${data.query || 'unknown'}):

\`\`\`json
${JSON.stringify(data.summary, null, 2)}
\`\`\`

Требования:
- Нормализуй телефоны (формат +7(XXX)XXX-XX-XX), даты (YYYY-MM-DD), убери дубликаты, не выдумывай поля.
- Если чего-то нет — ставь null или пустой массив.
- В \"years_from_registration\" посчитай количество полных лет от даты регистрации до сегодня, если есть дата.
- Верни ТОЛЬКО валидный JSON без пояснений, строго по схеме.

Схема ответа:
{
  "company": {
    "name": "string|null",
    "fullName": "string|null",
    "shortName": "string|null",
    "inn": "string|null",
    "ogrn": "string|null",
    "kpp": "string|null",
    "opf": "string|null",
    "registration_date": "string|null",
    "years_from_registration": "number|null",
    "status": "string|null",
    "address": "string|null",
    "activity": "string|null",
    "charter_capital": "string|null",
    "contacts": {
      "phones": ["string"],
      "emails": ["string"],
      "sites": ["string"]
    }
  },
  "ceo": { "name": "string|null", "fio": "string|null", "position": "string|null", "post": "string|null" },
  "managers": [{ "name": "string", "fio": "string|optional", "position": "string|optional", "post": "string|optional" }],
  "owners": [{ "name": "string", "type": "string|optional", "inn": "string|optional", "share_text": "string|optional", "share_percent": "number|optional" }],
  "okved": { "main": { "code": "string|optional", "text": "string|optional", "title": "string|optional" }, "additional": [{ "code": "string|optional", "text": "string|optional", "title": "string|optional" }] },
  "risk_flags": ["string"],
  "notes": ["string"],
  "highlights": ["string"],
  "ai_analysis": "string",
  "reliability_score": "Высокая|Средняя|Низкая|Требует оценки"
}`;
    return { system, user };
  }

  createLeaksPrompt(data) {
    const system = `Ты — эксперт по кибербезопасности и анализу утечек данных. Твоя задача — на основе предоставленных структурированных и уже оптимизированных данных, написать краткий, но емкий аналитический отчет.
Ответ должен быть строго в формате JSON по указанной схеме.`;

    const user = `Проанализируй следующие данные по утечкам для запроса "${data.query}" и верни JSON.

**Оптимизированные данные из источников:**
\`\`\`json
${JSON.stringify(data.results, null, 2)}
\`\`\`

**Твоя задача:**
1.  На основе предоставленных данных, определи, были ли найдены утечки (\`found\`).
2.  Сформируй поле \`highlights\` с ключевыми находками (например, "Найдены пароли в источнике X", "Обнаружен адрес в источнике Y").
3.  Сформируй поле \`person\`, собрав все персональные данные (имена, телефоны, email) из всех источников.
4.  Предоставь четкие \`security_recommendations\` (например, "Смените пароль на затронутых сервисах", "Включите двухфакторную аутентификацию").
5.  Дай общую оценку ситуации в поле \`summary\`.
6.  Оцени уровень риска (\`risk_level\`).

**Верни JSON строго в формате:**
\`\`\`json
{
  "found": true | false,
  "sources": "object - статус по каждому источнику, как в предоставленных данных",
  "highlights": ["Ключевая находка 1", "Ключевая находка 2"],
  "person": {
    "name": "string | null",
    "phones": ["string"],
    "emails": ["string"],
    "usernames": ["string"]
  },
  "security_recommendations": {
    "password_change_sites": ["site1.com"],
    "immediate_actions": ["Срочное действие 1"]
  },
  "risk_level": "low | medium | high | critical",
  "summary": "Твой текстовый анализ и общая оценка ситуации."
}
\`\`\`
`;
    return { system, user };
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
    const { query: inn } = data || {};
    // results может отсутствовать, в новом потоке мы передаем summary; поддержим оба варианта
    const results = Array.isArray(data?.results) ? data.results : [];
    
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
      for (const result of results || []) {
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