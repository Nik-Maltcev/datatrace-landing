const DeHashedService = require('../../src/services/DeHashedService');
const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('DeHashedService', () => {
  let dehashedService;

  beforeEach(() => {
    jest.clearAllMocks();
    dehashedService = new DeHashedService('test-api-key', 'https://api.dehashed.com');
  });

  describe('constructor', () => {
    it('should initialize with valid API key', () => {
      expect(dehashedService.isAvailable()).toBe(true);
      expect(dehashedService.apiKey).toBe('test-api-key');
      expect(dehashedService.baseUrl).toBe('https://api.dehashed.com');
    });

    it('should not initialize without API key', () => {
      const service = new DeHashedService('');
      expect(service.isAvailable()).toBe(false);
    });

    it('should use default base URL', () => {
      const service = new DeHashedService('test-key');
      expect(service.baseUrl).toBe('https://api.dehashed.com');
    });
  });

  describe('checkPassword', () => {
    it('should successfully check password', async () => {
      const mockResponse = {
        data: {
          entries: [
            {
              database_name: 'Test Database',
              obtained_from: '2023-01-01',
              email: 'test@example.com',
              password: 'hashedpassword'
            }
          ],
          total: 1
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await dehashedService.checkPassword('testpassword');

      expect(result.ok).toBe(true);
      expect(result.isCompromised).toBe(true);
      expect(result.breachCount).toBe(1);
      expect(result.breaches).toHaveLength(1);
      expect(result.breaches[0].name).toBe('Test Database');
      expect(result.recommendations).toContain('🚨 КРИТИЧНО: Этот пароль найден в утечках данных!');
    });

    it('should handle password not found', async () => {
      const mockResponse = {
        data: {
          entries: [],
          total: 0
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await dehashedService.checkPassword('safepassword');

      expect(result.ok).toBe(true);
      expect(result.isCompromised).toBe(false);
      expect(result.breachCount).toBe(0);
      expect(result.recommendations).toContain('✅ Пароль не найден в известных утечках данных');
    });

    it('should throw error for invalid password', async () => {
      await expect(dehashedService.checkPassword(''))
        .rejects.toThrow('Password is required and must be a string');

      await expect(dehashedService.checkPassword(null))
        .rejects.toThrow('Password is required and must be a string');

      await expect(dehashedService.checkPassword(123))
        .rejects.toThrow('Password is required and must be a string');
    });

    it('should throw error when service unavailable', async () => {
      const service = new DeHashedService('');
      
      await expect(service.checkPassword('test'))
        .rejects.toThrow('DeHashed service not available');
    });

    it('should handle API authentication error', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 401, statusText: 'Unauthorized' }
      });

      await expect(dehashedService.checkPassword('test'))
        .rejects.toThrow('DeHashed API authentication failed. Check your API key.');
    });

    it('should handle API rate limit error', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 429, statusText: 'Too Many Requests' }
      });

      await expect(dehashedService.checkPassword('test'))
        .rejects.toThrow('DeHashed API rate limit exceeded. Please try again later.');
    });

    it('should handle API timeout', async () => {
      mockedAxios.get.mockRejectedValue({
        code: 'ECONNABORTED'
      });

      await expect(dehashedService.checkPassword('test'))
        .rejects.toThrow('DeHashed API request timeout');
    });
  });

  describe('searchByField', () => {
    it('should successfully search by email', async () => {
      const mockResponse = {
        data: {
          entries: [
            {
              database_name: 'Test Database',
              email: 'test@example.com',
              username: 'testuser',
              password: 'hashedpass'
            }
          ],
          total: 1
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await dehashedService.searchByField('test@example.com', 'email');

      expect(result.ok).toBe(true);
      expect(result.found).toBe(true);
      expect(result.total).toBe(1);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].email).toBe('test@example.com');
    });

    it('should handle search with no results', async () => {
      const mockResponse = {
        data: {
          entries: [],
          total: 0
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await dehashedService.searchByField('notfound@example.com', 'email');

      expect(result.ok).toBe(true);
      expect(result.found).toBe(false);
      expect(result.total).toBe(0);
      expect(result.entries).toHaveLength(0);
    });

    it('should handle API error gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await dehashedService.searchByField('test@example.com', 'email');

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('analyzePasswordStrength', () => {
    it('should analyze strong password', () => {
      const analysis = dehashedService.analyzePasswordStrength('StrongP@ssw0rd123');

      expect(analysis.length).toBe(15);
      expect(analysis.hasLowercase).toBe(true);
      expect(analysis.hasUppercase).toBe(true);
      expect(analysis.hasNumbers).toBe(true);
      expect(analysis.hasSpecialChars).toBe(true);
      expect(analysis.score).toBe(6);
      expect(analysis.level).toBe('Strong');
    });

    it('should analyze weak password', () => {
      const analysis = dehashedService.analyzePasswordStrength('weak');

      expect(analysis.length).toBe(4);
      expect(analysis.hasLowercase).toBe(true);
      expect(analysis.hasUppercase).toBe(false);
      expect(analysis.hasNumbers).toBe(false);
      expect(analysis.hasSpecialChars).toBe(false);
      expect(analysis.score).toBe(1);
      expect(analysis.level).toBe('Very Weak');
    });

    it('should analyze medium password', () => {
      const analysis = dehashedService.analyzePasswordStrength('Password123');

      expect(analysis.length).toBe(11);
      expect(analysis.hasLowercase).toBe(true);
      expect(analysis.hasUppercase).toBe(true);
      expect(analysis.hasNumbers).toBe(true);
      expect(analysis.hasSpecialChars).toBe(false);
      expect(analysis.score).toBe(4);
      expect(analysis.level).toBe('Good');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for compromised password', () => {
      const recommendations = dehashedService.generateRecommendations(true, 3);

      expect(recommendations).toContain('🚨 КРИТИЧНО: Этот пароль найден в утечках данных!');
      expect(recommendations).toContain('Немедленно смените пароль на всех аккаунтах где он используется');
      expect(recommendations).toContain('Пароль найден в 3 различных утечках');
      expect(recommendations).toContain('Включите двухфакторную аутентификацию на важных аккаунтах');
    });

    it('should generate recommendations for safe password', () => {
      const recommendations = dehashedService.generateRecommendations(false, 0);

      expect(recommendations).toContain('✅ Пароль не найден в известных утечках данных');
      expect(recommendations).toContain('Продолжайте использовать уникальные пароли для каждого сервиса');
      expect(recommendations).toContain('Регулярно проверяйте свои пароли на компрометацию');
    });

    it('should always include general recommendations', () => {
      const recommendations = dehashedService.generateRecommendations(false, 0);

      expect(recommendations).toContain('Рекомендуется использовать менеджер паролей');
      expect(recommendations).toContain('Создавайте пароли длиной не менее 12 символов');
    });
  });

  describe('formatBreachResults', () => {
    it('should format breach results correctly', () => {
      const entries = [
        {
          database_name: 'Database1',
          obtained_from: '2023-01-01',
          email: 'test@example.com',
          password: 'hash1'
        },
        {
          database_name: 'Database1',
          obtained_from: '2023-01-01',
          username: 'testuser',
          password: 'hash2'
        },
        {
          database_name: 'Database2',
          obtained_from: '2023-02-01',
          email: 'test2@example.com',
          name: 'Test User'
        }
      ];

      const formatted = dehashedService.formatBreachResults(entries);

      expect(formatted).toHaveLength(2);
      expect(formatted[0].name).toBe('Database1');
      expect(formatted[0].entryCount).toBe(2);
      expect(formatted[0].dataTypes).toContain('Email');
      expect(formatted[0].dataTypes).toContain('Password');
      expect(formatted[1].name).toBe('Database2');
      expect(formatted[1].entryCount).toBe(1);
      expect(formatted[1].dataTypes).toContain('Email');
      expect(formatted[1].dataTypes).toContain('Name');
    });
  });

  describe('getServiceInfo', () => {
    it('should return service information', () => {
      const info = dehashedService.getServiceInfo();

      expect(info.isEnabled).toBe(true);
      expect(info.baseUrl).toBe('https://api.dehashed.com');
      expect(info.hasApiKey).toBe(true);
      expect(info.version).toBe('1.0.0');
    });

    it('should return correct info when disabled', () => {
      const service = new DeHashedService('');
      const info = service.getServiceInfo();

      expect(info.isEnabled).toBe(false);
      expect(info.hasApiKey).toBe(false);
    });
  });
});