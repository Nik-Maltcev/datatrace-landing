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
   * Нормализация номера карты (скрытие части номера)
   * @param {string} cardNumber - Номер карты
   * @returns {string} Частично скрытый номер карты
   */
  static normalizeCardNumber(cardNumber) {
    if (!cardNumber) return null;
    
    const digits = cardNumber.toString().replace(/\D/g, '');
    
    if (digits.length >= 8) {
      return digits.substring(0, 4) + '*'.repeat(digits.length - 8) + digits.substring(digits.length - 4);
    }
    
    return '*'.repeat(digits.length);
  }

  /**
   * Нормализация документов
   * @param {Object} document - Документ
   * @returns {Object} Нормализованный документ
   */
  static normalizeDocument(document) {
    if (!document) return null;
    
    return {
      type: document.type || 'Неизвестно',
      serial: document.serial || null,
      authority: document.authority || null,
      country: document.country || 'RU',
      dateIssue: document.date_issue ? this.normalizeBirthDate(document.date_issue) : null
    };
  }

  /**
   * Нормализация финансовых данных
   * @param {Object} financial - Финансовые данные
   * @returns {Object} Нормализованные данные
   */
  static normalizeFinancial(financial) {
    if (!financial) return null;
    
    return {
      cardNumber: financial.card_number ? this.normalizeCardNumber(financial.card_number) : null,
      // Можно добавить другие финансовые поля
    };
  }

  /**
   * Форматирование даты для отображения
   * @param {string} dateStr - Дата в формате ISO или другом
   * @returns {string} Отформатированная дата
   */
  static formatDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
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

      // Документы (если есть)
      documents: record.documents ? this.normalizeDocument(record.documents) : null,

      // Финансовые данные (если есть)
      financials: record.financials ? this.normalizeFinancial(record.financials) : null,
      cardNumber: record.card_number ? this.normalizeCardNumber(record.card_number) : null,

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
   * Нормализация массива записей ITP
   * @param {Array} records - Массив записей
   * @returns {Array} Нормализованные записи
   */
  static normalizeRecords(records) {
    console.log(`🔧 ITPNormalizer.normalizeRecords called with:`, {
      inputType: typeof records,
      isArray: Array.isArray(records),
      length: Array.isArray(records) ? records.length : 'not array',
      keys: records && typeof records === 'object' ? Object.keys(records) : 'no keys'
    });
    
    if (!Array.isArray(records)) {
      console.log(`⚠️ ITPNormalizer: Expected array, got ${typeof records}, trying to convert...`);
      
      // Если это объект, попробуем извлечь массивы из его свойств
      if (records && typeof records === 'object') {
        const allRecords = [];
        Object.values(records).forEach(value => {
          if (Array.isArray(value)) {
            allRecords.push(...value);
          } else if (value && typeof value === 'object' && value.data && Array.isArray(value.data)) {
            allRecords.push(...value.data);
          }
        });
        
        if (allRecords.length > 0) {
          console.log(`✅ ITPNormalizer: Extracted ${allRecords.length} records from object`);
          records = allRecords;
        } else {
          console.log(`❌ ITPNormalizer: No valid records found in object`);
          return [];
        }
      } else {
        return [];
      }
    }
    
    const normalized = records.map(record => this.normalizeRecord(record)).filter(Boolean);
    console.log(`📊 ITPNormalizer: Normalized ${normalized.length} records from ${records.length} input records`);
    
    return normalized;
  }

  /**
   * Получение читаемого описания типа данных
   * @param {string} field - Название поля
   * @returns {string} Описание
   */
  static getFieldDescription(field) {
    const descriptions = {
      name: '👤 Имя',
      phone: '📱 Телефон',
      email: '📧 Email',
      address: '🏠 Адрес',
      birthDate: '🎂 Дата рождения',
      gender: '⚧️ Пол',
      login: '👨‍💻 Логин',
      password: '🔑 Пароль',
      passwordHash: '🔐 Хеш пароля',
      cardNumber: '💳 Номер карты',
      documents: '📄 Документы',
      telegramId: '📱 Telegram ID',
      phoneCarrier: '📶 Оператор связи',
      phoneRegion: '🌍 Регион телефона',
      dbName: '💾 База данных',
      createdDate: '📅 Дата создания',
      isVip: '⭐ VIP статус'
    };
    
    return descriptions[field] || field;
  }
}

module.exports = ITPNormalizer;
