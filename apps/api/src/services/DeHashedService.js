const axios = require('axios');
const crypto = require('crypto');
const ErrorHandler = require('../utils/ErrorHandler');

class DeHashedService {
  constructor(apiKey, baseUrl = 'https://api.dehashed.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.isEnabled = !!(apiKey && apiKey.trim() !== '');
    
    if (!this.isEnabled) {
      console.warn('⚠️ DeHashed API key not provided. Password checking will be disabled.');
    }
  }

  isAvailable() {
    return this.isEnabled;
  }

  /**
   * Check if a password has been compromised in data breaches
   * @param {string} password - The password to check
   * @returns {Promise<Object>} - Result object with breach information
   */
  async checkPassword(password) {
    if (!this.isAvailable()) {
      throw new Error('DeHashed service not available');
    }

    if (!password || typeof password !== 'string') {
      throw new Error('Password is required and must be a string');
    }

    try {
      // Create SHA-1 hash of the password (common format for breach databases)
      const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      
      // Search by password hash
      const result = await this.searchByHash(sha1Hash);
      
      return {
        ok: true,
        isCompromised: result.found,
        breachCount: result.breachCount,
        breaches: result.breaches,
        recommendations: this.generateRecommendations(result.found, result.breachCount),
        passwordStrength: this.analyzePasswordStrength(password),
        searchHash: sha1Hash.substring(0, 10) + '...' // Show partial hash for reference
      };
    } catch (error) {
      console.error('DeHashed password check error:', error);
      throw error;
    }
  }

