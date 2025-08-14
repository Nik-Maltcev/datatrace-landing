const AuthService = require('../../src/services/AuthService');

// Mock Supabase config
jest.mock('../../src/config/supabase', () => ({
  supabaseClient: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      setSession: jest.fn()
    }
  },
  supabaseAdmin: {
    auth: {
      admin: {
        getUserById: jest.fn(),
        listUsers: jest.fn()
      }
    }
  },
  isConfigured: true
}));

describe('AuthService', () => {
  let authService;
  let mockSupabaseClient;
  let mockSupabaseAdmin;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    mockSupabaseClient = require('../../src/config/supabase').supabaseClient;
    mockSupabaseAdmin = require('../../src/config/supabase').supabaseAdmin;
  });

  describe('constructor', () => {
    it('should initialize when configured', () => {
      expect(authService.isAvailable()).toBe(true);
    });
  });

  describe('signUp', () => {
    it('should successfully sign up user', async () => {
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@example.com', email_confirmed_at: new Date() },
          session: { access_token: 'token123' }
        },
        error: null
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockResponse);

      const result = await authService.signUp('test@example.com', 'password123');

      expect(result.ok).toBe(true);
      expect(result.user.email).toBe('test@example.com');
      expect(result.session.access_token).toBe('token123');
      expect(result.message).toContain('успешно зарегистрирован');
    });

    it('should handle signup error', async () => {
      const mockResponse = {
        data: null,
        error: { message: 'User already registered' }
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockResponse);

      const result = await authService.signUp('test@example.com', 'password123');

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Пользователь уже зарегистрирован');
    });

    it('should handle service unavailable', async () => {
      const unavailableService = new AuthService();
      unavailableService.isEnabled = false;

      await expect(unavailableService.signUp('test@example.com', 'password123'))
        .rejects.toThrow('Authentication service not available');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in user', async () => {
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'token123' }
        },
        error: null
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockResponse);

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.ok).toBe(true);
      expect(result.user.email).toBe('test@example.com');
      expect(result.message).toContain('Успешный вход');
    });

    it('should handle invalid credentials', async () => {
      const mockResponse = {
        data: null,
        error: { message: 'Invalid login credentials' }
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockResponse);

      const result = await authService.signIn('test@example.com', 'wrongpassword');

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Неверный email или пароль');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      const result = await authService.signOut();

      expect(result.ok).toBe(true);
      expect(result.message).toContain('Успешный выход');
    });

    it('should handle signout error', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ 
        error: { message: 'Signout failed' } 
      });

      const result = await authService.signOut();

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Signout failed');
    });
  });

  describe('getSession', () => {
    it('should return valid session', async () => {
      const mockResponse = {
        data: {
          session: { 
            access_token: 'token123',
            user: { id: '123', email: 'test@example.com' }
          }
        },
        error: null
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue(mockResponse);

      const result = await authService.getSession();

      expect(result.ok).toBe(true);
      expect(result.session.access_token).toBe('token123');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should handle no session', async () => {
      const mockResponse = {
        data: { session: null },
        error: null
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue(mockResponse);

      const result = await authService.getSession();

      expect(result.ok).toBe(true);
      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
    });
  });

  describe('extractUserFromToken', () => {
    it('should extract user from valid JWT token', () => {
      // Create a mock JWT token (header.payload.signature)
      const payload = {
        sub: '123',
        email: 'test@example.com',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const mockToken = `header.${encodedPayload}.signature`;

      const user = authService.extractUserFromToken(mockToken);

      expect(user.id).toBe('123');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('authenticated');
    });

    it('should handle Bearer prefix', () => {
      const payload = { sub: '123', email: 'test@example.com', exp: Math.floor(Date.now() / 1000) + 3600 };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const mockToken = `Bearer header.${encodedPayload}.signature`;

      const user = authService.extractUserFromToken(mockToken);

      expect(user.id).toBe('123');
      expect(user.email).toBe('test@example.com');
    });

    it('should return null for invalid token', () => {
      const user = authService.extractUserFromToken('invalid.token');
      expect(user).toBeNull();
    });

    it('should return null for null token', () => {
      const user = authService.extractUserFromToken(null);
      expect(user).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should detect expired token', () => {
      const payload = {
        sub: '123',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const mockToken = `header.${encodedPayload}.signature`;

      const isExpired = authService.isTokenExpired(mockToken);
      expect(isExpired).toBe(true);
    });

    it('should detect valid token', () => {
      const payload = {
        sub: '123',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const mockToken = `header.${encodedPayload}.signature`;

      const isExpired = authService.isTokenExpired(mockToken);
      expect(isExpired).toBe(false);
    });

    it('should return true for invalid token', () => {
      const isExpired = authService.isTokenExpired('invalid');
      expect(isExpired).toBe(true);
    });
  });

  describe('formatAuthError', () => {
    it('should format known error messages', () => {
      const error = { message: 'Invalid login credentials' };
      const formatted = authService.formatAuthError(error);

      expect(formatted.message).toBe('Неверный email или пароль');
      expect(formatted.code).toBe('AUTH_ERROR');
    });

    it('should format unknown error messages', () => {
      const error = { message: 'Unknown error', status: 500 };
      const formatted = authService.formatAuthError(error);

      expect(formatted.message).toBe('Unknown error');
      expect(formatted.code).toBe(500);
    });

    it('should handle error without message', () => {
      const error = {};
      const formatted = authService.formatAuthError(error);

      expect(formatted.message).toBe('Ошибка аутентификации');
      expect(formatted.code).toBe('AUTH_ERROR');
    });
  });
});