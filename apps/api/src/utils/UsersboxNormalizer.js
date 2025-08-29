// UsersboxNormalizer.js - Комплексный нормализатор данных Usersbox
// Обрабатывает все источники данных Usersbox с их специфическими полями

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

  // Определяем тип источника и нормализуем соответствующие поля
  const sourceType = getSourceType(sourceName);

  switch (sourceType) {
    case 'BANKING':
      normalizeBankingRecord(record, normalized);
      break;
    case 'DELIVERY':
      normalizeDeliveryRecord(record, normalized);
      break;
    case 'DELIVERY_CONTRAGENT':
      normalizeDeliveryContragentRecord(record, normalized);
      break;
    case 'GOVERNMENT':
      normalizeGovernmentRecord(record, normalized);
      break;
    case 'CONTACTS':
      normalizeContactsRecord(record, normalized);
      break;
    case 'ECOMMERCE':
      normalizeEcommerceRecord(record, normalized);
      break;
    case 'MARKETPLACE':
      normalizeMarketplaceRecord(record, normalized);
      break;
    case 'BANKING_ADVANCED':
      normalizeBankingAdvancedRecord(record, normalized);
      break;
    case 'FOOD_DELIVERY':
      normalizeFoodDeliveryRecord(record, normalized);
      break;
    case 'SPORT':
      normalizeSportRecord(record, normalized);
      break;
    case 'PROFESSIONAL':
      normalizeProfessionalRecord(record, normalized);
      break;
    case 'UNKNOWN':
      normalizeUnknownRecord(record, normalized);
      break;
    case 'YANDEX_EDA':
      normalizeYandexEdaRecord(record, normalized);
      break;
    default:
      normalizeGenericRecord(record, normalized);
  }

  return normalized;
}

function getSourceType(sourceName) {
  if (sourceName.includes('alfabank') || sourceName.includes('mtsbank') || sourceName.includes('sberbank')) {
    return sourceName.includes('full_2023') || sourceName.includes('spasibo') ? 'BANKING_ADVANCED' : 'BANKING';
  }
  if (sourceName.includes('cdek')) {
    return sourceName.includes('contragent') ? 'DELIVERY_CONTRAGENT' : 'DELIVERY';
  }
  if (sourceName.includes('esia') || sourceName.includes('gosuslugi')) {
    return 'GOVERNMENT';
  }
  if (sourceName.includes('getcontact')) {
    return 'CONTACTS';
  }
  if (sourceName.includes('goldapple') || sourceName.includes('papajohns')) {
    return 'ECOMMERCE';
  }
  if (sourceName.includes('mm_ru')) {
    return 'MARKETPLACE';
  }
  if (sourceName.includes('sportmaster')) {
    return 'SPORT';
  }
  if (sourceName.includes('unionepro')) {
    return 'PROFESSIONAL';
  }
  if (sourceName.includes('unknown_dump')) {
    return 'UNKNOWN';
  }
  if (sourceName.includes('yandex/eda')) {
    return 'YANDEX_EDA';
  }
  return 'GENERIC';
}

// Нормализация банковских записей (alfabank_ru, etc.)
function normalizeBankingRecord(record, normalized) {
  // Персональные данные
  if (record.full_name) normalized.fullName = record.full_name;
  if (record.birth_date) normalized.birthDate = formatDate(record.birth_date);

  // Контакты
  if (record.phones) {
    normalized.phones = Array.isArray(record.phones) ? record.phones : [record.phones];
  }

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
}

// Нормализация записей доставки (cdek/full)
function normalizeDeliveryRecord(record, normalized) {
  if (record.contact_person) normalized.contactPerson = record.contact_person;
  if (record.phone) normalized.phone = record.phone;
  if (record.email) normalized.email = record.email;
  if (record.pickup_point) normalized.pickupPoint = formatPickupPoint(record.pickup_point);
}

// Нормализация контрагентов доставки (cdek/contragent)
function normalizeDeliveryContragentRecord(record, normalized) {
  if (record.name) normalized.name = record.name;
  if (record.phones) {
    normalized.phones = Array.isArray(record.phones) ? record.phones : [record.phones];
  }
  if (record.address_fact) normalized.addressFact = formatAddress(record.address_fact);
  if (record.address_real) normalized.addressReal = formatAddress(record.address_real);
  if (record.email) {
    normalized.email = Array.isArray(record.email) ? record.email : [record.email];
  }
}

// Нормализация государственных данных (esia_gosuslugi_ru)
function normalizeGovernmentRecord(record, normalized) {
  if (record.full_name) normalized.fullName = record.full_name;
  if (record.phones) {
    normalized.phones = Array.isArray(record.phones) ? record.phones : [record.phones];
  }
  if (record.emails) {
    normalized.emails = Array.isArray(record.emails) ? record.emails : [record.emails];
  }
  if (record.addresses) {
    normalized.addresses = Array.isArray(record.addresses) ? record.addresses : [record.addresses];
  }
}

// Нормализация контактов (getcontact)
function normalizeContactsRecord(record, normalized) {
  if (record.phone) normalized.phone = record.phone;
  if (record.full_name) normalized.fullName = record.full_name;
}