  /**
   * Search for breaches by password hash
   * @param {string} hash - SHA-1 hash of the password
   * @returns {Promise<Object>} - Search results
   */
  async searchByHash(hash) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          query: `password:${hash}`,
          size: 100 // Limit results
        },
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`
        },
        timeout: 15000
      });

      const data = response.data;
      
      if (!data) {
        return { found: false, breachCount: 0, breaches: [] };
      }

      const entries = data.entries || [];
      const breaches = this.formatBreachResults(entries);
      
      return {
        found: entries.length > 0,
        breachCount: entries.length,
        breaches: breaches,
        total: data.total || entries.length
      };
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        
        if (status === 401) {
          throw new Error('DeHashed API authentication failed. Check your API key.');
        } else if (status === 429) {
          throw new Error('DeHashed API rate limit exceeded. Please try again later.');
        } else if (status === 403) {
          throw new Error('DeHashed API access forbidden. Check your subscription.');
        } else {
          throw new Error(`DeHashed API error: ${status} ${statusText}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('DeHashed API request timeout');
      } else {
        throw new Error(`DeHashed service error: ${error.message}`);
      }
    }
  }

  /**
   * Search for general information by email, username, etc.
   * @param {string} query - Search query
   * @param {string} field - Field type (email, username, etc.)
   * @returns {Promise<Object>} - Search results
   */
  async searchByField(query, field = 'email') {
    if (!this.isAvailable()) {
      throw new Error('DeHashed service not available');
    }

    try {
      const searchQuery = `${field}:${query}`;
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          query: searchQuery,
          size: 50
        },
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`
        },
        timeout: 15000
      });

      const data = response.data;
      const entries = data.entries || [];
      
      return {
        ok: true,
        found: entries.length > 0,
        total: data.total || entries.length,
        entries: this.formatSearchResults(entries),
        query: searchQuery
      };
    } catch (error) {
      console.error('DeHashed search error:', error);
      return ErrorHandler.handleAPIError(error, 'DeHashed');
    }
  }

  /**
   * Format breach results for password checking
   * @param {Array} entries - Raw entries from DeHashed
   * @returns {Array} - Formatted breach information
   */
  formatBreachResults(entries) {
    const breachMap = new Map();
    
    entries.forEach(entry => {
      const database = entry.database_name || 'Unknown Database';
      const date = entry.obtained_from || entry.date || 'Unknown Date';
      
      if (!breachMap.has(database)) {
        breachMap.set(database, {
          name: database,
          date: date,
          description: this.generateBreachDescription(database),
          dataTypes: new Set(),
          entryCount: 0
        });
      }
      
      const breach = breachMap.get(database);
      breach.entryCount++;
      
      // Track what types of data were exposed
      if (entry.email) breach.dataTypes.add('Email');
      if (entry.username) breach.dataTypes.add('Username');
      if (entry.password) breach.dataTypes.add('Password');
      if (entry.hashed_password) breach.dataTypes.add('Hashed Password');
      if (entry.name) breach.dataTypes.add('Name');
      if (entry.phone) breach.dataTypes.add('Phone');
      if (entry.address) breach.dataTypes.add('Address');
    });
    
    return Array.from(breachMap.values()).map(breach => ({
      ...breach,
      dataTypes: Array.from(breach.dataTypes)
    }));
  }

  /**
   * Format general search results
   * @param {Array} entries - Raw entries from DeHashed
   * @returns {Array} - Formatted search results
   */
  formatSearchResults(entries) {
    return entries.slice(0, 20).map(entry => ({
      database: entry.database_name || 'Unknown',
      email: entry.email || null,
      username: entry.username || null,
      name: entry.name || null,
      phone: entry.phone || null,
      address: entry.address || null,
      hasPassword: !!(entry.password || entry.hashed_password),
      date: entry.obtained_from || entry.date || null
    }));
  }

  /**
   * Generate breach description based on database name
   * @param {string} databaseName - Name of the breached database
   * @returns {string} - Description of the breach
   */
  generateBreachDescription(databaseName) {
    const descriptions = {
      'Collection #1': 'Massive collection of credentials from various breaches',
      'LinkedIn': 'Professional networking platform breach',
      'Adobe': 'Creative software company user data breach',
      'Dropbox': 'Cloud storage service user data breach',
      'MySpace': 'Social networking platform breach',
      'Tumblr': 'Microblogging platform breach',
      'Yahoo': 'Web services company massive data breach',
      'Equifax': 'Credit reporting agency breach',
      'Facebook': 'Social media platform data exposure',
      'Twitter': 'Social media platform data breach'
    };
    
    return descriptions[databaseName] || `Data breach from ${databaseName}`;
  }

  /**
   * Analyze password strength
   * @param {string} password - Password to analyze
   * @returns {Object} - Password strength analysis
   */
  analyzePasswordStrength(password) {
    const analysis = {
      length: password.length,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      score: 0,
      level: 'Very Weak'
    };
    
    // Calculate strength score
    if (analysis.length >= 8) analysis.score += 1;
    if (analysis.length >= 12) analysis.score += 1;
    if (analysis.hasLowercase) analysis.score += 1;
    if (analysis.hasUppercase) analysis.score += 1;
    if (analysis.hasNumbers) analysis.score += 1;
    if (analysis.hasSpecialChars) analysis.score += 1;
    
    // Determine strength level
    if (analysis.score >= 5) analysis.level = 'Strong';
    else if (analysis.score >= 4) analysis.level = 'Good';
    else if (analysis.score >= 3) analysis.level = 'Fair';
    else if (analysis.score >= 2) analysis.level = 'Weak';
    
    return analysis;
  }

  /**
   * Generate security recommendations based on breach findings
   * @param {boolean} isCompromised - Whether password was found in breaches
   * @param {number} breachCount - Number of breaches found
   * @returns {Array} - Array of recommendation strings
   */
  generateRecommendations(isCompromised, breachCount) {
    const recommendations = [];
    
    if (isCompromised) {
      recommendations.push('🚨 КРИТИЧНО: Этот пароль найден в утечках данных!');
      recommendations.push('Немедленно смените пароль на всех аккаунтах где он используется');
      
      if (breachCount > 1) {
        recommendations.push(`Пароль найден в ${breachCount} различных утечках`);
      }
      
      recommendations.push('Включите двухфакторную аутентификацию на важных аккаунтах');
      recommendations.push('Используйте уникальные пароли для каждого сервиса');
    } else {
      recommendations.push('✅ Пароль не найден в известных утечках данных');
      recommendations.push('Продолжайте использовать уникальные пароли для каждого сервиса');
      recommendations.push('Регулярно проверяйте свои пароли на компрометацию');
    }
    
    recommendations.push('Рекомендуется использовать менеджер паролей');
    recommendations.push('Создавайте пароли длиной не менее 12 символов');
    
    return recommendations;
  }

  /**
   * Get service statistics and health
   * @returns {Object} - Service status information
   */
  getServiceInfo() {
    return {
      isEnabled: this.isEnabled,
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      version: '1.0.0'
    };
  }
}

module.exports = DeHashedService;