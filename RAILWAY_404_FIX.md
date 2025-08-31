# 🔧 Исправление ошибки 404 "Unexpected token <!DOCTYPE"

## 🚨 Проблема
```
Failed to load resource: the server responded with a status of 404
Registration error: SyntaxError: Unexpected token <!DOCTYPE... is not valid JSON
```

## 🔍 Причина
Фронтенд пытается обратиться к API по относительному пути `/api/auth/signup`, но получает HTML страницу 404 вместо JSON ответа.

## ✅ Решение

### 1. Обновите код (уже сделано)
Мы обновили код для использования абсолютных URL через `@/lib/api.ts`.

### 2. Настройте переменные окружения

#### Вариант A: Раздельные проекты в Railway (рекомендуется)

**Создайте 2 проекта в Railway:**

1. **API проект** (`apps/api`):
   ```bash
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://your-frontend.railway.app
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Frontend проект** (`apps/web`):
   ```bash
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```

#### Вариант B: Один проект (если хотите все в одном)

**Настройте railway.json для обслуживания и API и фронтенда:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && cd apps/api && npm install && cd ../web && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd apps/api && npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100
  }
}
```

### 3. Проверьте настройки

#### В Railway Dashboard:
1. **Variables** → убедитесь, что все переменные добавлены
2. **Deployments** → проверьте логи сборки
3. **Settings** → проверьте домены

#### Тестирование:
```bash
# Проверьте API напрямую
curl https://your-api.railway.app/api/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test","phone":"+7999123456"}'

# Проверьте фронтенд
curl https://your-frontend.railway.app/
```

## 🛠️ Troubleshooting

### ❌ API возвращает 404
**Проверьте:**
- Правильно ли настроен `railway.json` или `railway.toml`
- Запускается ли API сервер на правильном порту
- Доступен ли endpoint `/api/auth/signup`

**Решение:**
```bash
# Проверьте логи в Railway Dashboard
# Убедитесь, что сервер слушает PORT из переменных окружения
```

### ❌ CORS ошибки
**Проверьте:**
- Настроен ли CORS в API для фронтенд домена
- Правильно ли указан `FRONTEND_URL` в API проекте

**Решение:**
```javascript
// В apps/api/src/index.js должно быть:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### ❌ Переменные не загружаются
**Проверьте:**
- Добавлены ли переменные в Railway Dashboard
- Правильно ли названы переменные (с префиксом `NEXT_PUBLIC_` для фронтенда)
- Сделан ли redeploy после добавления переменных

## 🎯 Быстрое решение

1. **Создайте 2 проекта в Railway**
2. **API проект:** подключите папку `apps/api`
3. **Frontend проект:** подключите папку `apps/web`
4. **Добавьте переменные** как указано выше
5. **Обновите URLs** после деплоя
6. **Тестируйте** регистрацию

## ✅ Проверка успешности

После исправления вы должны увидеть:
- ✅ Фронтенд загружается без ошибок
- ✅ Форма регистрации отправляется успешно
- ✅ Получаете JSON ответ от API
- ✅ Пользователь создается в Supabase

---

**Готово!** 🎉 Ошибка 404 должна быть исправлена.