const ErrorHandler = require('../../src/utils/ErrorHandler');

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleAPIError', () => {
    it('should handle HTTP response errors', () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found' }
        }
      };

      const result = ErrorHandler.handleAPIError(error, 'TestAPI');

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('HTTP_404');
      expect(result.error.message).toBe('Ресурс не найден');
      expect(result.error.details.status).toBe(404);
      expect(result.error.source).toBe('TestAPI');
      expect(result.meta.source).toBe('TestAPI');
    });

    it('should handle network errors', () => {
      const error = {
        request: {},
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };

      const result = ErrorHandler.handleAPIError(error, 'TestAPI');

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('NETWORK_ERROR');
      expect(result.error.message).toBe('Ошибка сети или недоступность сервиса');
      expect(result.error.details.code).toBe('ECONNREFUSED');
    });

    it('should handle timeout errors', () => {
      const error = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      };

      const result = ErrorHandler.handleAPIError(error, 'TestAPI');

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('TIMEOUT_ERROR');
      expect(result.error.message).toBe('Превышено время ожидания ответа');
    });

    it('should handle unknown errors', () => {
      const error = {
        message: 'Something went wrong'
      };

      const result = ErrorHandler.handleAPIError(error, 'TestAPI');

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
      expect(result.error.message).toBe('Something went wrong');
    });

    it('should use default source when not provided', () => {
      const error = { message: 'Test error' };

      const result = ErrorHandler.handleAPIError(error);

      expect(result.error.source).toBe('unknown');
      expect(result.meta.source).toBe('unknown');
    });
  });

  describe('getHTTPErrorMessage', () => {
    it('should return correct messages for known status codes', () => {
      expect(ErrorHandler.getHTTPErrorMessage(400)).toBe('Некорректный запрос');
      expect(ErrorHandler.getHTTPErrorMessage(401)).toBe('Требуется авторизация');
      expect(ErrorHandler.getHTTPErrorMessage(403)).toBe('Доступ запрещен');
      expect(ErrorHandler.getHTTPErrorMessage(404)).toBe('Ресурс не найден');
      expect(ErrorHandler.getHTTPErrorMessage(429)).toBe('Превышен лимит запросов');
      expect(ErrorHandler.getHTTPErrorMessage(500)).toBe('Внутренняя ошибка сервера');
      expect(ErrorHandler.getHTTPErrorMessage(502)).toBe('Сервис временно недоступен');
      expect(ErrorHandler.getHTTPErrorMessage(503)).toBe('Сервис недоступен');
      expect(ErrorHandler.getHTTPErrorMessage(504)).toBe('Превышено время ожидания');
    });

    it('should return generic message for unknown status codes', () => {
      expect(ErrorHandler.getHTTPErrorMessage(418)).toBe('HTTP ошибка 418');
      expect(ErrorHandler.getHTTPErrorMessage(999)).toBe('HTTP ошибка 999');
    });
  });

  describe('createFallbackResponse', () => {
    it('should create company fallback response', () => {
      const data = {
        inn: '1234567890',
        results: [{
          ok: true,
          items: {
            company_names: { short_name: 'Test Company' },
            address: { line_address: 'Test Address' },
            status: 'Active'
          }
        }]
      };

      const result = ErrorHandler.createFallbackResponse(data, 'company', 'test-source');

      expect(result.ok).toBe(true);
      expect(result.model).toBe('fallback');
      expect(result.summary.company.name).toBe('Test Company');
      expect(result.summary.company.address).toBe('Test Address');
      expect(result.summary.company.status).toBe('Active');
      expect(result.meta.source).toBe('test-source');
      expect(result.meta.note).toContain('ИИ анализ недоступен');
    });

    it('should create leaks fallback response', () => {
      const data = {
        query: 'test@email.com',
        field: 'email',
        results: [{
          name: 'TestSource',
          ok: true,
          items: ['data1', 'data2']
        }]
      };

      const result = ErrorHandler.createFallbackResponse(data, 'leaks', 'test-source');

      expect(result.ok).toBe(true);
      expect(result.model).toBe('fallback');
      expect(result.summary.found).toBe(true);
      expect(result.summary.sources.TestSource.foundCount).toBe(2);
      expect(result.summary.recommendations).toContain('ИИ анализ недоступен');
    });

    it('should handle unsupported type', () => {
      const result = ErrorHandler.createFallbackResponse({}, 'unknown', 'test-source');

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('UNSUPPORTED_TYPE');
      expect(result.error.message).toContain('Неподдерживаемый тип fallback: unknown');
    });
  });

  describe('formatErrorResponse', () => {
    it('should format validation error', () => {
      const error = { name: 'ValidationError', message: 'Invalid input' };
      const req = { path: '/api/test', method: 'POST' };

      const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);

      expect(statusCode).toBe(400);
      expect(response.ok).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('Ошибка валидации данных');
      expect(response.meta.path).toBe('/api/test');
      expect(response.meta.method).toBe('POST');
    });

    it('should format unauthorized error', () => {
      const error = { name: 'UnauthorizedError', message: 'Access denied' };

      const { statusCode, response } = ErrorHandler.formatErrorResponse(error);

      expect(statusCode).toBe(401);
      expect(response.error.code).toBe('UNAUTHORIZED');
      expect(response.error.message).toBe('Требуется авторизация');
    });

    it('should format timeout error', () => {
      const error = { message: 'Request timeout exceeded' };

      const { statusCode, response } = ErrorHandler.formatErrorResponse(error);

      expect(statusCode).toBe(504);
      expect(response.error.code).toBe('TIMEOUT');
      expect(response.error.message).toBe('Превышено время ожидания');
    });

    it('should format generic error', () => {
      const error = { message: 'Something went wrong' };

      const { statusCode, response } = ErrorHandler.formatErrorResponse(error);

      expect(statusCode).toBe(500);
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe('Внутренняя ошибка сервера');
    });

    it('should include error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = { name: 'TestError', message: 'Test error details' };
      const { response } = ErrorHandler.formatErrorResponse(error);

      expect(response.error.details).toBe('Test error details');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = ErrorHandler.generateRequestId();
      const id2 = ErrorHandler.generateRequestId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(10);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable HTTP errors', () => {
      const retryableErrors = [
        { response: { status: 502 } },
        { response: { status: 503 } },
        { response: { status: 504 } },
        { response: { status: 429 } }
      ];

      retryableErrors.forEach(error => {
        expect(ErrorHandler.isRetryableError(error)).toBe(true);
      });
    });

    it('should identify non-retryable HTTP errors', () => {
      const nonRetryableErrors = [
        { response: { status: 400 } },
        { response: { status: 401 } },
        { response: { status: 403 } },
        { response: { status: 404 } }
      ];

      nonRetryableErrors.forEach(error => {
        expect(ErrorHandler.isRetryableError(error)).toBe(false);
      });
    });

    it('should identify retryable network errors', () => {
      const retryableErrors = [
        { code: 'ECONNRESET' },
        { code: 'ENOTFOUND' },
        { code: 'ECONNABORTED' },
        { code: 'ETIMEDOUT' }
      ];

      retryableErrors.forEach(error => {
        expect(ErrorHandler.isRetryableError(error)).toBe(true);
      });
    });

    it('should identify non-retryable network errors', () => {
      const error = { code: 'EACCES' };
      expect(ErrorHandler.isRetryableError(error)).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await ErrorHandler.withRetry(mockFn, 3, 100);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ response: { status: 502 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValue('success');

      const result = await ErrorHandler.withRetry(mockFn, 3, 10);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable error', async () => {
      const mockFn = jest.fn().mockRejectedValue({ response: { status: 400 } });

      await expect(ErrorHandler.withRetry(mockFn, 3, 10))
        .rejects.toEqual({ response: { status: 400 } });

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw last error', async () => {
      const mockFn = jest.fn().mockRejectedValue({ response: { status: 502 } });

      await expect(ErrorHandler.withRetry(mockFn, 2, 10))
        .rejects.toEqual({ response: { status: 502 } });

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      ErrorHandler.logError(error, context);

      expect(console.error).toHaveBeenCalledWith(
        '[ERROR LOG]',
        expect.stringContaining('Test error')
      );
    });

    it('should log error without context', () => {
      const error = new Error('Test error');

      ErrorHandler.logError(error);

      expect(console.error).toHaveBeenCalledWith(
        '[ERROR LOG]',
        expect.stringContaining('Test error')
      );
    });
  });
});