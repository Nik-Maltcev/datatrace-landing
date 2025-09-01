// UsersboxNormalizer.js - Комплексный нормализатор данных Usersbox

function normalizeUsersboxData(rawData) {
  if (!rawData || rawData.status !== 'success') {
    console.log('❌ Usersbox data is not valid or unsuccessful');
    return [];
  }

  const items = rawData.data?.items || [];
  console.log(`📋 Processing ${items.length} Usersbox sources`);

  const normalizedSources = [];

  items.forEach((sourceData, sourceIndex) => {
    if (!sourceData.source) {
      console.log(`⚠️ Source ${sourceIndex + 1}: Missing source information`);
      return;
    }

    const { database, collection } = sourceData.source;
    const sourceName = `${database}/${collection}`;
    const hitsData = sourceData.hits || {};
    const sourceItems = hitsData.items || [];

    console.log(`📊 Processing source "${sourceName}" with ${sourceItems.length} items`);

    // Нормализуем каждую запись в источнике
    const normalizedItems = sourceItems.map((item, itemIndex) => {
      return normalizeUsersboxRecord(item, itemIndex, sourceName);
    });

    normalizedSources.push({
      source: sourceName,
      database: database,
      collection: collection,
      count: hitsData.count || sourceItems.length,
      hitsCount: hitsData.hitsCount || sourceItems.length,
      items: normalizedItems
    });
  });

  console.log(`✅ Usersbox normalization complete: ${normalizedSources.length} sources processed`);
  return normalizedSources;
}

function normalizeUsersboxRecord(record, index, sourceName) {
  if (!record || typeof record !== 'object') {
    return { _originalIndex: index, _error: 'Invalid record format' };
  }

  const normalized = {
    _originalIndex: index,
    _source: sourceName,
    _score: record._score || 0
  };

  // Нормализация ID
  if (record._id) {
    if (typeof record._id === 'object' && record._id.$oid) {
      normalized._id = record._id.$oid;
    } else {
      normalized._id = record._id;
    }
  }

  // Основные поля
  if (record.full_name) normalized.fullName = record.full_name;
  if (record.first_name) normalized.firstName = record.first_name;
  if (record.last_name) normalized.lastName = record.last_name;
  if (record.birth_date) normalized.birthDate = formatDate(record.birth_date);
  if (record.name) normalized.name = record.name;
  
  // Контактная информация
  if (record.phone) normalized.phone = record.phone;
  if (record.phones) {
    normalized.phones = Array.isArray(record.phones) ? record.phones : [record.phones];
  }
  if (record.email) normalized.email = record.email;
  if (record.emails) {
    normalized.emails = Array.isArray(record.emails) ? record.emails : [record.emails];
  }
  if (record.contact_person) normalized.contactPerson = record.contact_person;
  
  // Адреса
  if (record.address) normalized.address = record.address;
  if (record.addresses) {
    normalized.addresses = Array.isArray(record.addresses) ? record.addresses : [record.addresses];
  }
  if (record.pickup_point) normalized.pickupPoint = formatPickupPoint(record.pickup_point);
  if (record.area) normalized.area = record.area;
  if (record.city) normalized.city = record.city;
  if (record.street) normalized.street = record.street;
  if (record.house) normalized.house = record.house;
  if (record.floor) normalized.floor = record.floor;
  if (record.intercom) normalized.intercom = record.intercom;
  if (record.postal_code) normalized.postalCode = record.postal_code;
  if (record.longitude) normalized.longitude = record.longitude;
  if (record.latitude) normalized.latitude = record.latitude;
  if (record.title) normalized.title = record.title;
  
  // Банковские данные
  if (record.accounts) {
    normalized.accounts = Array.isArray(record.accounts) ? record.accounts : [record.accounts];
  }
  if (record.account_number) {
    normalized.accountNumber = record.account_number;
  }
  if (record.cards) {
    normalized.cards = Array.isArray(record.cards) ? record.cards : [record.cards];
  }
  if (record.inn) normalized.inn = record.inn;
  if (record.citizenship) normalized.citizenship = record.citizenship;
  if (record.gender) normalized.gender = record.gender;
  
  // Даты и время
  if (record.created_at) normalized.createdAt = record.created_at;
  if (record.delivered_at) normalized.deliveredAt = formatDate(record.delivered_at);
  if (record.delivery_date) normalized.deliveryDate = formatDate(record.delivery_date);
  if (record.date) normalized.date = formatDate(record.date);
  if (record.updated) normalized.updated = formatDate(record.updated);
  if (record.timezone) normalized.timezone = record.timezone;
  if (record.dat_recognize) normalized.datRecognize = formatDate(record.dat_recognize);
  if (record.dat_process) normalized.datProcess = formatDate(record.dat_process);
  
  // Заказы и покупки
  if (record.price) normalized.price = record.price;
  if (record.amount) normalized.amount = record.amount;
  if (record.currency) normalized.currency = record.currency;
  if (record.products) {
    normalized.products = Array.isArray(record.products) ? record.products : [record.products];
  }
  if (record.shipping_cost) normalized.shippingCost = record.shipping_cost;
  if (record.comment) normalized.comment = record.comment;
  if (record.status) normalized.status = record.status;
  if (record.first_order) normalized.firstOrder = record.first_order;
  if (record.platform) normalized.platform = record.platform;
  if (record.paid) normalized.paid = record.paid;
  if (record.delivery_city_id) normalized.deliveryCityId = record.delivery_city_id;
  
  // Специфические поля
  if (record.want_receive_info) normalized.wantReceiveInfo = record.want_receive_info;
  if (record.lang_code) normalized.langCode = record.lang_code;
  if (record.cashier) normalized.cashier = record.cashier;
  if (record.has_sign) normalized.hasSign = record.has_sign;
  if (record.password) normalized.password = record.password;
  if (record.user_id) normalized.userId = record.user_id;
  if (record.yandex_uid) normalized.yandexUid = record.yandex_uid;
  if (record.app) normalized.app = record.app;
  if (record.user_agent) normalized.userAgent = record.user_agent;
  if (record.payment) normalized.payment = record.payment;
  if (record.recovery) normalized.recovery = record.recovery;
  if (record.user_info) normalized.userInfo = record.user_info;
  if (record.login) normalized.login = record.login;
  if (record.moderation) normalized.moderation = record.moderation;
  if (record.service) normalized.service = record.service;

  return normalized;
}

function formatDate(dateStr) {
  if (!dateStr) return null;

  // Если уже в нормальном формате ДД.ММ.ГГГГ
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Если в формате YYYY-MM-DD HH:MM:SS
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr; // Оставляем как есть для времени
  }

  return dateStr;
}

function formatAddress(addr) {
  if (!addr || typeof addr !== 'object') return addr;

  const parts = [];
  if (addr.city) parts.push(`г. ${addr.city}`);
  if (addr.street) {
    const street = addr.street.rus || addr.street.eng || addr.street;
    parts.push(street);
  }
  if (addr.house) parts.push(`д. ${addr.house}`);
  if (addr.flat) parts.push(`кв. ${addr.flat}`);

  return parts.length > 0 ? parts.join(', ') : addr;
}

function formatPickupPoint(pickup) {
  if (!pickup || typeof pickup !== 'object') return pickup;

  const parts = [];
  if (pickup.code) parts.push(`Код: ${pickup.code}`);
  if (pickup.address) parts.push(`Адрес: ${pickup.address}`);

  return parts.length > 0 ? parts.join(', ') : pickup;
}

module.exports = {
  normalizeUsersboxData
};