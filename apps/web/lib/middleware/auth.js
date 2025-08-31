const AuthService = require('../services/AuthService');
const ErrorHandler = require('../utils/ErrorHandler');

const authService = new AuthService();

// Middleware для проверки аутентификации
const requireAuth = async (req, res, next) => {
  try {
    if (!authService.isAvailable()) {
      // Если аутентификация отключена, пропускаем проверку
      console.warn('Authentication service not available, skipping auth check');
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'UnauthorizedError', message: 'Missing or invalid authorization header' },
        req
      );
      return res.status(statusCode).json(response);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is expired (basic check)
    if (authService.isTokenExpired(token)) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'UnauthorizedError', message: 'Token expired' },
        req
      );
      return res.status(statusCode).json(response);
    }

    // Verify token with Supabase
    const userResult = await authService.getUser(token);
    
    if (!userResult.ok || !userResult.user) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'UnauthorizedError', message: 'Invalid token' },
        req
      );
      return res.status(statusCode).json(response);
    }

    // Add user to request object
    req.user = userResult.user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
};

// Middleware для опциональной аутентификации (не требует токен, но проверяет если есть)
const optionalAuth = async (req, res, next) => {
  try {
    if (!authService.isAvailable()) {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Нет токена - продолжаем без пользователя
      return next();
    }

    const token = authHeader.substring(7);

    // Check if token is expired
    if (authService.isTokenExpired(token)) {
      // Токен истек - продолжаем без пользователя
      return next();
    }

    // Try to verify token
    const userResult = await authService.getUser(token);
    
    if (userResult.ok && userResult.user) {
      req.user = userResult.user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // В случае ошибки просто продолжаем без пользователя
    next();
  }
};

// Middleware для проверки роли администратора
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'UnauthorizedError', message: 'Authentication required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    // Check if user has admin role
    const userRole = req.user.user_metadata?.role || req.user.app_metadata?.role;
    
    if (userRole !== 'admin') {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'ForbiddenError', message: 'Admin access required' },
        req
      );
      return res.status(statusCode).json(response);
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    const { statusCode, response } = ErrorHandler.formatErrorResponse(error, req);
    res.status(statusCode).json(response);
  }
};

// Middleware для rate limiting по пользователю
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      requests.set(key, timestamps.filter(time => time > windowStart));
      if (requests.get(key).length === 0) {
        requests.delete(key);
      }
    }

    // Check current user's requests
    const userRequests = requests.get(userId) || [];
    
    if (userRequests.length >= maxRequests) {
      const { statusCode, response } = ErrorHandler.formatErrorResponse(
        { name: 'TooManyRequestsError', message: 'Rate limit exceeded' },
        req
      );
      return res.status(429).json(response);
    }

    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  userRateLimit,
  authService
};