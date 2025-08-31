# 🔍 Диагностика ошибки 404 - Пошаговое руководство

## 🚨 Текущая ошибка
```
Failed to load resource: the server responded with a status of 404
API Request Error: Error: Server returned 404
Registration error: Error: Server returned 404
```

## 📋 Шаги диагностики

### Шаг 1: Откройте страницу диагностики
1. Перейдите на: `http://localhost:3000/api-test` (или ваш домен)
2. Нажмите "Тестировать API"
3. Посмотрите результаты в консоли

### Шаг 2: Проверьте переменные окружения

#### Локальная разработка:
```bash
# Создайте apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Railway деплой:
```bash
# В Railway Dashboard → Variables добавьте:
NEXT_PUBLIC_API_URL=https://your-api-service.railway.app
```

### Шаг 3: Проверьте консоль браузера
Откройте DevTools (F12) и посмотрите на сообщения:
- 🔧 API Configuration
- 🌐 Making API request to
- 📡 Response status

### Шаг 4: Ручная проверка API

#### Проверьте health endpoint:
```bash
# Локально
curl http://localhost:3000/health

# На Railway
curl https://your-api-service.railway.app/health
```

#### Проверьте signup endpoint:
```bash
# Локально
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test","phone":"+7999123456"}'

# На Railway
curl -X POST https://your-api-service.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test","phone":"+7999123456"}'
```

## 🔧 Возможные причины и решения

### ❌ Причина 1: Неправильный API URL
**Симптомы:**
- В консоли: `Using API_BASE_URL: http://localhost:3000`
- Но вы на Railway или другом домене

**Решение:**
```bash
# Установите правильную переменную окружения
NEXT_PUBLIC_API_URL=https://your-actual-api-domain.railway.app
```

### ❌ Причина 2: API сервер не запущен
**Симптомы:**
- Health endpoint возвращает ошибку подключения
- В Railway логах ошибки запуска

**Решение:**
1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные Supabase установлены
3. Проверьте, что PORT=3000 в переменных

### ❌ Причина 3: Неправильная настройка Railway
**Симптомы:**
- API и Frontend в одном проекте
- Но API endpoints недоступны

**Решение:**
Создайте раздельные проекты:
1. **API проект** - только `apps/api`
2. **Frontend проект** - только `apps/web`

### ❌ Причина 4: CORS проблемы
**Симптомы:**
- API отвечает, но браузер блокирует запросы
- CORS ошибки в консоли

**Решение:**
Проверьте `FRONTEND_URL` в API проекте:
```bash
FRONTEND_URL=https://your-frontend-domain.railway.app
```

## 🎯 Быстрое решение

### Для локальной разработки:
1. Создайте `apps/web/.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```
2. Перезапустите фронтенд: `npm run dev`

### Для Railway:
1. **Создайте 2 отдельных проекта**
2. **API проект** переменные:
   ```bash
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://your-frontend.railway.app
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. **Frontend проект** переменные:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```

## ✅ Проверка успешности

После исправления:
1. Откройте `/api-test` - все тесты должны быть зелеными
2. Откройте `/register` - форма должна работать без ошибок 404
3. В консоли браузера не должно быть ошибок API

---

**Если проблема остается, пришлите результаты с страницы `/api-test`** 🔍