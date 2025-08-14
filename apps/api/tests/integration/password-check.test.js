const request = require('supertest');
const express = require('express');
const DeHashedService = require('../../src/services/DeHashedService');

// Mock DeHashedService
jest.mock('../../src/services/DeHashedService');

describe('Password Check Integration Tests', () => {
  let app;
  let mockDeHashedService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    
    // Mock DeHashedService instance
    mockDeHashedService = {
      isAvailable: jest.fn().mockReturnValue(true),
      checkPassword: jest.fn(),
      searchByField: jest.fn(),
      getServiceInfo: jest.fn()
    };
    
    DeHashedService.mockImplementation(() => mockDeHashedService);
    
    // Add password check routes
    app.post('/api/password-check', async (req, res) => {
      try {
        const { password } = req.body;

        if (!password || typeof password !== 'string') {
          return res.status(400).json({
            ok: false,
            error: { message: 'Password is required' }
          });
        }

        if (password.length < 1 || password.length > 200) {
          return res.status(400).json({
            ok: false,
            error: { message: 'Password length must be between 1 and 200 characters' }
          });
        }

        if (!mockDeHashedService.isAvailable()) {
          return res.json({
            ok: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Password check service temporarily unavailable'
            }
          });
        }

        const result = await mockDeHashedService.checkPassword(password);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          ok: false,
          error: { message: 'Error checking password. Please try again later.' }
        });
      }
    });

    app.get('/api/dehashed-info', (req, res) => {
      try {
        const info = mockDeHashedService.getServiceInfo();
        res.json({
          ok: true,
          service: info
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  describe('POST /api/password-check', () => {
    it('should successfully check a compromised password', async () => {
      const mockResult = {
        ok: true,
        isCompromised: true,
        breachCount: 2,
        breaches: [
          {
            name: 'Database1',
            date: '2023-01-01',
            description: 'Test breach',
            dataTypes: ['Email', 'Password']
          }
        ],
        recommendations: [
          '🚨 КРИТИЧНО: Этот пароль найден в утечках данных!',
          'Немедленно смените пароль на всех аккаунтах где он используется'
        ],
        passwordStrength: {
          length: 8,
          level: 'Weak',
          score: 2
        }
      };
      
      mockDeHashedService.checkPassword.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/password-check')
        .send({ password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.isCompromised).toBe(true);
      expect(response.body.breachCount).toBe(2);
      expect(response.body.breaches).toHaveLength(1);
      expect(response.body.recommendations).toContain('🚨 КРИТИЧНО: Этот пароль найден в утечках данных!');
      expect(mockDeHashedService.checkPassword).toHaveBeenCalledWith('password123');
    });

    it('should successfully check a safe password', async () => {
      const mockResult = {
        ok: true,
        isCompromised: false,
        breachCount: 0,
        breaches: [],
        recommendations: [
          '✅ Пароль не найден в известных утечках данных',
          'Продолжайте использовать уникальные пароли для каждого сервиса'
        ],
        passwordStrength: {
          length: 16,
          level: 'Strong',
          score: 6
        }
      };
      
      mockDeHashedService.checkPassword.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/password-check')
        .send({ password: 'StrongP@ssw0rd123!' });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.isCompromised).toBe(false);
      expect(response.body.breachCount).toBe(0);
      expect(response.body.breaches).toHaveLength(0);
      expect(response.body.recommendations).toContain('✅ Пароль не найден в известных утечках данных');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/password-check')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.error.message).toBe('Password is required');
    });

    it('should return 400 for non-string password', async () => {
      const response = await request(app)
        .post('/api/password-check')
        .send({ password: 123 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.error.message).toBe('Password is required');
    });

    it('should return 400 for empty password', async () => {
      const response = await request(app)
        .post('/api/password-check')
        .send({ password: '' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.error.message).toBe('Password length must be between 1 and 200 characters');
    });

    it('should return 400 for too long password', async () => {
      const longPassword = 'a'.repeat(201);
      
      const response = await request(app)
        .post('/api/password-check')
        .send({ password: longPassword });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.error.message).toBe('Password length must be between 1 and 200 characters');
    });

    it('should handle service unavailable', async () => {
      mockDeHashedService.isAvailable.mockReturnValue(false);

      const response = await request(app)
        .post('/api/password-check')
        .send({ password: 'testpassword' });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(response.body.error.message).toBe('Password check service temporarily unavailable');
    });

    it('should handle service errors gracefully', async () => {
      mockDeHashedService.checkPassword.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/api/password-check')
        .send({ password: 'testpassword' });

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
      expect(response.body.error.message).toBe('Error checking password. Please try again later.');
    });
  });

  describe('GET /api/dehashed-info', () => {
    it('should return service information', async () => {
      const mockInfo = {
        isEnabled: true,
        baseUrl: 'https://api.dehashed.com',
        hasApiKey: true,
        version: '1.0.0'
      };
      
      mockDeHashedService.getServiceInfo.mockReturnValue(mockInfo);

      const response = await request(app)
        .get('/api/dehashed-info');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.service).toEqual(mockInfo);
      expect(mockDeHashedService.getServiceInfo).toHaveBeenCalled();
    });

    it('should handle service info errors', async () => {
      mockDeHashedService.getServiceInfo.mockImplementation(() => {
        throw new Error('Service info error');
      });

      const response = await request(app)
        .get('/api/dehashed-info');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Service info error');
    });
  });
});