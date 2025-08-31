# 🚀 Railway Variables - Шпаргалка для копирования

## 📋 ОБЯЗАТЕЛЬНЫЕ переменные для Railway

Скопируйте и вставьте в Railway Dashboard → Variables:

### Core Settings
```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app.railway.app
```

### Supabase (ОБЯЗАТЕЛЬНО для аутентификации)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

---

## 🔧 ОПЦИОНАЛЬНЫЕ переменные

### DeepSeek AI (для AI функций)
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### Data Sources APIs
```
SNUSBASE_API_KEY=your_snusbase_api_key
DEHASHED_API_KEY=your_dehashed_api_key
DEHASHED_BASE_URL=https://api.dehashed.com
ITP_TOKEN=your_itp_token
ITP_BASE=https://datatech.work
DYXLESS_TOKEN=your_dyxless_token
DYXLESS_BASE=https://api-dyxless.cfd
LEAKOSINT_TOKEN=your_leakosint_token
USERSBOX_TOKEN=your_usersbox_token
VEKTOR_TOKEN=your_vektor_token
```

### Company Check APIs
```
DATANEWTON_KEY=your_datanewton_key
DATANEWTON_BASE=https://api.datanewton.ru/v1
CHECKO_KEY=your_checko_key
CHECKO_BASE=https://api.checko.ru/v2
```

---

## 🎯 Быстрая настройка (5 минут)

### 1. Создайте Supabase проект
1. Идите на [supabase.com](https://supabase.com) → New Project
2. SQL Editor → выполните скрипт из `apps/api/supabase_setup.sql`
3. Settings → API → скопируйте ключи

### 2. Настройте Railway проекты

#### Вариант A: Один проект (API + Frontend)
```bash
# Переменные для объединенного деплоя:
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app.railway.app
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Вариант B: Раздельные проекты (рекомендуется)
**API проект:**
```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend.railway.app
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Frontend проект:**
```bash
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

### 3. Деплой и тест
1. Railway автоматически задеплоит оба проекта
2. Обновите переменные на актуальные URLs
3. Тест: откройте фронтенд и попробуйте регистрацию

---

## ⚡ Копируй-вставляй команды

### Тест регистрации через curl:
```bash
curl -X POST https://your-app.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone": "+7 999 123 45 67"
  }'
```

### Тест входа через curl:
```bash
curl -X POST https://your-app.railway.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Проверка здоровья приложения:
```bash
curl https://your-app.railway.app/health
```

---

## 🔍 Где взять ключи

| Переменная | Где получить |
|------------|--------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role secret |
| `DEEPSEEK_API_KEY` | [platform.deepseek.com](https://platform.deepseek.com) → API Keys |
| `SNUSBASE_API_KEY` | Snusbase Dashboard → API |
| `DEHASHED_API_KEY` | DeHashed Dashboard → API |

---

## 🚨 Важные заметки

- ⚠️ **FRONTEND_URL** - обновите после первого деплоя на актуальный Railway URL
- 🔒 **SERVICE_ROLE_KEY** - имеет полные права, храните в секрете
- 📧 **Email confirmation** - настройте Site URL в Supabase для production
- 🔄 **Redeploy** - после изменения переменных сделайте redeploy

---

## ✅ Checklist

- [ ] Supabase проект создан
- [ ] SQL скрипт выполнен
- [ ] 6 обязательных переменных добавлены в Railway
- [ ] Приложение задеплоено
- [ ] FRONTEND_URL обновлен
- [ ] Регистрация работает
- [ ] Вход работает

**Готово!** 🎉