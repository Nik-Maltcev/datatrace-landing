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
    if (dataItem.MiddleName) normalized.middleName = dataItem.MiddleName;
    if (dataItem.NickName) normalized.nickName = dataItem.NickName;

    // Контактная информация
    if (dataItem.Phone) normalized.phone = this.normalizePhone(dataItem.Phone);
    if (dataItem.Email) normalized.email = dataItem.Email;

    // Адресные данные
    if (dataItem.Address) normalized.address = dataItem.Address;
    if (dataItem.PointAddress) normalized.pointAddress = dataItem.PointAddress;
    if (dataItem.Region) normalized.region = dataItem.Region;
    if (dataItem.City) normalized.city = dataItem.City;
    if (dataItem.CityCode) normalized.cityCode = dataItem.CityCode;
    if (dataItem.EngStreet) normalized.engStreet = dataItem.EngStreet;
    if (dataItem.RusStreet) normalized.rusStreet = dataItem.RusStreet;
    if (dataItem.House) normalized.house = dataItem.House;
    if (dataItem.PostCode && dataItem.PostCode !== 'null') normalized.postCode = dataItem.PostCode;

    // Документы и идентификаторы
    if (dataItem.Passport) normalized.passport = dataItem.Passport;
    if (dataItem.Snils) normalized.snils = dataItem.Snils;
    if (dataItem.INN) normalized.inn = dataItem.INN;
    if (dataItem.VkID) normalized.vkId = dataItem.VkID;
    if (dataItem.AddressID) normalized.addressId = dataItem.AddressID;

    // Личная информация
    if (dataItem.BDay) normalized.birthDate = this.normalizeDate(dataItem.BDay);
    if (dataItem.BDayDay && dataItem.BDayMonth && dataItem.BDayYear) {
      normalized.birthDate = `${dataItem.BDayDay.padStart(2, '0')}.${dataItem.BDayMonth.padStart(2, '0')}.${dataItem.BDayYear}`;
    }
    if (dataItem.Gender) normalized.gender = this.normalizeGender(dataItem.Gender);
    if (dataItem.Citizenship) normalized.citizenship = dataItem.Citizenship;

    // Финансовые данные
    if (dataItem.Amount) normalized.amount = dataItem.Amount;
    if (dataItem.Price) normalized.price = dataItem.Price;
    if (dataItem.Balance) normalized.balance = dataItem.Balance;
    if (dataItem.HasCards) normalized.hasCards = dataItem.HasCards === 't' ? 'Да' : 'Нет';

    // Заказы и покупки
    if (dataItem.Product) normalized.product = dataItem.Product;
    if (dataItem.Product2) normalized.product2 = dataItem.Product2;
    if (dataItem.Product3) normalized.product3 = dataItem.Product3;

    // Компания и работа
    if (dataItem.Company) normalized.company = dataItem.Company;
    if (dataItem.NameCompany) normalized.nameCompany = dataItem.NameCompany;
    if (dataItem.PointCode) normalized.pointCode = dataItem.PointCode;

    // Даты
    if (dataItem.Date) normalized.date = this.normalizeDate(dataItem.Date);
    if (dataItem['Date(UNIX)']) normalized.dateUnix = this.normalizeUnixDate(dataItem['Date(UNIX)']);
    if (dataItem['DeliveryDate(UNIX)']) normalized.deliveryDate = this.normalizeUnixDate(dataItem['DeliveryDate(UNIX)']);
    if (dataItem.RegDate) normalized.regDate = this.normalizeDate(dataItem.RegDate);
    if (dataItem['RegDate(UNIX)']) normalized.regDateUnix = this.normalizeUnixDate(dataItem['RegDate(UNIX)']);
    if (dataItem.LastActive) normalized.lastActive = this.normalizeUnixDate(dataItem.LastActive);

    // Технические данные
    if (dataItem.OS) normalized.os = dataItem.OS;
    if (dataItem.DeliveryType) normalized.deliveryType = dataItem.DeliveryType;
    if (dataItem.PaymentType) normalized.paymentType = dataItem.PaymentType;
    if (dataItem.Status) normalized.status = dataItem.Status;
    if (dataItem.TimeZone) normalized.timeZone = dataItem.TimeZone;
    if (dataItem['Type(fiz\\ur)']) normalized.clientType = dataItem['Type(fiz\\ur)'] === 'fiz' ? 'Физическое лицо' : 'Юридическое лицо';

    // Дополнительная информация
    if (dataItem.Description) normalized.description = dataItem.Description;
    if (dataItem.Comment) normalized.comment = dataItem.Comment;
    if (dataItem.Text) normalized.text = dataItem.Text;
    if (dataItem.Tags) normalized.tags = dataItem.Tags;
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
    
    // Если дата уже в нормальном формате, возвращаем как есть
    if (typeof date === 'string' && date.includes('-')) {
      return date;
    }
    
    return String(date);
  }

  /**
   * Нормализует UNIX дату
   * @param {string|number} unixDate - UNIX timestamp
   * @returns {string} форматированная дата
   */
  static normalizeUnixDate(unixDate) {
    if (!unixDate) return '';
    
    try {
      const timestamp = parseInt(unixDate);
      const date = new Date(timestamp);
      return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU');
    } catch (error) {
      return String(unixDate);
    }
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
   * @returns {Array} массив нормализованных записей
   */
  static normalizeRecords(records) {
    if (!Array.isArray(records)) {
      console.warn('LeakOsintNormalizer.normalizeRecords: input is not an array:', typeof records);
      return [];
    }

    const normalized = records
      .map(record => this.normalizeRecord(record))
      .filter(record => record !== null);

    console.log(`LeakOsintNormalizer: Processed ${normalized.length} valid sources from ${records.length} total`);
    
    return normalized;
  }
}

module.exports = LeakOsintNormalizer;
