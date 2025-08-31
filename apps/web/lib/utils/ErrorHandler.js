class ErrorHandler {
  static handleAPIError(error, source = 'unknown') {
    const timestamp = new Date().toISOString();
    const requestId = this.generateRequestId();
    
    console.error(`[${timestamp}] API Error in ${source}:`, error);
    
    let errorResponse = {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Внутренняя ошибка сервера',
        source: source
      },
      meta: {
        timestamp,
        requestId,
        source
      }
    };

    // Обработка различных типов ошибок
    if (error.response) {
      // HTTP ошибки от внешних API
      const status = error.response.status;
      const statusText = error.response.statusText;
      const data = error.response.data;

      errorResponse.error = {
        code: `HTTP_${status}`,
        message: this.getHTTPErrorMessage(status),
        details: {
          status,
          statusText,
          data: typeof data === 'string' ? data.slice(0, 500) : data
        },
        source
      };
    } else if (error.request) {
      // Ошибки сети
      errorResponse.error = {
        code: 'NETWORK_ERROR',
        message: 'Ошибка сети или недоступность сервиса',
        details: {
          code: error.code,
          message: error.message
        },
        source
      };
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Таймауты
      errorResponse.error = {
        code: 'TIMEOUT_ERROR',
        message: 'Превышено время ожидания ответа',
        source
      };
    } else {
      // Другие ошибки
      errorResponse.error = {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Неизвестная ошибка',
        source
      };
    }

    return errorResponse;
  }

  static getHTTPErrorMessage(status) {
    const messages = {
      400: 'Некорректный запрос',
      401: 'Требуется авторизация',
      403: 'Доступ запрещен',
      404: 'Ресурс не найден',
      429: 'Превышен лимит запросов',
      500: 'Внутренняя ошибка сервера',
      502: 'Сервис временно недоступен',
      503: 'Сервис недоступен',
      504: 'Превышено время ожидания'
    };

    return messages[status] || `HTTP ошибка ${status}`;
  }

  static createFallbackResponse(data, type, source = 'fallback') {
    const timestamp = new Date().toISOString();
    
    if (type === 'company') {
      return {
        ok: true,
        model: 'fallback',
        summary: this.createCompanyFallback(data),
        meta: {
          timestamp,
          source,
          note: 'ИИ анализ недоступен, показаны базовые данные'
        }
      };
    } else if (type === 'leaks') {
      return {
        ok: true,
        model: 'fallback',
        summary: this.createLeaksFallback(data),
        meta: {
          timestamp,
          source,
          note: 'ИИ анализ недоступен, показаны базовые результаты'
        }
      };
    }

    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_TYPE',
        message: `Неподдерживаемый тип fallback: ${type}`
      },
      meta: { timestamp, source }
    };
  }

  static createCompanyFallback(data) {
    const { inn, results } = data;
    
    let summary = {
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
      notes: ["Базовая информация из открытых источников"],
      former_names: [],
      predecessors: []
    };

    // Извлекаем данные из результатов
    try {
      for (const result of results || []) {
        if (result.ok && result.items) {
          const items = result.items;

          // Основная информация
          if (items.company_names?.short_name || items.name) {
            summary.company.name = items.company_names?.short_name || items.name;
          }
          
          if (items.address?.line_address || items.address) {
            summary.company.address = items.address?.line_address || items.address;
          }
          
          if (items.status || items.state) {
            summary.company.status = items.status || items.state;
          }

          // Руководитель
          if (items.ceo || items.manager) {
            summary.ceo = {
              name: items.ceo?.name || items.manager?.name,
              position: items.ceo?.position || items.manager?.position || 'Руководитель'
            };
          }

          // Контакты
          if (items.phones && Array.isArray(items.phones)) {
            summary.company.contacts.phones = items.phones;
          }
          if (items.emails && Array.isArray(items.emails)) {
            summary.company.contacts.emails = items.emails;
          }
        }
      }

      // Обновляем заметки
      if (summary.company.name !== "Информация недоступна") {
        summary.notes = [
          `Компания: ${summary.company.name}`,
          `ИНН: ${inn}`,
          `Статус: ${summary.company.status}`,
          'ИИ анализ недоступен'
        ];
      }
    } catch (error) {
      console.error('Error creating company fallback:', error);
      summary.notes.push('Ошибка при обработке данных');
    }

    return summary;
  }

  static createLeaksFallback(data) {
    const { query, field, results } = data;
    
    let found = false;
    let sources = {};
    let highlights = [];

    // Анализируем результаты
    for (const result of results || []) {
      if (result && result.name) {
        let foundCount = 0;
        let notes = 'Нет данных';

        if (result.ok && result.items) {
          found = true;
          
          if (result.name === 'ITP' && typeof result.items === 'object') {
            for (const [category, items] of Object.entries(result.items)) {
              if (Array.isArray(items) && items.length > 0) {
                foundCount += items.length;
              }
            }
          } else if (Array.isArray(result.items)) {
            foundCount = result.items.length;
          }

          if (foundCount > 0) {
            highlights.push(`${result.name}: найдено ${foundCount} записей`);
            notes = 'Данные найдены';
          }
        } else if (result.error) {
          notes = 'Ошибка источника';
        }

        sources[result.name] = { foundCount, notes };
      }
    }

    if (!found) {
      highlights.push('Данные не найдены');
    }

    return {
      found,
      sources,
      highlights,
      person: {
        name: null,
        phones: [],
        emails: [],
        usernames: [],
        ids: [],
        addresses: []
      },
      recommendations: [
        'ИИ анализ недоступен',
        'Показаны базовые результаты',
        found ? 'Обратитесь к специалисту для детального анализа' : 'Попробуйте другие варианты поиска'
      ]
    };
  }

  static logError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    };

    console.error('[ERROR LOG]', JSON.stringify(logEntry, null, 2));
    
    // В будущем можно добавить отправку в внешние системы логирования
    // this.sendToExternalLogger(logEntry);
  }

  static formatErrorResponse(error, req = null) {
    const timestamp = new Date().toISOString();
    const requestId = this.generateRequestId();
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'Внутренняя ошибка сервера';

    // Определяем тип ошибки и соответствующий HTTP статус
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = 'Ошибка валидации данных';
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      errorCode = 'UNAUTHORIZED';
      message = 'Требуется авторизация';
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
      errorCode = 'FORBIDDEN';
      message = 'Доступ запрещен';
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
      message = 'Ресурс не найден';
    } else if (error.message && error.message.includes('timeout')) {
      statusCode = 504;
      errorCode = 'TIMEOUT';
      message = 'Превышено время ожидания';
    }

    const response = {
      ok: false,
      error: {
        code: errorCode,
        message: message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      meta: {
        timestamp,
        requestId,
        path: req?.path,
        method: req?.method
      }
    };

    return { statusCode, response };
  }

  static generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  static isRetryableError(error) {
    if (error.response) {
      const status = error.response.status;
      return [502, 503, 504, 429].includes(status);
    }
    
    if (error.code) {
      return ['ECONNRESET', 'ENOTFOUND', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code);
    }
    
    return false;
  }

  static async withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          throw error;
        }
        
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
    
    throw lastError;
  }
}

module.exports = ErrorHandler;