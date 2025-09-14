/**
 * DyxlessNormalizer - нормализует данные Dyxless для удобного отображения
 */

class DyxlessNormalizer {
  /**
   * Маппинг полей с английского на русский
   */
  static fieldMapping = {
    // Основные поля
    'number': 'Номер телефона',
    'mail': 'Адрес электронной почты',
    'fullName': 'Полное имя',
    'last_name': 'Фамилия',
    'first_name': 'Имя',
    'sur_name': 'Отчество',
    'birthday': 'Дата рождения',
    'pol': 'Пол',
    'address': 'Адрес проживания/доставки',
    'city': 'Город',
    'region': 'Регион',
    
    // Пользовательские данные
    'username': 'Имя пользователя',
    'password': 'Пароль',
    'id': 'Внутренний идентификатор записи',
    'user_id': 'Внутренний идентификатор пользователя',
    'clientId': 'Идентификатор клиента',
    
    // База данных
    'baseName': 'Название базы данных',
    'table_name': 'Название таблицы',
    
    // Финансовые данные
    'card': 'Номер банковской карты',
    'card_type': 'Тип банковской карты',
    'number_last': 'Последние цифры номера',
    
    // Даты
    'date': 'Дата',
    'created_date': 'Дата создания записи',
    'last_date': 'Дата последней активности',
    
    // Дополнительные поля
    'other': 'Прочее',
    'other1': 'Дополнительные данные 1',
    'other2': 'Дополнительные данные 2',
    
    // Статистика и активность
    'count_orders': 'Количество заказов',
    'count_rides': 'Количество поездок',
    'weight': 'Вес',
    
    // Контактная информация
    'sender_name': 'Наименование отправителя',
    'inn': 'ИНН',
    'post_code': 'Почтовый индекс',
    'contact': 'Контактное лицо',
    'cdek_id': 'Идентификатор СДЭК',
    
    // Операторы и сервисы
    'operator': 'Мобильный оператор',
    'tags': 'Теги или метки'
  };

  /**
   * Нормализует один объект записи Dyxless
   * @param {Object} item - исходная запись
   * @returns {Object} нормализованная запись
   */
  static normalizeItem(item) {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const normalized = {};

    // Преобразуем каждое поле
    Object.keys(item).forEach(key => {
      const russianKey = this.fieldMapping[key] || key;
      let value = item[key];

      // Специальная обработка некоторых полей
      value = this.normalizeValue(key, value);

      // Пропускаем пустые и бесполезные значения
      if (this.shouldIncludeField(key, value)) {
        normalized[russianKey] = value;
      }
    });

    return normalized;
  }

  /**
   * Нормализует значение поля
   * @param {string} key - ключ поля
   * @param {any} value - значение
   * @returns {any} нормализованное значение
   */
  static normalizeValue(key, value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const strValue = String(value);

    // Обработка пола
    if (key === 'pol') {
      const g = strValue.toLowerCase();
      if (g === 'f' || g === 'female' || g === 'ж') return 'Женский';
      if (g === 'm' || g === 'male' || g === 'м') return 'Мужской';
      if (g === '0') return 'Женский';
      if (g === '1') return 'Мужской';
      return value;
    }

    // Обработка номера карты (маскирование)
    if (key === 'card' && strValue.length > 8) {
      return strValue;
    }

    // Обработка даты рождения
    if (key === 'birthday' && strValue.includes('-') && strValue !== '1970-01-01 00:00:00') {
      try {
        const date = new Date(strValue);
        if (date.getFullYear() > 1900 && date.getFullYear() < 2024) {
          return date.toLocaleDateString('ru-RU');
        }
      } catch (e) {
        // Игнорируем ошибки парсинга даты
      }
    }

    // Обработка номера телефона
    if (key === 'number') {
      return strValue.replace(/^\+/, '');
    }

    // Обработка типа карты
    if (key === 'card_type') {
      const types = {
        'INST_CREDIT': 'Кредитная',
        'INST_DEBET': 'Дебетовая'
      };
      return types[strValue] || strValue;
    }

    return value;
  }

  /**
   * Определяет, должно ли поле быть включено в результат
   * @param {string} key - ключ поля
   * @param {any} value - значение
   * @returns {boolean} true если поле должно быть включено
   */
  static shouldIncludeField(key, value) {
    if (value === null || value === undefined) return false;
    
    const strValue = String(value).trim();
    
    // Пропускаем пустые значения
    if (strValue === '' || strValue === 'NULL' || strValue === 'null') return false;
    
    // Пропускаем бесполезные даты
    if (key === 'birthday' && (strValue === '1970-01-01 00:00:00' || strValue === '1970-01-01')) return false;
    
    // Пропускаем пустые дополнительные поля
    if ((key === 'other' || key === 'other1' || key === 'other2') && strValue.length < 2) return false;
    
    return true;
  }

  /**
   * Нормализует массив записей Dyxless
   * @param {Array} items - массив записей
   * @returns {Array} массив нормализованных записей
   */
  static normalizeItems(items) {
    if (!Array.isArray(items)) {
      console.warn('DyxlessNormalizer.normalizeItems: input is not an array:', typeof items);
      return items;
    }

    return items.map(item => this.normalizeItem(item));
  }

  /**
   * Нормализует ответ Dyxless API
   * @param {Object} response - ответ API
   * @returns {Object} нормализованный ответ
   */
  static normalizeResponse(response) {
    if (!response || typeof response !== 'object') {
      return response;
    }

    const normalized = { ...response };

    // Нормализуем массив items если он есть
    if (normalized.items && Array.isArray(normalized.items)) {
      normalized.items = this.normalizeItems(normalized.items);
      console.log(`DyxlessNormalizer: Normalized ${normalized.items.length} Dyxless records`);
    }

    return normalized;
  }
}

module.exports = DyxlessNormalizer;