/**
 * VektorNormalizer.js - Нормализатор данных Vektor
 * 
 * Обрабатывает данные о заказах и регистрациях пользователей
 * из различных интернет-магазинов и сервисов
 */

class VektorNormalizer {
  constructor() {
    this.sourceName = 'Vektor';
  }

  /**
   * Основной метод нормализации данных Vektor
   * @param {Array} rawData - Массив сырых данных от Vektor API
   * @param {string} searchQuery - Поисковый запрос
   * @returns {Object} Нормализованные данные
   */
  normalize(rawData, searchQuery = '') {
    if (!rawData || !Array.isArray(rawData)) {
      return this.createEmptyResult(searchQuery);
    }

    try {
      // Группируем данные по типам
      const groupedData = this.groupDataByType(rawData);
      
      // Нормализуем каждую группу
      const normalizedOrders = this.normalizeOrders(groupedData.orders);
      const normalizedRegistrations = this.normalizeRegistrations(groupedData.registrations);
      const normalizedBankCards = this.normalizeBankCards(groupedData.bankCards);
      const normalizedProfiles = this.normalizeProfiles(groupedData.profiles);
      const normalizedSales = this.normalizeSales(groupedData.sales);
      
      // Извлекаем уникальную информацию о персоне
      const personInfo = this.extractPersonInfo(rawData);
      
      // Создаем итоговую структуру
      const result = {
        source: this.sourceName,
        searchQuery: searchQuery,
        timestamp: new Date().toISOString(),
        totalRecords: rawData.length,
        personInfo: personInfo,
        orders: normalizedOrders,
        registrations: normalizedRegistrations,
        bankCards: normalizedBankCards,
        profiles: normalizedProfiles,
        sales: normalizedSales,
        summary: this.createSummary(normalizedOrders, normalizedRegistrations, normalizedBankCards, normalizedProfiles, normalizedSales),
        formattedOutput: this.formatForDisplay(personInfo, normalizedOrders, normalizedRegistrations, normalizedBankCards, normalizedProfiles, normalizedSales)
      };

      return result;

    } catch (error) {
      console.error('Ошибка нормализации данных Vektor:', error);
      return this.createErrorResult(searchQuery, error.message);
    }
  }

  /**
   * Группирует данные по типам
   */
  groupDataByType(rawData) {
    const orders = [];
    const registrations = [];
    const bankCards = [];
    const profiles = [];
    const sales = [];

    rawData.forEach(item => {
      if (item['СУММА ЗАКАЗА']) {
        orders.push(item);
      } else if (item['ДАТА РЕГИСТРАЦИИ']) {
        registrations.push(item);
      } else if (item['НОМЕР КАРТЫ']) {
        bankCards.push(item);
      } else if (item['ЛОГИН']) {
        profiles.push(item);
      } else if (item['КОММЕНТАРИЙ'] && item['КОММЕНТАРИЙ'].includes('iPhone')) {
        sales.push(item);
      }
    });

    return { orders, registrations, bankCards, profiles, sales };
  }

  /**
   * Нормализует данные о заказах
   */
  normalizeOrders(orders) {
    return orders.map((order, index) => {
      const deliveryInfo = this.parseDeliveryComment(order['КОММЕНТАРИЙ'] || '');
      
      return {
        id: index + 1,
        fullName: this.cleanString(order['ФИО']),
        phone: this.normalizePhone(order['ТЕЛЕФОН']),
        email: this.normalizeEmail(order['ПОЧТА']),
        orderAmount: this.normalizeAmount(order['СУММА ЗАКАЗА']),
        deliveryDate: deliveryInfo.deliveryDate,
        platform: deliveryInfo.platform,
        comment: this.cleanString(order['КОММЕНТАРИЙ']),
        actualityDate: this.normalizeDate(order['АКТУАЛЬНОСТЬ']),
        database: this.cleanString(order['database']),
        type: 'order'
      };
    });
  }

  /**
   * Нормализует данные о регистрациях
   */
  normalizeRegistrations(registrations) {
    return registrations.map((reg, index) => {
      return {
        id: index + 1,
        phone: this.normalizePhone(reg['ТЕЛЕФОН']),
        city: this.cleanString(reg['ГОРОД']),
        registrationDate: this.normalizeDateTime(reg['ДАТА РЕГИСТРАЦИИ']),
        actualityDate: this.normalizeDateTime(reg['АКТУАЛЬНОСТЬ']),
        database: this.cleanString(reg['database']),
        type: 'registration'
      };
    });
  }

  /**
   * Нормализует данные о банковских картах
   */
  normalizeBankCards(bankCards) {
    return bankCards.map((card, index) => {
      return {
        id: index + 1,
        fullName: this.cleanString(card['ФИО']),
        birthDate: this.normalizeDate(card['ДАТА РОЖДЕНИЯ']),
        phone: this.normalizePhone(card['ТЕЛЕФОН']),
        cardNumber: this.maskCardNumber(card['НОМЕР КАРТЫ']),
        cardInfo: this.cleanString(card['ИНФОРМАЦИЯ О СЧЕТЕ']),
        city: this.cleanString(card['ГОРОД']),
        operator: this.cleanString(card['ОПЕРАТОР']),
        actualityDate: this.normalizeDate(card['АКТУАЛЬНОСТЬ']),
        database: this.cleanString(card['database']),
        type: 'bankCard'
      };
    });
  }

