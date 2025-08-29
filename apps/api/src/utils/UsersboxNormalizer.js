// UsersboxNormalizer.js - Нормализация данных Usersbox

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

  // Нормализация персональных данных
  if (record.full_name) normalized.fullName = record.full_name;
  if (record.first_name) normalized.firstName = record.first_name;
  if (record.last_name) normalized.lastName = record.last_name;
  if (record.name) normalized.name = record.name;
  if (record.contact_person) normalized.contactPerson = record.contact_person;

  // Нормализация дат
  if (record.birth_date) {
    normalized.birthDate = formatDate(record.birth_date);
  }
  if (record.created_at) {
    normalized.createdAt = formatDate(record.created_at);
  }
  if (record.delivered_at) {
    normalized.deliveredAt = formatDate(record.delivered_at);
  }

  // Нормализация контактов
  if (record.phone) {
    normalized.phone = Array.isArray(record.phone) ? record.phone : [record.phone];
  }
  if (record.phones) {
    normalized.phone = Array.isArray(record.phones) ? record.phones : [record.phones];
  }
  if (record.email) {
    normalized.email = Array.isArray(record.email) ? record.email : [record.email];
  }
  if (record.emails) {
    normalized.email = Array.isArray(record.emails) ? record.emails : [record.emails];
  }

  // Нормализация контактов из структуры
  if (record.contacts) {
    if (record.contacts.phones) {
      normalized.phone = record.contacts.phones;
    }
    if (record.contacts.emails) {
      normalized.email = record.contacts.emails;
    }
  }

  // Нормализация адресов
  if (record.addresses) {
    normalized.addresses = Array.isArray(record.addresses) ? record.addresses : [record.addresses];
  }
  if (record.address_fact) {
    normalized.addressFact = formatAddress(record.address_fact);
  }
  if (record.address_real) {
    normalized.addressReal = formatAddress(record.address_real);
  }

  // Географические данные
  if (record.area) normalized.area = record.area;
  if (record.city) normalized.city = record.city;
  if (record.street) normalized.street = record.street;
  if (record.house) normalized.house = record.house;
  if (record.postal_code) normalized.postalCode = record.postal_code;
  if (record.timezone) normalized.timezone = record.timezone;

  // Точка выдачи CDEK
  if (record.pickup_point) {
    normalized.pickupPoint = formatPickupPoint(record.pickup_point);
  }

  // Банковские данные
  if (record.accounts) {
    normalized.accounts = record.accounts;
  }

  // Заказы и продукты
  if (record.products) {
    normalized.products = record.products;
  }
  if (record.shipping_cost) normalized.shippingCost = record.shipping_cost;
  if (record.comment) normalized.comment = record.comment;

  // Прочие поля
  Object.keys(record).forEach(key => {
    if (!normalized.hasOwnProperty(key) && !key.startsWith('_') && 
        !['full_name', 'first_name', 'last_name', 'name', 'contact_person', 
          'birth_date', 'created_at', 'delivered_at', 'phone', 'phones', 
          'email', 'emails', 'contacts', 'addresses', 'address_fact', 'address_real',
          'area', 'city', 'street', 'house', 'postal_code', 'timezone',
          'pickup_point', 'accounts', 'products', 'shipping_cost', 'comment'].includes(key)) {
      normalized[key] = record[key];
    }
  });

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
