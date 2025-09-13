/**
 * LeakOsintNormalizer - нормализует данные LeakOsint для удобного отображения
 */

class LeakOsintNormalizer {
  /**
   * Нормализует одну запись LeakOsint
   * @param {Object} record - исходная запись
   * @returns {Object} нормализованная запись
   */
  static normalizeRecord(record) {
    if (!record || typeof record !== 'object') {
      return null;
    }

    // Проверяем на "No results found" сообщения
    const recordText = JSON.stringify(record).toLowerCase();
    const hasNoResults = recordText.includes('no results found') || 
                        recordText.includes('не найдено результатов') ||
                        recordText.includes('нет результатов') ||
                        recordText.includes('по вашему запросу не найдено результатов');
    
    if (hasNoResults) {
      console.log(`🚫 LeakOsintNormalizer: Skipping record with "No results": ${record.db}`);
      return null;
    }

    // Проверяем если data пустой или содержит только пустые элементы
    if (record.data && Array.isArray(record.data) && record.data.length === 0) {
      console.log(`🚫 LeakOsintNormalizer: Skipping record with empty data: ${record.db}`);
      return null;
    }

    const normalized = {};

    // Основная информация о базе данных
    if (record.db) normalized.database = record.db;
    if (record.info) normalized.databaseInfo = record.info;

    // Если есть массив данных, обрабатываем каждый элемент
    if (record.data && Array.isArray(record.data)) {
      normalized.records = record.data.map(dataItem => this.normalizeDataItem(dataItem)).filter(item => item !== null);
      
      // Если после фильтрации ничего не осталось, возвращаем null
      if (normalized.records.length === 0) {
        console.log(`🚫 LeakOsintNormalizer: No valid data items after filtering: ${record.db}`);
        return null;
      }
    }

    return normalized;
  }

  /**
   * Нормализует элемент данных
   * @param {Object} dataItem - элемент данных
   * @returns {Object} нормализованный элемент
   */
  static normalizeDataItem(dataItem) {
    if (!dataItem || typeof dataItem !== 'object') {
      return null;
    }

    const normalized = {};

    // Персональные данные
    if (dataItem.FullName) normalized.fullName = dataItem.FullName;
    if (dataItem.FirstName) normalized.firstName = dataItem.FirstName;
    if (dataItem.LastName) normalized.lastName = dataItem.LastName;
    if (dataItem.NickName) normalized.nickName = dataItem.NickName;

    // Контактная информация
    if (dataItem.Phone) normalized.phone = this.normalizePhone(dataItem.Phone);
    if (dataItem.Email) normalized.email = dataItem.Email;

    // Адресные данные
    if (dataItem.Address) normalized.address = dataItem.Address;
    if (dataItem.City) normalized.city = dataItem.City;

    // Документы и идентификаторы
    if (dataItem.Passport) normalized.passport = dataItem.Passport;
    if (dataItem.Snils) normalized.snils = dataItem.Snils;
    if (dataItem.INN) normalized.inn = dataItem.INN;
    if (dataItem.VkID) normalized.vkId = dataItem.VkID;

    // Личная информация
    if (dataItem.BDay) normalized.birthDate = this.normalizeDate(dataItem.BDay);
    if (dataItem.Gender) normalized.gender = this.normalizeGender(dataItem.Gender);

    // Дополнительная информация
    if (dataItem.Password) normalized.password = dataItem.Password;

    return normalized;
  }

  /**
   * Нормализует номер телефона
   * @param {string} phone - номер телефона
   * @returns {string} нормализованный номер
   */
  static normalizePhone(phone) {
    if (!phone) return '';
    return String(phone).trim().replace(/\s+/g, '');
  }

  /**
   * Нормализует дату
   * @param {string} date - дата
   * @returns {string} нормализованная дата
   */
  static normalizeDate(date) {
    if (!date) return '';
    return String(date);
  }

  /**
   * Нормализует пол
   * @param {string} gender - пол
   * @returns {string} нормализованный пол
   */
  static normalizeGender(gender) {
    if (!gender) return '';
    
    const g = String(gender).toLowerCase();
    if (g === 'f' || g === 'female' || g === 'ж') return 'Женский';
    if (g === 'm' || g === 'male' || g === 'м') return 'Мужской';
    if (g === '0') return 'Женский';
    if (g === '1') return 'Мужской';
    
    return gender;
  }

  /**
   * Нормализует массив записей LeakOsint
   * @param {Array} records - массив записей
   * @returns {Array} плоский массив нормализованных записей
   */
  static normalizeRecords(records) {
    if (!Array.isArray(records)) {
      console.warn('LeakOsintNormalizer.normalizeRecords: input is not an array:', typeof records);
      return [];
    }

    const allRecords = [];
    let processedSources = 0;
    
    records.forEach(record => {
      const normalized = this.normalizeRecord(record);
      if (normalized && normalized.records && Array.isArray(normalized.records)) {
        processedSources++;
        // Добавляем информацию о базе данных к каждой записи
        normalized.records.forEach(item => {
          if (item) {
            item.database = normalized.database;
            item.databaseInfo = normalized.databaseInfo;
            allRecords.push(item);
          }
        });
      }
    });

    console.log(`LeakOsintNormalizer: Processed ${processedSources} valid sources from ${records.length} total, extracted ${allRecords.length} records`);
    
    return allRecords;
  }
}

module.exports = LeakOsintNormalizer;