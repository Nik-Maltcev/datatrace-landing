const request = require('supertest');
const express = require('express');
const AuthService = require('../../src/services/AuthService');
const { requireAuth, optionalAuth } = require('../../src/middleware/auth');

// Mock AuthService
jest.mock('../../src/services/AuthService');

describe('Authentication Integration Tests', () => {
  let app;
  let mockAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    
    // Mock AuthService instance
    mockAuthService = {
      isAvailable: jest.fn().mockReturnValue(true),
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      extractUserFromToken: jest.fn(),
      isTokenExpired: jest.fn()
    };
    
    AuthService.mockImplementation(() => mockAuthService);
    
    // Add auth routes
    app.post('/api/auth/signup', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = await mockAuthService.signUp(email, password);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/api/auth/signin', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = await mockAuthService.signIn(email, password);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.get('/api/protected', requireAuth, (req, res) => {
      res.json({ message: 'Protected resource', user: req.user });
    });
    
    app.get('/api/optional', optionalAuth, (req, res) => {
      res.json({ message: 'Optional auth resource', user: req.user || null });
    });
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully register a new user', async () => {
      const mockResult = {
        ok: true,
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token123' },
        message: 'User registered successfully'
      };
      
      mockAuthService.signUp.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
      expect(mockAuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should handle signup errors', async () => {
      mockAuthService.signUp.mockResolvedValue({
        ok: false,
        error: { message: 'User already exists' }
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(false);
      expect(response.body.error.message).toBe('User already exists');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should successfully sign in user', async () => {
      const mockResult = {
        ok: true,
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token123' },
        message: 'Sign in successful'
      };
      
      mockAuthService.signIn.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
      expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should handle invalid credentials', async () => {
      mockAuthService.signIn.mockResolvedValue({
        ok: false,
        error: { message: 'Invalid credentials' }
      });

      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      // Mock token validation
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getUser.mockResolvedValue({
        ok: true,
        user: { id: '123', email: 'test@example.com' }
      });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Protected resource');
      expect(response.body.user).toBeDefined();
    });

    it('should reject protected route without token', async () => {
      const response = await request(app)
        .get('/api/protected');

      expect(response.status).toBe(401);
    });

    it('should reject protected route with expired token', async () => {
      mockAuthService.isTokenExpired.mockReturnValue(true);

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer expired-token');

      expect(response.status).toBe(401);
    });

    it('should reject protected route with invalid token', async () => {
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getUser.mockResolvedValue({
        ok: false,
        user: null
      });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Optional Auth Routes', () => {
    it('should access optional auth route with valid token', async () => {
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getUser.mockResolvedValue({
        ok: true,
        user: { id: '123', email: 'test@example.com' }
      });

      const response = await request(app)
        .get('/api/optional')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Optional auth resource');
      expect(response.body.user).toBeDefined();
    });

    it('should access optional auth route without token', async () => {
      const response = await request(app)
        .get('/api/optional');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Optional auth resource');
      expect(response.body.user).toBeNull();
    });

    it('should access optional auth route with invalid token', async () => {
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getUser.mockResolvedValue({
        ok: false,
        user: null
      });

      const response = await request(app)
        .get('/api/optional')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Optional auth resource');
      expect(response.body.user).toBeNull();
    });
  });
});