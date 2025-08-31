#!/usr/bin/env node

// Скрипт для проверки настроек DataTrace
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка настроек DataTrace...\n');

// Проверка структуры проекта
console.log('📁 Структура проекта:');
const requiredDirs = [
  'apps/api',
  'apps/web',
  'apps/api/src',
  'apps/web/app'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    console.log(`❌ ${dir} - отсутствует`);
  }
});

// Проверка файлов конфигурации
console.log('\n📄 Файлы конфигурации:');
const configFiles = [
  'apps/api/package.json',
  'apps/web/package.json',
  'apps/api/src/index.js',
  'apps/web/lib/api.ts',
  'apps/api/supabase_setup.sql'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - отсутствует`);
  }
});

// Проверка переменных окружения API
console.log('\n🔧 Переменные окружения API:');
const apiEnvFile = 'apps/api/.env';
if (fs.existsSync(apiEnvFile)) {
  console.log(`✅ ${apiEnvFile} существует`);
  const envContent = fs.readFileSync(apiEnvFile, 'utf8');
  
  const requiredApiVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  requiredApiVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} - найден`);
    } else {
      console.log(`❌ ${varName} - отсутствует`);
    }
  });
} else {
  console.log(`❌ ${apiEnvFile} - создайте файл на основе .env.example`);
}

// Проверка переменных окружения Web
console.log('\n🌐 Переменные окружения Web:');
const webEnvFile = 'apps/web/.env.local';
if (fs.existsSync(webEnvFile)) {
  console.log(`✅ ${webEnvFile} существует`);
  const envContent = fs.readFileSync(webEnvFile, 'utf8');
  
  if (envContent.includes('NEXT_PUBLIC_API_URL')) {
    console.log(`✅ NEXT_PUBLIC_API_URL - найден`);
  } else {
    console.log(`❌ NEXT_PUBLIC_API_URL - отсутствует`);
  }
} else {
  console.log(`❌ ${webEnvFile} - создайте файл:`);
  console.log(`   echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > ${webEnvFile}`);
}

// Проверка зависимостей
console.log('\n📦 Зависимости:');
const packageFiles = [
  'apps/api/package.json',
  'apps/web/package.json'
];

packageFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    const nodeModulesDir = path.join(path.dirname(file), 'node_modules');
    
    if (fs.existsSync(nodeModulesDir)) {
      console.log(`✅ ${path.dirname(file)} - зависимости установлены`);
    } else {
      console.log(`❌ ${path.dirname(file)} - выполните: cd ${path.dirname(file)} && npm install`);
    }
  }
});

// Рекомендации
console.log('\n🎯 Рекомендации для исправления 404:');
console.log('1. Убедитесь, что API сервер запущен: cd apps/api && npm start');
console.log('2. Убедитесь, что Web сервер запущен: cd apps/web && npm run dev');
console.log('3. Создайте apps/web/.env.local с NEXT_PUBLIC_API_URL=http://localhost:3000');
console.log('4. Откройте http://localhost:3000/api-test для диагностики');

console.log('\n📚 Документация:');
console.log('- DEBUG_404_STEPS.md - пошаговая диагностика');
console.log('- RAILWAY_404_FIX.md - исправление для Railway');
console.log('- SETUP_GUIDE.md - полное руководство по настройке');

console.log('\n✅ Проверка завершена!');