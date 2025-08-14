/**
 * Performance Tests
 * 
 * These tests validate performance characteristics and resource usage
 */

const OpenAIService = require('../../src/services/OpenAIService');
const AuthService = require('../../src/services/AuthService');
const DeHashedService = require('../../src/services/DeHashedService');
const ErrorHandler = require('../../src/utils/ErrorHandler');

describe('Performance Tests', () => {

  describe('Service Initialization Performance', () => {
    it('should initialize OpenAI service quickly', () => {
      const startTime = process.hrtime.bigint();
      
      const service = new OpenAIService('test-key', 'gpt-4');
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(service.isAvailable()).toBe(true);
      expect(durationMs).toBeLessThan(10); // Should initialize in less than 10ms
    });

    it('should initialize Auth service quickly', () => {
      const startTime = process.hrtime.bigint();
      
      const service = new AuthService();
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(durationMs).toBeLessThan(10); // Should initialize in less than 10ms
    });

    it('should initialize DeHashed service quickly', () => {
      const startTime = process.hrtime.bigint();
      
      const service = new DeHashedService('test-key');
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(service.isAvailable()).toBe(true);
      expect(durationMs).toBeLessThan(10); // Should initialize in less than 10ms
    });
  });

  describe('Token Processing Performance', () => {
    let authService;

    beforeEach(() => {
      authService = new AuthService();
    });

    it('should extract user from token quickly', () => {
      const payload = {
        sub: '123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const token = `header.${encodedPayload}.signature`;

      const startTime = process.hrtime.bigint();
      
      const user = authService.extractUserFromToken(token);
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(user).toBeDefined();
      expect(durationMs).toBeLessThan(5); // Should process in less than 5ms
    });

    it('should check token expiration quickly', () => {
      const payload = {
        sub: '123',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const token = `header.${encodedPayload}.signature`;

      const startTime = process.hrtime.bigint();
      
      const isExpired = authService.isTokenExpired(token);
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(typeof isExpired).toBe('boolean');
      expect(durationMs).toBeLessThan(5); // Should process in less than 5ms
    });

    it('should handle multiple token operations efficiently', () => {
      const tokens = [];
      
      // Generate test tokens
      for (let i = 0; i < 100; i++) {
        const payload = {
          sub: `user${i}`,
          email: `user${i}@example.com`,
          exp: Math.floor(Date.now() / 1000) + 3600
        };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
        tokens.push(`header.${encodedPayload}.signature`);
      }

      const startTime = process.hrtime.bigint();
      
      // Process all tokens
      const results = tokens.map(token => ({
        user: authService.extractUserFromToken(token),
        expired: authService.isTokenExpired(token)
      }));
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(results).toHaveLength(100);
      expect(results.every(r => r.user && !r.expired)).toBe(true);
      expect(durationMs).toBeLessThan(50); // Should process 100 tokens in less than 50ms
    });
  });

  describe('Password Analysis Performance', () => {
    let dehashedService;

    beforeEach(() => {
      dehashedService = new DeHashedService('test-key');
    });

    it('should analyze password strength quickly', () => {
      const passwords = [
        'weak',
        'StrongPassword123!',
        'medium_password',
        'VeryLongAndComplexPasswordWithManyCharacters123!@#',
        '12345678',
        'P@ssw0rd'
      ];

      const startTime = process.hrtime.bigint();
      
      const analyses = passwords.map(pwd => 
        dehashedService.analyzePasswordStrength(pwd)
      );
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(analyses).toHaveLength(passwords.length);
      expect(analyses.every(a => typeof a.score === 'number')).toBe(true);
      expect(durationMs).toBeLessThan(10); // Should analyze all passwords in less than 10ms
    });

    it('should generate recommendations quickly', () => {
      const testCases = [
        { compromised: true, count: 1 },
        { compromised: true, count: 5 },
        { compromised: false, count: 0 }
      ];

      const startTime = process.hrtime.bigint();
      
      const recommendations = testCases.map(tc => 
        dehashedService.generateRecommendations(tc.compromised, tc.count)
      );
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(recommendations).toHaveLength(testCases.length);
      expect(recommendations.every(r => Array.isArray(r) && r.length > 0)).toBe(true);
      expect(durationMs).toBeLessThan(5); // Should generate all recommendations in less than 5ms
    });

    it('should format breach results efficiently', () => {
      // Create test data with many entries
      const entries = [];
      for (let i = 0; i < 1000; i++) {
        entries.push({
          database_name: `Database${i % 10}`,
          obtained_from: '2023-01-01',
          email: `user${i}@example.com`,
          password: `hash${i}`,
          username: `user${i}`
        });
      }

      const startTime = process.hrtime.bigint();
      
      const formatted = dehashedService.formatBreachResults(entries);
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(formatted).toHaveLength(10); // Should group by database name
      expect(durationMs).toBeLessThan(50); // Should format 1000 entries in less than 50ms
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors quickly', () => {
      const errors = [
        { response: { status: 404, data: 'Not found' } },
        { request: {}, code: 'ECONNREFUSED' },
        { code: 'ECONNABORTED', message: 'timeout' },
        { message: 'Generic error' }
      ];

      const startTime = process.hrtime.bigint();
      
      const handled = errors.map(error => 
        ErrorHandler.handleAPIError(error, 'TestAPI')
      );
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(handled).toHaveLength(errors.length);
      expect(handled.every(h => h.ok === false && h.error)).toBe(true);
      expect(durationMs).toBeLessThan(10); // Should handle all errors in less than 10ms
    });

    it('should format error responses quickly', () => {
      const errors = [];
      for (let i = 0; i < 100; i++) {
        errors.push({
          name: `Error${i % 5}`,
          message: `Error message ${i}`
        });
      }

      const startTime = process.hrtime.bigint();
      
      const formatted = errors.map(error => 
        ErrorHandler.formatErrorResponse(error)
      );
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(formatted).toHaveLength(100);
      expect(formatted.every(f => f.statusCode && f.response)).toBe(true);
      expect(durationMs).toBeLessThan(20); // Should format 100 errors in less than 20ms
    });

    it('should generate request IDs efficiently', () => {
      const startTime = process.hrtime.bigint();
      
      const ids = [];
      for (let i = 0; i < 1000; i++) {
        ids.push(ErrorHandler.generateRequestId());
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(ids).toHaveLength(1000);
      expect(new Set(ids).size).toBe(1000); // All unique
      expect(durationMs).toBeLessThan(100); // Should generate 1000 IDs in less than 100ms
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during service operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const openaiService = new OpenAIService('test-key', 'gpt-4');
        const authService = new AuthService();
        const dehashedService = new DeHashedService('test-key');
        
        // Use the services
        openaiService.isAvailable();
        authService.formatAuthError({ message: 'test' });
        dehashedService.analyzePasswordStrength('testpassword');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large data sets without excessive memory usage', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create large data set
      const largeResults = [];
      for (let i = 0; i < 10000; i++) {
        largeResults.push({
          ok: true,
          items: {
            company_names: { short_name: `Company ${i}` },
            address: { line_address: `Address ${i}` },
            status: 'Active'
          }
        });
      }
      
      // Process with fallback
      const openaiService = new OpenAIService('test-key', 'gpt-4');
      const fallback = openaiService.createFallbackResponse(
        { query: '1234567890', results: largeResults },
        'company'
      );
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(fallback).toBeDefined();
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting checks efficiently', () => {
      const { userRateLimit } = require('../../src/middleware/auth');
      const rateLimitMiddleware = userRateLimit(100, 60000);
      
      const startTime = process.hrtime.bigint();
      
      // Simulate many requests
      for (let i = 0; i < 1000; i++) {
        const mockReq = {
          user: { id: `user${i % 10}` }, // 10 different users
          ip: '127.0.0.1'
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const mockNext = jest.fn();
        
        rateLimitMiddleware(mockReq, mockRes, mockNext);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      expect(durationMs).toBeLessThan(100); // Should handle 1000 requests in less than 100ms
    });
  });
});