  /**
   * Нормализует данные профилей пользователей
   */
  normalizeProfiles(profiles) {
    return profiles.map((profile, index) => {
      return {
        id: index + 1,
        fullName: this.cleanString(profile['ФИО']),
        login: this.cleanString(profile['ЛОГИН']),
        phone: this.normalizePhone(profile['ТЕЛЕФОН']),
        email: this.normalizeEmail(profile['ПОЧТА']),
        database: this.cleanString(profile['database']),
        type: 'profile'
      };
    });
  }

  /**
   * Нормализует данные о продажах
   */
  normalizeSales(sales) {
    return sales.map((sale, index) => {
      const productInfo = this.parseProductComment(sale['КОММЕНТАРИЙ'] || '');
      
      return {
        id: index + 1,
        fullName: this.cleanString(sale['ФИО']),
        phone: this.normalizePhone(sale['ТЕЛЕФОН']),
        product: productInfo.product,
        description: productInfo.description,
        comment: this.cleanString(sale['КОММЕНТАРИЙ']),
        actualityDate: this.normalizeDate(sale['АКТУАЛЬНОСТЬ']),
        database: this.cleanString(sale['database']),
        type: 'sale'
      };
    });
  }

  /**
   * Извлекает общую информацию о персоне
   */
  extractPersonInfo(rawData) {
    // Ищем наиболее полную информацию среди всех записей
    let personInfo = {
      fullName: null,
      phone: null,
      email: null,
      city: null,
      birthDate: null
    };

    rawData.forEach(record => {
      if (!personInfo.fullName && record['ФИО']) {
        personInfo.fullName = this.cleanString(record['ФИО']);
      }
      if (!personInfo.phone && record['ТЕЛЕФОН']) {
        personInfo.phone = this.normalizePhone(record['ТЕЛЕФОН']);
      }
      if (!personInfo.email && record['ПОЧТА']) {
        personInfo.email = this.normalizeEmail(record['ПОЧТА']);
      }
      if (!personInfo.city && record['ГОРОД']) {
        personInfo.city = this.cleanString(record['ГОРОД']);
      }
      if (!personInfo.birthDate && record['ДАТА РОЖДЕНИЯ']) {
        personInfo.birthDate = this.normalizeDate(record['ДАТА РОЖДЕНИЯ']);
      }
    });

    return personInfo;
  }

  /**
   * Парсит комментарий для извлечения даты доставки и платформы
   */
  parseDeliveryComment(comment) {
    const result = {
      deliveryDate: null,
      platform: null
    };

    if (!comment) return result;

    // Извлекаем дату доставки
    const dateMatch = comment.match(/ДАТА ДОСТАВКИ:\s*(\d{2}\.\d{2}\.\d{4})/);
    if (dateMatch) {
      result.deliveryDate = this.normalizeDate(dateMatch[1]);
    }

    // Извлекаем платформу
    const platformMatch = comment.match(/ОС:\s*(\w+)/);
    if (platformMatch) {
      result.platform = platformMatch[1];
    }

    return result;
  }

  /**
   * Парсит комментарий о продаже для извлечения информации о товаре
   */
  parseProductComment(comment) {
    const result = {
      product: null,
      description: null
    };

    if (!comment) return result;

    // Извлекаем название продукта (первые слова до описания)
    const productMatch = comment.match(/^([^\.]+)/);
    if (productMatch) {
      result.product = productMatch[1].trim();
    }

    // Остальное считаем описанием
    const descriptionMatch = comment.match(/\.\s*(.+)/);
    if (descriptionMatch) {
      result.description = descriptionMatch[1].trim();
    } else {
      result.description = comment;
    }

    return result;
  }

  /**
   * Маскирует номер банковской карты для безопасности
   */
  maskCardNumber(cardNumber) {
    if (!cardNumber) return null;
    
    const cleaned = cardNumber.toString().replace(/\D/g, '');
    if (cleaned.length >= 12) {
      // Показываем первые 4 и последние 4 цифры
      const first4 = cleaned.substring(0, 4);
      const last4 = cleaned.substring(cleaned.length - 4);
      const masked = '*'.repeat(cleaned.length - 8);
      return `${first4}${masked}${last4}`;
    }
    
    return cleaned;
  }

