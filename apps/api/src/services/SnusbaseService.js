const fetch = require('node-fetch');

class SnusbaseService {
  constructor() {
    this.apiKey = 'sb99cd2vxyohst65mh98ydz6ud844l';
    this.baseUrl = 'https://api-experimental.snusbase.com';
  }

  /**
   * Поиск утечек по домену
   * @param {string} domain - Домен для поиска (например: company.com)
   * @returns {Promise<Object>} Результаты поиска
   */
  async searchByDomain(domain) {
    try {
      console.log(`🌐 [Snusbase] Searching for domain: ${domain}`);
      
      const response = await fetch(`${this.baseUrl}/data/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'DataTrace/1.0'
        },
        body: JSON.stringify({
          terms: [`@${domain}`],
          types: ['email'],
          wildcard: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Snusbase] API error:', response.status, errorText);
        throw new Error(`Snusbase API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ [Snusbase] Found ${data.results?.length || 0} results for domain ${domain}`);
      
      return {
        success: true,
        domain: domain,
        totalResults: data.results?.length || 0,
        results: data.results || [],
        databases: this.groupByDatabase(data.results || []),
        metadata: {
          searchedAt: new Date().toISOString(),
          source: 'snusbase'
        }
      };

    } catch (error) {
      console.error('❌ [Snusbase] Search error:', error);
      return {
        success: false,
        error: error.message,
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
      
      const response = await fetch(`${this.baseUrl}/tools/stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'DataTrace/1.0'
        },
        body: JSON.stringify({
          terms: [`@${domain}`],
          types: ['email']
        })
      });

      if (!response.ok) {
        throw new Error(`Stats API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [Snusbase] Got stats for domain ${domain}`);
      
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
      console.error('❌ [Snusbase] Stats error:', error);
      return {
        success: false,
        error: error.message,
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
      
      const response = await fetch(`${this.baseUrl}/data/sources`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'DataTrace/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Sources API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [Snusbase] Got ${data.length} databases`);
      
      return {
        success: true,
        databases: data,
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'snusbase'
        }
      };

    } catch (error) {
      console.error('❌ [Snusbase] Databases error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Группировка результатов по базам данных
   * @param {Array} results - Результаты поиска
   * @returns {Object} Сгруппированные результаты
   */
  groupByDatabase(results) {
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
    const analysis = {
      totalRecords: results.length,
      uniqueDatabases: new Set(results.map(r => r.database)).size,
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
}

module.exports = SnusbaseService;
