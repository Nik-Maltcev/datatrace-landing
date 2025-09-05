/**
 * Утилита для нормализации данных из источника ITP
 * Обрабатывает все типы полей согласно спецификации
 */

class ITPNormalizer {
  
  /**
   * Нормализация телефонного номера
   * @param {string} phone - Исходный номер телефона
   * @returns {string} Нормализованный номер
   */
  static normalizePhone(phone) {
    if (!phone) return null;
    
    // Удаляем все символы кроме цифр
    const digits = phone.toString().replace(/\D/g, '');
    
    // Если номер начинается с 8, заменяем на 7
    if (digits.startsWith('8') && digits.length === 11) {
      return '+7' + digits.substring(1);
    }
    
    // Если номер начинается с 7 и имеет 11 цифр
    if (digits.startsWith('7') && digits.length === 11) {
      return '+' + digits;
    }
    
    // Если номер имеет 10 цифр, добавляем +7
    if (digits.length === 10) {
      return '+7' + digits;
    }
    
    // Для других форматов возвращаем как есть с +
    return digits.startsWith('+') ? phone : '+' + digits;
  }

  /**
   * Нормализация имени
   * @param {string} name - Исходное имя
   * @returns {string} Нормализованное имя
   */
  static normalizeName(name) {
    if (!name) return null;
    
    return name.toString()
      .trim()
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Основная функция нормализации записи ITP
   * @param {Object} record - Исходная запись из ITP
   * @returns {Object} Нормализованная запись
   */
  static normalizeRecord(record) {
    if (!record) return null;

    const normalized = {
      // Основная информация
      dataProvider: record.data_provider || null,
      dbName: record.db_name || record.source_database || 'Неизвестно',
      name: this.normalizeName(record.name),
      phone: this.normalizePhone(record.phone),
      email: record.email || null,
      address: record.address || null,
      
      // Аккаунты
      login: record.login || null,
      password: record.password || null,
      userId: record.id || null,
      
      // Оригинальные данные для отладки
      _original: record
    };

    // Убираем null значения для чистоты
    Object.keys(normalized).forEach(key => {
      if (normalized[key] === null && key !== '_original') {
        delete normalized[key];
      }
    });

    return normalized;
  }

  /**
   * Нормализация данных ITP (объект с базами данных)
   * @param {Object} rawData - Объект где ключи = названия БД, значения = { data: [...] }
   * @returns {Array} Нормализованные записи
   */
  static normalizeRecords(rawData) {
    console.log(`🔧 ITPNormalizer.normalizeRecords called with:`, {
      inputType: typeof rawData,
      isArray: Array.isArray(rawData),
      keys: rawData && typeof rawData === 'object' ? Object.keys(rawData).slice(0, 5) : 'no keys'
    });
    
    if (!rawData || typeof rawData !== 'object') {
      console.log(`❌ ITPNormalizer: Invalid input data`);
      return [];
    }

    const allRecords = [];
    
    // ITP структура: { "База данных": { "data": [...] }, ... }
    for (const [dbName, dbData] of Object.entries(rawData)) {
      console.log(`📋 Processing database: ${dbName}`);
      
      if (dbData && dbData.data && Array.isArray(dbData.data)) {
        console.log(`📊 Found ${dbData.data.length} records in ${dbName}`);
        
        // Добавляем имя базы данных к каждой записи
        const dbRecords = dbData.data.map(record => ({
          ...record,
          source_database: dbName
        }));
        
        allRecords.push(...dbRecords);
      } else {
        console.log(`⚠️ Invalid structure in ${dbName}:`, typeof dbData);
      }
    }
    
    console.log(`📊 Total records collected: ${allRecords.length}`);
    
    const normalized = allRecords.map(record => this.normalizeRecord(record)).filter(Boolean);
    console.log(`✅ ITPNormalizer: Normalized ${normalized.length} records from ${allRecords.length} input records`);
    
    return normalized;
  }
}

module.exports = ITPNormalizer;