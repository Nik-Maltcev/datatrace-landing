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
   * Нормализация даты рождения
   * @param {string} birthDate - Исходная дата
   * @returns {string} Нормализованная дата в формате YYYY-MM-DD
   */
  static normalizeBirthDate(birthDate) {
    if (!birthDate) return null;
    
    const dateStr = birthDate.toString().trim();
    
    // Обработка формата DD.MM.YYYY
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Обработка формата YYYY-MM-DD (уже нормализован)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    
    // Обработка формата DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    return dateStr; // Возвращаем как есть, если не удалось распознать
  }

  /**
   * Нормализация пола
   * @param {string|number} gender - Исходное значение пола
   * @returns {string} Нормализованное значение
   */
  static normalizeGender(gender) {
    if (!gender) return null;
    
    const genderStr = gender.toString().toLowerCase().trim();
    
    // Обработка числовых значений
    if (genderStr === '1' || genderStr === 'male' || genderStr === 'м' || genderStr === 'мужской') {
      return 'Мужской';
    }
    
    if (genderStr === '2' || genderStr === 'female' || genderStr === 'ж' || genderStr === 'женский') {
      return 'Женский';
    }
    
    return gender; // Возвращаем как есть
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
      dbName: record.db_name || 'Неизвестно',
      name: this.normalizeName(record.name),
      phone: this.normalizePhone(record.phone),
      email: record.email || null,
      address: record.address || null,
      birthDate: this.normalizeBirthDate(record.birth_date),
      gender: this.normalizeGender(record.sex || record.gender),
      isVip: Boolean(record.is_vip),

      // Аккаунты
      login: record.login || null,
      password: record.password || null,
      passwordHash: record.password_hash || null,
      userId: record.id || null,
      serviceUrl: record.url || null,
      serviceTitle: record.title || null,

      // Дополнительная информация
      actuality: record.actuality || null,
      crmId: record.crm_id || null,
      parentId: record.parent_id || null,
      createdDate: record.created_date ? this.normalizeBirthDate(record.created_date) : null,
      telegramId: record.telegram_id || null,
      additionalNames: record.additional_names || null,
      notes: record.notes || null,
      
      // Технические поля
      phoneCarrier: record.phone_carrier || null,
      phoneRegion: record.phone_region || null,
      postalCode: record.postal_code || null,
      senderInn: record.sender_inn || null,
      senderName: record.sender_name || null,
      kpp: record.kpp || null,
      userAgent: record.user_agent || null,
      action: record.action || null,

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