// Нормализация e-commerce (goldapple_ru)
function normalizeEcommerceRecord(record, normalized) {
  if (record.first_name) normalized.firstName = record.first_name;
  if (record.last_name) normalized.lastName = record.last_name;
  if (record.created_at) normalized.createdAt = formatDate(record.created_at);
  if (record.delivered_at) normalized.deliveredAt = formatDate(record.delivered_at);
  if (record.phone) normalized.phone = record.phone;
  if (record.email) normalized.email = record.email;
  if (record.area) normalized.area = record.area;
  if (record.city) normalized.city = record.city;
  if (record.street) normalized.street = record.street;
  if (record.house) normalized.house = record.house;
  if (record.postal_code) normalized.postalCode = record.postal_code;
  if (record.timezone) normalized.timezone = record.timezone;
  if (record.shipping_cost) normalized.shippingCost = record.shipping_cost;
  if (record.products) {
    normalized.products = Array.isArray(record.products) ? record.products : [record.products];
  }
  if (record.comment) normalized.comment = record.comment;
}

// Нормализация маркетплейсов (mm_ru)
function normalizeMarketplaceRecord(record, normalized) {
  if (record.status) normalized.status = record.status;
  if (record.price) normalized.price = record.price;
  if (record.date) normalized.date = formatDate(record.date);
  if (record.first_order) normalized.firstOrder = record.first_order;
  if (record.platform) normalized.platform = record.platform;
  if (record.paid) normalized.paid = record.paid;
  if (record.delivery_date) normalized.deliveryDate = formatDate(record.delivery_date);
  if (record.delivery_city_id) normalized.deliveryCityId = record.delivery_city_id;
}

// Нормализация продвинутых банковских данных (mtsbank_ru/full_2023)
function normalizeBankingAdvancedRecord(record, normalized) {
  if (record.inn) normalized.inn = record.inn;
  if (record.citizenship) normalized.citizenship = record.citizenship;
  if (record.gender) normalized.gender = record.gender;
}

// Нормализация доставки еды (papajohns_ru)
function normalizeFoodDeliveryRecord(record, normalized) {
  if (record.address) normalized.address = record.address;
  if (record.floor) normalized.floor = record.floor;
  if (record.longitude) normalized.longitude = record.longitude;
  if (record.latitude) normalized.latitude = record.latitude;
  if (record.intercom) normalized.intercom = record.intercom;
  if (record.title) normalized.title = record.title;
}

// Нормализация спортивных данных (sportmaster)
function normalizeSportRecord(record, normalized) {
  if (record.want_receive_info) normalized.wantReceiveInfo = record.want_receive_info;
  if (record.dat_recognize) normalized.datRecognize = formatDate(record.dat_recognize);
  if (record.dat_process) normalized.datProcess = formatDate(record.dat_process);
  if (record.updated) normalized.updated = formatDate(record.updated);
  if (record.lang_code) normalized.langCode = record.lang_code;
  if (record.cashier) normalized.cashier = record.cashier;
  if (record.has_sign) normalized.hasSign = record.has_sign;
}

// Нормализация профессиональных данных (unionepro_ru)
function normalizeProfessionalRecord(record, normalized) {
  if (record.recovery) normalized.recovery = record.recovery;
  if (record.token) normalized.token = record.token;
  if (record.stage) normalized.stage = record.stage;
  if (record.time) normalized.time = record.time;
  if (record.user_info) normalized.userInfo = record.user_info;
  if (record.geo) normalized.geo = record.geo;
  if (record.country) normalized.country = record.country;
  if (record.city) normalized.city = record.city;
  if (record.fias_id) normalized.fiasId = record.fias_id;
  if (record.fias_addr) normalized.fiasAddr = record.fias_addr;
  if (record.work) normalized.work = record.work;
  if (record.place) normalized.place = record.place;
  if (record.industry) normalized.industry = record.industry;
  if (record.position) normalized.position = record.position;
  if (record.ogrn) normalized.ogrn = record.ogrn;
  if (record.inn) normalized.inn = record.inn;
  if (record.birthday) normalized.birthday = formatDate(record.birthday);
  if (record.year) normalized.year = record.year;
  if (record.month) normalized.month = record.month;
  if (record.day) normalized.day = record.day;
  if (record.passport) normalized.passport = record.passport;
  if (record.name) normalized.name = record.name;
  if (record.sur_name) normalized.surName = record.sur_name;
  if (record.patronymic) normalized.patronymic = record.patronymic;
  if (record.docs) normalized.docs = record.docs;
  if (record.snils) normalized.snils = record.snils;
  if (record.snils_dop) normalized.snilsDop = record.snils_dop;
  if (record.idDocName) normalized.idDocName = record.idDocName;
  if (record.idDoc) normalized.idDoc = record.idDoc;
  if (record.images) normalized.images = record.images;
  if (record.login) normalized.login = record.login;
  if (record.moderation) normalized.moderation = record.moderation;
  if (record.is_moderated) normalized.isModerated = record.is_moderated;
  if (record.moderation_time) normalized.moderationTime = record.moderation_time;
  if (record.comment) normalized.comment = record.comment;
}

// Нормализация неизвестных данных
function normalizeUnknownRecord(record, normalized) {
  if (record.password) normalized.password = record.password;
}

// Нормализация Yandex Eda
function normalizeYandexEdaRecord(record, normalized) {
  if (record.user_id) normalized.userId = record.user_id;
  if (record.yandex_uid) normalized.yandexUid = record.yandex_uid;
  if (record.amount) normalized.amount = record.amount;
  if (record.currency) normalized.currency = record.currency;
  if (record.app) normalized.app = record.app;
  if (record.user_agent) normalized.userAgent = record.user_agent;
  if (record.payment) normalized.payment = record.payment;
  if (record.service) normalized.service = record.service;
  if (record.status) normalized.status = record.status;
}

// Нормализация общих полей
function normalizeGenericRecord(record, normalized) {
  // Копируем все поля, которые не были обработаны специфическими нормализаторами
  Object.keys(record).forEach(key => {
    if (!normalized.hasOwnProperty(key) && !key.startsWith('_')) {
      normalized[key] = record[key];
    }
  });
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
