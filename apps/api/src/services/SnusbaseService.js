const axios = require('axios');

class SnusbaseService {
  constructor() {
    this.apiKey = process.env.SNUSBASE_API_KEY || 'sb99cd2vxyohst65mh98ydz6ud844l'; // Fallback для разработки
    this.baseUrl = 'https://api.snusbase.com'; // Исправлен URL согласно документации
    
    if (!process.env.SNUSBASE_API_KEY) {
      console.warn('⚠️ [Snusbase] SNUSBASE_API_KEY not found in environment variables, using fallback key');
    } else {
      console.log('✅ [Snusbase] Using API key from environment variables');
    }
    
    // Настройка axios instance для Snusbase
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Auth': this.apiKey, // Исправлен заголовок согласно документации
        'Content-Type': 'application/json',
        'User-Agent': 'DataTrace/1.0'
      },
      timeout: 30000 // 30 секунд таймаут
    });
  }

  /**
   * Поиск утечек по домену
   * @param {string} domain - Домен для поиска (например: company.com)
   * @returns {Promise<Object>} Результаты поиска
   */
  async searchByDomain(domain) {
    try {
      console.log(`🌐 [Snusbase] Searching for domain: ${domain}`);
      
      const response = await this.client.post('/data/search', {
        terms: [`@${domain}`],
        types: ['email'],
        wildcard: false
      });

      const data = response.data;
      
      // Согласно документации, results - это объект с группировкой по базам данных
      const resultsObj = data.results || {};
      
      // Преобразуем объект в массив для удобства
      const allResults = [];
      Object.keys(resultsObj).forEach(dbName => {
        const dbResults = resultsObj[dbName];
        if (Array.isArray(dbResults)) {
          dbResults.forEach(record => {
            allResults.push({
              ...record,
              database: dbName
            });
          });
        }
      });
      
      console.log(`✅ [Snusbase] Found ${allResults.length} results for domain ${domain} across ${Object.keys(resultsObj).length} databases`);
      
      return {
        success: true,
        domain: domain,
        totalResults: allResults.length,
        results: allResults,
        databases: this.groupByDatabase(allResults),
        rawResults: resultsObj, // Сохраняем оригинальные данные
        metadata: {
          searchedAt: new Date().toISOString(),
          source: 'snusbase',
          took: data.took,
          size: data.size
        }
      };

    } catch (error) {
      console.error('❌ [Snusbase] Search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        domain: domain,
        totalResults: 0,
        results: []
      };
    }
  }

  /**
   * Получение статистики по домену
   * @param {string} domain - Домен для анализа
   * @returns {Promise<Object>} Статистика
   */
  async getDomainStats(domain) {
    try {
      console.log(`📊 [Snusbase] Getting stats for domain: ${domain}`);
      
      // Согласно документации, /data/stats это GET запрос без параметров
      const response = await this.client.get('/data/stats');

      const data = response.data;
      console.log(`✅ [Snusbase] Got general stats`);
      
      return {
        success: true,
        domain: domain,
        stats: data,
        metadata: {
          searchedAt: new Date().toISOString(),
          source: 'snusbase'
        }
      };

    } catch (error) {
      console.error('❌ [Snusbase] Stats error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        domain: domain
      };
    }
  }

  /**
   * Получение списка доступных баз данных
   * @returns {Promise<Object>} Список баз данных
   */
  async getDatabases() {
    try {
      console.log('📋 [Snusbase] Getting available databases');
      
      // Согласно документации, это GET /data/stats
      const response = await this.client.get('/data/stats');

      const data = response.data;
      console.log(`✅ [Snusbase] Got database info with ${Object.keys(data.tables || {}).length} tables`);
      
      return {
        success: true,
        databases: data.tables || {},
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'snusbase',
          totalRows: data.rows,
          features: data.features
        }
      };

    } catch (error) {
      console.error('❌ [Snusbase] Databases error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Группировка результатов по базам данных
   * @param {Array} results - Результаты поиска
   * @returns {Object} Сгруппированные результаты
   */
  groupByDatabase(results) {
    // Проверяем что results это массив
    if (!Array.isArray(results)) {
      console.warn('⚠️ [Snusbase] groupByDatabase: expected array, got:', typeof results);
      return {};
    }
    
    const grouped = {};
    
    results.forEach(result => {
      const dbName = result.database || 'Unknown Database';
      if (!grouped[dbName]) {
        grouped[dbName] = {
          name: dbName,
          count: 0,
          records: []
        };
      }
      grouped[dbName].count++;
      grouped[dbName].records.push(result);
    });

    return grouped;
  }

  /**
   * Анализ результатов поиска по домену
   * @param {Array} results - Результаты поиска
   * @returns {Object} Анализ данных
   */
  analyzeResults(results) {
    // Проверяем что results это массив
    if (!Array.isArray(results)) {
      console.warn('⚠️ [Snusbase] analyzeResults: expected array, got:', typeof results);
      results = [];
    }
    
    const analysis = {
      totalRecords: results.length,
      uniqueDatabases: new Set(results.map(r => r.database || 'unknown')).size,
      dataTypes: {
        emails: 0,
        passwords: 0,
        hashes: 0,
        names: 0,
        phones: 0,
        addresses: 0
      },
      riskLevel: 'low'
    };

    results.forEach(record => {
      if (record.email) analysis.dataTypes.emails++;
      if (record.password) analysis.dataTypes.passwords++;
      if (record.hash) analysis.dataTypes.hashes++;
      if (record.name || record.firstName || record.lastName) analysis.dataTypes.names++;
      if (record.phone) analysis.dataTypes.phones++;
      if (record.address || record.city || record.country) analysis.dataTypes.addresses++;
    });

    // Определение уровня риска
    if (analysis.totalRecords > 1000) {
      analysis.riskLevel = 'critical';
    } else if (analysis.totalRecords > 100) {
      analysis.riskLevel = 'high';
    } else if (analysis.totalRecords > 10) {
      analysis.riskLevel = 'medium';
    }

    return analysis;
  }

  /**
   * Форматирование результатов для фронтенда
   * @param {Object} searchResults - Результаты поиска
   * @returns {Object} Отформатированные результаты
   */
  formatForFrontend(searchResults) {
    if (!searchResults.success) {
      return searchResults;
    }

    const analysis = this.analyzeResults(searchResults.results);
    
    return {
      ...searchResults,
      analysis: analysis,
      databases: searchResults.databases,
      summary: {
        totalRecords: analysis.totalRecords,
        databaseCount: analysis.uniqueDatabases,
        riskLevel: analysis.riskLevel,
        hasPasswords: analysis.dataTypes.passwords > 0,
        hasPersonalData: analysis.dataTypes.names > 0 || analysis.dataTypes.phones > 0
      }
    };
  }

  /**
   * Тестирование подключения к Snusbase API
   * @returns {Promise<Object>} Результат теста
   */
  async testConnection() {
    try {
      console.log('🔍 [Snusbase] Testing API connection...');
      
      // Простой запрос для тестирования
      const response = await this.client.get('/data/stats');
      
      console.log('✅ [Snusbase] Connection test successful');
      return {
        success: true,
        message: 'Connection successful',
        rows: response.data.rows,
        tablesCount: Object.keys(response.data.tables || {}).length
      };
      
    } catch (error) {
      console.error('❌ [Snusbase] Connection test failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  }
}

module.exports = SnusbaseService;
