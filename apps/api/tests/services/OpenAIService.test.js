const OpenAIService = require('../../src/services/OpenAIService');

// Mock OpenAI module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    responses: {
      create: jest.fn()
    },
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

describe('OpenAIService', () => {
  let openaiService;
  let mockOpenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    openaiService = new OpenAIService('test-api-key', 'gpt-4');
    mockOpenAI = openaiService.client;
  });

  describe('constructor', () => {
    it('should initialize with valid API key', () => {
      expect(openaiService.isAvailable()).toBe(true);
      expect(openaiService.apiKey).toBe('test-api-key');
      expect(openaiService.model).toBe('gpt-4');
    });

    it('should not initialize without API key', () => {
      const service = new OpenAIService('');
      expect(service.isAvailable()).toBe(false);
    });

    it('should not initialize with null API key', () => {
      const service = new OpenAIService(null);
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('isGPT5Model', () => {
    it('should detect GPT-5 model', () => {
      const service = new OpenAIService('test-key', 'gpt-5');
      expect(service.isGPT5Model()).toBe(true);
    });

    it('should detect GPT-5 model case insensitive', () => {
      const service = new OpenAIService('test-key', 'GPT-5-turbo');
      expect(service.isGPT5Model()).toBe(true);
    });

    it('should not detect GPT-4 as GPT-5', () => {
      const service = new OpenAIService('test-key', 'gpt-4');
      expect(service.isGPT5Model()).toBe(false);
    });
  });

  describe('generateSummary', () => {
    it('should throw error when service not available', async () => {
      const service = new OpenAIService('');
      
      await expect(service.generateSummary({}, 'company'))
        .rejects.toThrow('OpenAI service not available');
    });

    it('should use Responses API for GPT-5', async () => {
      const gpt5Service = new OpenAIService('test-key', 'gpt-5');
      const mockResponse = {
        output: [{
          type: 'message',
          content: [{ type: 'output_text', text: '{"test": "data"}' }]
        }]
      };

      gpt5Service.client.responses.create.mockResolvedValue(mockResponse);

      const result = await gpt5Service.generateSummary({ query: 'test', results: [] }, 'company');

      expect(gpt5Service.client.responses.create).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.model).toBe('gpt-5');
      expect(result.summary).toEqual({ test: 'data' });
    });

    it('should use Chat Completions API for GPT-4', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '{"test": "data"}'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.generateSummary({ query: 'test', results: [] }, 'company');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.model).toBe('gpt-4');
      expect(result.summary).toEqual({ test: 'data' });
    });

    it('should fallback to Chat Completions when Responses API fails', async () => {
      const gpt5Service = new OpenAIService('test-key', 'gpt-5');
      
      // Mock Responses API failure
      gpt5Service.client.responses.create.mockRejectedValue(new Error('Responses API failed'));
      
      // Mock Chat Completions success
      const mockChatResponse = {
        choices: [{
          message: {
            content: '{"fallback": "data"}'
          }
        }]
      };
      gpt5Service.client.chat.completions.create.mockResolvedValue(mockChatResponse);

      const result = await gpt5Service.generateSummary({ query: 'test', results: [] }, 'company');

      expect(gpt5Service.client.responses.create).toHaveBeenCalled();
      expect(gpt5Service.client.chat.completions.create).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.model).toBe('gpt-4-fallback');
    });

    it('should handle invalid JSON response gracefully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'invalid json'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.generateSummary({ query: 'test', results: [] }, 'company');

      expect(result.ok).toBe(true);
      expect(result.summary).toEqual({ raw: 'invalid json' });
    });
  });

  describe('createFallbackResponse', () => {
    it('should create company fallback response', () => {
      const data = {
        query: '1234567890',
        results: [{
          ok: true,
          items: {
            company_names: { short_name: 'Test Company' },
            address: { line_address: 'Test Address' },
            status: 'Active'
          }
        }]
      };

      const result = openaiService.createFallbackResponse(data, 'company');

      expect(result.ok).toBe(true);
      expect(result.model).toBe('fallback');
      expect(result.summary.company.name).toBe('Test Company');
      expect(result.summary.company.address).toBe('Test Address');
      expect(result.summary.company.status).toBe('Active');
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

      const result = openaiService.createFallbackResponse(data, 'leaks');

      expect(result.ok).toBe(true);
      expect(result.model).toBe('fallback');
      expect(result.summary.found).toBe(true);
      expect(result.summary.sources.TestSource.foundCount).toBe(2);
    });

    it('should handle unknown type', () => {
      const result = openaiService.createFallbackResponse({}, 'unknown');

      expect(result.ok).toBe(true);
      expect(result.model).toBe('fallback');
      expect(result.summary.error).toBe('Unknown type for fallback response');
    });
  });

  describe('createPrompt', () => {
    it('should create company prompt', () => {
      const data = { query: 'test', results: [] };
      const prompt = openaiService.createPrompt(data, 'company');

      expect(prompt.system).toContain('эксперт-аналитик корпоративных данных');
      expect(prompt.instruction.inn).toBe('test');
      expect(prompt.instruction.sources).toEqual([]);
    });

    it('should create leaks prompt', () => {
      const data = { query: 'test', field: 'email', results: [] };
      const prompt = openaiService.createPrompt(data, 'leaks');

      expect(prompt.system).toContain('эксперт по кибербезопасности');
      expect(prompt.instruction.query).toBe('test');
      expect(prompt.instruction.field).toBe('email');
    });

    it('should throw error for unknown type', () => {
      expect(() => openaiService.createPrompt({}, 'unknown'))
        .toThrow('Unknown prompt type: unknown');
    });
  });
});