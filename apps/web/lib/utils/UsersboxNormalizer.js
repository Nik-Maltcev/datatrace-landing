// UsersboxNormalizer.js - Упрощенный нормализатор данных Usersbox

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
  if (record.phone) normalized.phone = record.phone;
  if (record.email) normalized.email = record.email;
  if (record.address) normalized.address = record.address;
  if (record.birth_date) normalized.birthDate = record.birth_date;
  if (record.gender) normalized.gender = record.gender;
  if (record.inn) normalized.inn = record.inn;

  // Банковские данные
  if (record.accounts) {
    normalized.accounts = Array.isArray(record.accounts) ? record.accounts : [record.accounts];
  }
  if (record.cards) {
    normalized.cards = Array.isArray(record.cards) ? record.cards : [record.cards];
  }

  // Копируем остальные поля
  Object.keys(record).forEach(key => {
    if (!normalized.hasOwnProperty(key) && !key.startsWith('_')) {
      normalized[key] = record[key];
    }
  });

  return normalized;
}

module.exports = {
  normalizeUsersboxData
};