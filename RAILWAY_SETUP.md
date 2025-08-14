# Railway Deployment для DataTrace

## Настройка деплоя на Railway

### 1. Подключение репозитория

1. Зайдите на [railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите ваш GitHub репозиторий
4. Railway автоматически определит Node.js проект

### 2. Настройка переменных окружения

В Railway Dashboard добавьте следующие переменные:

#### Обязательные переменные:

```bash
# Server
PORT=3000
NODE_ENV=production

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# DeHashed (для проверки паролей)
DEHASHED_API_KEY=your_dehashed_api_key
DEHASHED_BASE_URL=https://api.dehashed.com
```

#### Опциональные переменные (источники данных):

```bash
# Data Sources
ITP_TOKEN=your_itp_token
ITP_BASE=https://datatech.work

DYXLESS_TOKEN=your_dyxless_token
DYXLESS_BASE=https://api-dyxless.cfd

LEAKOSINT_TOKEN=your_leakosint_token

USERSBOX_TOKEN=your_usersbox_token

VEKTOR_TOKEN=your_vektor_token

# Company Check APIs
DATANEWTON_KEY=your_datanewton_key
DATANEWTON_BASE=https://api.datanewton.ru/v1

CHECKO_KEY=your_checko_key
CHECKO_BASE=https://api.checko.ru/v2
```

### 3. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Включите Email аутентификацию в Authentication > Settings
3. Скопируйте Project URL и API keys в Railway
4. Настройте RLS политики (опционально)

### 4. Конфигурация Railway

Railway использует файл `railway.json` в корне проекта:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/api && npm install"
  },
  "deploy": {
    "startCommand": "cd apps/api && npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5. Деплой

1. Сделайте commit и push в main ветку
2. Railway автоматически начнет деплой
3. Проверьте логи в Railway Dashboard
4. Приложение будет доступно по сгенерированному URL

### 6. Проверка деплоя

После успешного деплоя проверьте:

- Главная страница загружается: `https://your-app.railway.app`
- API отвечает: `https://your-app.railway.app/api/dehashed-info`
- Аутентификация работает (попробуйте зарегистрироваться)

### 7. Настройка домена (опционально)

1. В Railway Dashboard перейдите в Settings
2. Добавьте Custom Domain
3. Настройте DNS записи у вашего провайдера

### Troubleshooting

#### Проблема: Build fails
- Проверьте, что все зависимости указаны в `apps/api/package.json`
- Убедитесь, что Node.js версия совместима (>=18.0.0)

#### Проблема: App crashes on start
- Проверьте логи в Railway Dashboard
- Убедитесь, что все обязательные переменные окружения установлены
- Проверьте, что PORT переменная установлена в 3000

#### Проблема: 502 Bad Gateway
- Проверьте, что приложение слушает правильный порт (`process.env.PORT`)
- Убедитесь, что healthcheck path `/` доступен

#### Проблема: OpenAI не работает
- Проверьте валидность OPENAI_API_KEY
- Убедитесь, что у вас есть кредиты на OpenAI аккаунте
- Проверьте модель в OPENAI_MODEL (gpt-4, gpt-3.5-turbo)

#### Проблема: Supabase аутентификация не работает
- Проверьте правильность SUPABASE_URL и ключей
- Убедитесь, что Email аутентификация включена в Supabase
- Проверьте CORS настройки в Supabase

### Мониторинг

Railway предоставляет:
- Логи приложения в реальном времени
- Метрики использования ресурсов
- Уведомления о сбоях
- Автоматические перезапуски при ошибках

### Масштабирование

Для увеличения производительности:
1. Обновите план Railway для больших ресурсов
2. Настройте горизонтальное масштабирование
3. Добавьте Redis для кеширования (опционально)
4. Настройте CDN для статических файлов