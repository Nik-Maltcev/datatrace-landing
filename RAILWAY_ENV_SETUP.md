# Railway Environment Variables Setup для DataTrace с Supabase

## Required Environment Variables for Railway

Add these environment variables in your Railway project dashboard:

### Core Configuration
```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app.railway.app
```

### Supabase Configuration (ОБЯЗАТЕЛЬНО для аутентификации)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### DeepSeek AI Configuration (заменяет OpenAI)
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### Data Sources API Keys (опционально)
```
SNUSBASE_API_KEY=sb99cd2vxyohst65mh98ydz6ud844l
DEHASHED_API_KEY=your_dehashed_api_key
ITP_TOKEN=your_itp_token
DYXLESS_TOKEN=your_dyxless_token
LEAKOSINT_TOKEN=your_leakosint_token
USERSBOX_TOKEN=your_usersbox_token
VEKTOR_TOKEN=your_vektor_token
```

### Company Check APIs (опционально)
```
DATANEWTON_KEY=your_datanewton_key
DATANEWTON_BASE=https://api.datanewton.ru/v1
CHECKO_KEY=your_checko_key
CHECKO_BASE=https://api.checko.ru/v2
```

## Steps to Add Variables in Railway:

### 1. Настройка Supabase (ОБЯЗАТЕЛЬНО)

1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL скрипт из `apps/api/supabase_setup.sql` в SQL Editor
3. Получите ключи из Settings → API:
   - Project URL → `SUPABASE_URL`
   - anon public → `SUPABASE_ANON_KEY`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Добавление переменных в Railway

1. Open your Railway project dashboard
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add ОБЯЗАТЕЛЬНЫЕ переменные:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `FRONTEND_URL` = `https://your-app.railway.app` (замените на ваш URL)
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `your_anon_key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your_service_role_key`
5. Click **"Add"** для каждой переменной
6. Добавьте опциональные переменные по необходимости
7. **Deploy** or **Redeploy** your application

### 3. Обновление FRONTEND_URL

После деплоя обновите переменную `FRONTEND_URL` на актуальный URL вашего приложения.

## Testing the Setup:

### 1. Тест основного функционала:
```
GET https://your-app.railway.app/
```

### 2. Тест Supabase подключения:
```
GET https://your-app.railway.app/api/auth/user
```

### 3. Тест регистрации:
```
POST https://your-app.railway.app/api/auth/signup
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "phone": "+7 999 123 45 67"
}
```

Should return:
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "user_metadata": {
      "name": "Test User",
      "phone": "+7 999 123 45 67"
    }
  },
  "message": "Проверьте email для подтверждения регистрации"
}
```

### 4. Тест Snusbase (если настроен):
```
GET https://your-app.railway.app/api/snusbase/test
```

## Security Notes:

- Never commit API keys to git
- Use different keys for development and production
- Keep the `.env` file in `.gitignore`
- Use Railway's secure variable storage for production keys
- Supabase Service Role Key имеет полные права - храните его в секрете

## Troubleshooting:

### ❌ "Authentication service not available"
**Причина:** Неправильно настроены переменные Supabase
**Решение:**
1. Проверьте `SUPABASE_URL` - должен быть в формате `https://xxx.supabase.co`
2. Проверьте `SUPABASE_ANON_KEY` - публичный ключ из Settings → API
3. Проверьте `SUPABASE_SERVICE_ROLE_KEY` - приватный ключ из Settings → API

### ❌ "Name and phone are required"
**Причина:** Фронтенд отправляет неполные данные
**Решение:**
1. Убедитесь, что все поля заполнены на фронтенде
2. Проверьте, что `FRONTEND_URL` указывает на правильный домен

### ❌ Build fails в Railway
**Причина:** Проблемы с зависимостями или конфигурацией
**Решение:**
1. Проверьте `railway.json` в корне проекта
2. Убедитесь, что `NODE_ENV=production`
3. Проверьте логи сборки в Railway Dashboard

### ❌ 502 Bad Gateway
**Причина:** Приложение не запускается или слушает неправильный порт
**Решение:**
1. Убедитесь, что `PORT=3000` в переменных окружения
2. Проверьте логи приложения в Railway Dashboard
3. Убедитесь, что все обязательные переменные установлены

### ❌ CORS ошибки
**Причина:** Неправильная настройка CORS для фронтенда
**Решение:**
1. Обновите `FRONTEND_URL` на актуальный URL Railway
2. Проверьте настройки CORS в Supabase Dashboard
3. Добавьте ваш домен в разрешенные origins в Supabase

### ❌ Email confirmation не работает
**Причина:** Неправильная настройка redirect URL в Supabase
**Решение:**
1. В Supabase Dashboard → Authentication → URL Configuration
2. Добавьте ваш Railway URL в Site URL
3. Добавьте redirect URLs для email confirmation

## Полезные команды для отладки:

### Проверка переменных окружения:
```bash
# В Railway CLI
railway variables

# Или через API
curl -H "Authorization: Bearer $RAILWAY_TOKEN" \
  https://backboard.railway.app/graphql/v2
```

### Просмотр логов:
```bash
# В Railway CLI
railway logs

# Или в Railway Dashboard → Deployments → View Logs
```

### Тест подключения к Supabase:
```bash
curl -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/
```

## Checklist для деплоя:

- [ ] ✅ Supabase проект создан
- [ ] ✅ SQL скрипт выполнен в Supabase
- [ ] ✅ Все обязательные переменные добавлены в Railway
- [ ] ✅ `FRONTEND_URL` обновлен на актуальный Railway URL
- [ ] ✅ Приложение успешно задеплоено
- [ ] ✅ Главная страница открывается
- [ ] ✅ Регистрация работает
- [ ] ✅ Вход в систему работает
- [ ] ✅ Email confirmation настроен (опционально)
