const OpenAIService = require('../../src/services/OpenAIService');

// Mock the OpenAI module itself.
// When new OpenAI() is called, it returns our mock object.
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('OpenAIService', () => {
  let openaiService;

  beforeEach(() => {
    // Clear all mocks before each test to ensure test isolation
    jest.clearAllMocks();
    // Create a new service instance for each test
    openaiService = new OpenAIService('test-api-key', 'gpt-4');
  });

  describe('constructor', () => {
    it('should initialize with a valid API key', () => {
      expect(openaiService.isAvailable()).toBe(true);
      expect(openaiService.apiKey).toBe('test-api-key');
      expect(openaiService.model).toBe('gpt-4');
    });

    it('should not initialize without an API key', () => {
      const service = new OpenAIService('');
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('generateSummary', () => {
    it('should return a fallback response when the service is not available', async () => {
      const service = new OpenAIService(''); // Service without a key
      const result = await service.generateSummary({ summary: {} }, 'company');
      
      expect(result.model).toBe('fallback');
      expect(result.summary.notes).toBeDefined();
    });

    it('should call chat.completions.create with the correct parameters and return the summary', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"analysis":"good"}' } }],
        usage: { total_tokens: 123 },
      };
      // Mock the resolved value for this specific test
      openaiService.client.chat.completions.create.mockResolvedValue(mockResponse);

      const data = {
        query: '123',
        summary: { company: { name: 'Test Co' }, ceo: {}, okved: {}, risk_flags: [] },
      };
      const result = await openaiService.generateSummary(data, 'company');

      // Verify that the mock was called correctly
      expect(openaiService.client.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(openaiService.client.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.any(Array),
        })
      );

      // Verify the result
      expect(result.ok).toBe(true);
      expect(result.provider).toBe('openai');
      expect(result.summary).toEqual({ analysis: 'good' });
      expect(result.usage.total_tokens).toBe(123);
    });

    it('should handle non-JSON responses gracefully', async () => {
      const mockResponse = { choices: [{ message: { content: 'this is not valid json' } }] };
      openaiService.client.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.generateSummary({ summary: {} }, 'company');

      expect(result.ok).toBe(true);
      expect(result.summary.error).toBe('Failed to parse AI response');
      expect(result.summary.raw).toBe('this is not valid json');
    });

    it('should return a fallback response on API failure', async () => {
      openaiService.client.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await openaiService.generateSummary({ summary: {} }, 'company');

      expect(result.model).toBe('fallback');
      expect(result.summary.notes).toBeDefined();
    });
  });

  describe('createPrompt', () => {
    it('should create a valid company prompt using the summary data', () => {
      const data = {
        summary: {
          company: { name: 'Prompt Company' },
          ceo: { name: 'CEO Name' },
          okved: { main: 'Main Activity' },
          risk_flags: ['A risk flag'],
        },
      };
      const { system, user } = openaiService.createPrompt(data, 'company');

      expect(system).toContain('эксперт-аналитик по корпоративным данным');
      expect(user).toContain('"name": "Prompt Company"');
      expect(user).toContain('"ai_analysis"');
    });

    it('should create a valid leaks prompt with optimized results', () => {
      const data = {
        query: 'leak@example.com',
        field: 'email',
        results: { // This should be the optimized data structure
          ITP: { ok: true, count: 2, samples: [], databases: ['db1'] },
        },
      };
      const { system, user } = openaiService.createPrompt(data, 'leaks');

      expect(system).toContain('эксперт по кибербезопасности');
      expect(user).toContain('leak@example.com');
      expect(user).toContain('"ITP"');
      expect(user).toContain('"risk_level"');
    });

    it('should throw an error for an unknown prompt type', () => {
      expect(() => openaiService.createPrompt({}, 'unknown'))
        .toThrow('Unknown prompt type: unknown');
    });
  });
});
