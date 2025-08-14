const { supabaseClient, supabaseAdmin, isConfigured } = require('../config/supabase');
const ErrorHandler = require('../utils/ErrorHandler');

class AuthService {
  constructor() {
    this.client = supabaseClient;
    this.admin = supabaseAdmin;
    this.isEnabled = isConfigured;
  }

  isAvailable() {
    return this.isEnabled && this.client !== null;
  }

  async signUp(email, password, userData = {}) {
    if (!this.isAvailable()) {
      throw new Error('Authentication service not available');
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        throw error;
      }

      return {
        ok: true,
        user: data.user,
        session: data.session,
        message: data.user?.email_confirmed_at 
          ? 'Пользователь успешно зарегистрирован' 
          : 'Проверьте email для подтверждения регистрации'
      };
    } catch (error) {
      console.error('SignUp error:', error);
      return {
        ok: false,
        error: this.formatAuthError(error)
      };
    }
  }

  async signIn(email, password) {
    if (!this.isAvailable()) {
      throw new Error('Authentication service not available');
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return {
        ok: true,
        user: data.user,
        session: data.session,
        message: 'Успешный вход в систему'
      };
    } catch (error) {
      console.error('SignIn error:', error);
      return {
        ok: false,
        error: this.formatAuthError(error)
      };
    }
  }

  async signOut() {
    if (!this.isAvailable()) {
      throw new Error('Authentication service not available');
    }

    try {
      const { error } = await this.client.auth.signOut();

      if (error) {
        throw error;
      }

      return {
        ok: true,
        message: 'Успешный выход из системы'
      };
    } catch (error) {
      console.error('SignOut error:', error);
      return {
        ok: false,
        error: this.formatAuthError(error)
      };
    }
  }

  async getSession() {
    if (!this.isAvailable()) {
      return { ok: false, session: null, user: null };
    }

    try {
      const { data, error } = await this.client.auth.getSession();

      if (error) {
        throw error;
      }

      return {
        ok: true,
        session: data.session,
        user: data.session?.user || null
      };
    } catch (error) {
      console.error('GetSession error:', error);
      return {
        ok: false,
        session: null,
        user: null,
        error: this.formatAuthError(error)
      };
    }
  }

  async getUser(accessToken) {
    if (!this.isAvailable()) {
      return { ok: false, user: null };
    }

    try {
      const { data, error } = await this.client.auth.getUser(accessToken);

      if (error) {
        throw error;
      }

      return {
        ok: true,
        user: data.user
      };
    } catch (error) {
      console.error('GetUser error:', error);
      return {
        ok: false,
        user: null,
        error: this.formatAuthError(error)
      };
    }
  }

  async refreshSession(refreshToken) {
    if (!this.isAvailable()) {
      throw new Error('Authentication service not available');
    }

    try {
      const { data, error } = await this.client.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        throw error;
      }

      return {
        ok: true,
        session: data.session,
        user: data.user
      };
    } catch (error) {
      console.error('RefreshSession error:', error);
      return {
        ok: false,
        error: this.formatAuthError(error)
      };
    }
  }

  async resetPassword(email) {
    if (!this.isAvailable()) {
      throw new Error('Authentication service not available');
    }

    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
      });

      if (error) {
        throw error;
      }

      return {
        ok: true,
        message: 'Инструкции по сбросу пароля отправлены на email'
      };
    } catch (error) {
      console.error('ResetPassword error:', error);
      return {
        ok: false,
        error: this.formatAuthError(error)
      };
    }
  }

  async updatePassword(accessToken, newPassword) {
    if (!this.isAvailable()) {
      throw new Error('Authentication service not available');
    }

    try {
      // Set the session first
      await this.client.auth.setSession({
        access_token: accessToken,
        refresh_token: '' // Will be handled by Supabase
      });

      const { error } = await this.client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return {
        ok: true,
        message: 'Пароль успешно обновлен'
      };
    } catch (error) {
      console.error('UpdatePassword error:', error);
      return {
        ok: false,
        error: this.formatAuthError(error)
      };
    }
  }

  // Admin functions
  async getUserById(userId) {
    if (!this.admin) {
      throw new Error('Admin client not available');
    }

    try {
      const { data, error } = await this.admin.auth.admin.getUserById(userId);

      if (error) {
        throw error;
      }

      return {
        ok: true,
        user: data.user
      };
    } catch (error) {
      console.error('GetUserById error:', error);
      return {
        ok: false,
        error: this.formatAuthError(error)
      };
    }
  }

  async listUsers(page = 1, perPage = 50) {
    if (!this.admin) {
      throw new Error('Admin client not available');
    }

    try {
      const { data, error } = await this.admin.auth.admin.listUsers({
        page,
        perPage
      });

      if (error) {
        throw error;
      }

      return {
        ok: true,
        users: data.users,
        total: data.total
      };
    } catch (error) {
      console.error('ListUsers error:', error);
      return {
        ok: false,
        error: this.formatAuthError(error)
      };
    }
  }

  formatAuthError(error) {
    const errorMessages = {
      'Invalid login credentials': 'Неверный email или пароль',
      'Email not confirmed': 'Email не подтвержден',
      'User not found': 'Пользователь не найден',
      'Password should be at least 6 characters': 'Пароль должен содержать минимум 6 символов',
      'User already registered': 'Пользователь уже зарегистрирован',
      'Invalid email': 'Некорректный email адрес',
      'Signup is disabled': 'Регистрация отключена',
      'Email rate limit exceeded': 'Превышен лимит отправки email',
      'Token has expired or is invalid': 'Токен истек или недействителен'
    };

    const message = errorMessages[error.message] || error.message || 'Ошибка аутентификации';

    return {
      code: error.status || error.code || 'AUTH_ERROR',
      message,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }

  // Utility method to extract user from JWT token
  extractUserFromToken(token) {
    if (!token) return null;

    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/, '');
      
      // Decode JWT payload (basic decode, not verification)
      const payload = JSON.parse(
        Buffer.from(cleanToken.split('.')[1], 'base64').toString()
      );

      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        exp: payload.exp
      };
    } catch (error) {
      console.error('Token extraction error:', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token) {
    const user = this.extractUserFromToken(token);
    if (!user || !user.exp) return true;

    return Date.now() >= user.exp * 1000;
  }
}

module.exports = AuthService;