  /**
   * Нормализует номер телефона
   */
  normalizePhone(phone) {
    if (!phone) return null;
    
    const cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('7')) {
      return `+${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Нормализует email
   */
  normalizeEmail(email) {
    if (!email) return null;
    
    // Исправляем распространенные ошибки в email
    let cleaned = email.toString().toLowerCase().trim();
    
    // Исправляем отсутствующий @
    if (cleaned.includes('yandex.ru') && !cleaned.includes('@')) {
      cleaned = cleaned.replace('yandex.ru', '@yandex.ru');
    }
    if (cleaned.includes('gmail.com') && !cleaned.includes('@')) {
      cleaned = cleaned.replace('gmail.com', '@gmail.com');
    }
    if (cleaned.includes('mail.ru') && !cleaned.includes('@')) {
      cleaned = cleaned.replace('mail.ru', '@mail.ru');
    }
    
    return cleaned;
  }

  /**
   * Нормализует сумму заказа
   */
  normalizeAmount(amount) {
    if (!amount) return null;
    
    const numericAmount = parseFloat(amount.toString().replace(/[^\d.]/g, ''));
    return isNaN(numericAmount) ? null : numericAmount;
  }

  /**
   * Нормализует дату
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      // Формат: DD.MM.YYYY
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return dateStr;
    } catch (error) {
      return dateStr;
    }
  }

  /**
   * Нормализует дату и время
   */
  normalizeDateTime(dateTimeStr) {
    if (!dateTimeStr) return null;
    
    try {
      // Формат: DD.MM.YYYY HH:MM:SS
      const [datePart, timePart] = dateTimeStr.split(' ');
      const normalizedDate = this.normalizeDate(datePart);
      
      if (normalizedDate && timePart) {
        return `${normalizedDate} ${timePart}`;
      }
      
      return normalizedDate || dateTimeStr;
    } catch (error) {
      return dateTimeStr;
    }
  }

  /**
   * Очищает строку от лишних символов
   */
  cleanString(str) {
    if (!str) return null;
    return str.toString().trim();
  }

  /**
   * Создает сводку по данным
   */
  createSummary(orders, registrations, bankCards, profiles, sales) {
    const totalOrderAmount = orders.reduce((sum, order) => {
      return sum + (order.orderAmount || 0);
    }, 0);

    const uniqueDatabases = new Set();
    [...orders, ...registrations, ...bankCards, ...profiles, ...sales].forEach(item => {
      if (item.database) {
        uniqueDatabases.add(item.database);
      }
    });

    return {
      totalOrders: orders.length,
      totalRegistrations: registrations.length,
      totalBankCards: bankCards.length,
      totalProfiles: profiles.length,
      totalSales: sales.length,
      totalRecords: orders.length + registrations.length + bankCards.length + profiles.length + sales.length,
      totalOrderAmount: totalOrderAmount,
      averageOrderAmount: orders.length > 0 ? Math.round(totalOrderAmount / orders.length) : 0,
      uniqueDatabases: Array.from(uniqueDatabases),
      dateRange: this.getDateRange([...orders, ...registrations, ...bankCards, ...profiles, ...sales])
    };
  }

  /**
   * Определяет диапазон дат
   */
  getDateRange(records) {
    const dates = [];
    
    records.forEach(record => {
      if (record.actualityDate) dates.push(new Date(record.actualityDate));
      if (record.deliveryDate) dates.push(new Date(record.deliveryDate));
      if (record.registrationDate) dates.push(new Date(record.registrationDate));
    });

    if (dates.length === 0) return null;

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return {
      from: minDate.toISOString().split('T')[0],
      to: maxDate.toISOString().split('T')[0]
    };
  }

  /**
   * Форматирует данные для отображения
   */
  formatForDisplay(personInfo, orders, registrations, bankCards, profiles, sales) {
    let output = [];

    // Информация о персоне
    if (personInfo.fullName || personInfo.phone || personInfo.email) {
      output.push('👤 ИНФОРМАЦИЯ О ПЕРСОНЕ');
      output.push('═'.repeat(50));
      
      if (personInfo.fullName) output.push(`ФИО: ${personInfo.fullName}`);
      if (personInfo.phone) output.push(`Телефон: ${personInfo.phone}`);
      if (personInfo.email) output.push(`Email: ${personInfo.email}`);
      if (personInfo.city) output.push(`Город: ${personInfo.city}`);
      
      output.push('');
    }

    return output.join('\n');
  }

  /**
   * Создает пустой результат
   */
  createEmptyResult(searchQuery) {
    return {
      source: this.sourceName,
      searchQuery: searchQuery,
      timestamp: new Date().toISOString(),
      totalRecords: 0,
      personInfo: {},
      orders: [],
      registrations: [],
      bankCards: [],
      profiles: [],
      sales: [],
      summary: {
        totalOrders: 0,
        totalRegistrations: 0,
        totalBankCards: 0,
        totalProfiles: 0,
        totalSales: 0,
        totalRecords: 0,
        totalOrderAmount: 0,
        averageOrderAmount: 0,
        uniqueDatabases: [],
        dateRange: null
      },
      formattedOutput: 'Данные не найдены'
    };
  }

  /**
   * Создает результат с ошибкой
   */
  createErrorResult(searchQuery, errorMessage) {
    return {
      source: this.sourceName,
      searchQuery: searchQuery,
      timestamp: new Date().toISOString(),
      error: errorMessage,
      totalRecords: 0,
      personInfo: {},
      orders: [],
      registrations: [],
      bankCards: [],
      profiles: [],
      sales: [],
      summary: {},
      formattedOutput: `Ошибка обработки данных: ${errorMessage}`
    };
  }
}

module.exports = VektorNormalizer;