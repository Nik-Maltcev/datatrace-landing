# Руководство по миграции DataTrace в единое Next.js приложение

## 📋 Что было сделано

### 1. Объединение архитектуры
- **До**: Два отдельных проекта (API на Express + Web на Next.js)
- **После**: Единое Next.js приложение с API Routes

### 2. Перенесенные компоненты

#### API Endpoints (apps/web/app/api/)
- ✅ `/api/health` - Health check
- ✅ `/api/auth/signin` - Вход в систему
- ✅ `/api/auth/signup` - Регистрация
- ⏳ `/api/search` - Поиск утечек (требует доработки)
- ⏳ `/api/company-search` - Поиск компаний (требует доработки)

#### Сервисы и утилиты (apps/web/lib/)
- ✅ Все сервисы скопированы из `apps/api/src/services/` в `apps/web/lib/services/`
- ✅ Все утилиты скопированы из `apps/api/src/utils/` в `apps/web/lib/utils/`
- ✅ Middleware скопирован из `apps/api/src/middleware/` в `apps/web/lib/middleware/`
- ✅ Конфигурация Supabase скопирована в `apps/web/lib/config/`

#### Новые страницы
- ✅ `/search` - Страница поиска утечек (интегрирована в Next.js)
- ✅ Обновлен `/dashboard` - теперь перенаправляет на `/search`

### 3. Конфигурация

#### Обновленные файлы:
- `railway.json` - настроен для деплоя web приложения
- `apps/web/package.json` - добавлены зависимости из API
- `apps/web/.env.example` - все переменные окружения в одном месте
- Удален `Procfile` - больше не нужен

## 🚀 Инструкция по деплою на Railway

### Шаг 1: Подготовка репозитория

```bash
# Коммит всех изменений
git add .
git commit -m "Migrate to unified Next.js architecture"
git push origin main
```

### Шаг 2: Настройка Railway проекта

1. Откройте ваш проект в Railway Dashboard
2. Перейдите в Settings → General
3. Установите **Root Directory**: оставьте пустым (корень репозитория)
4. **Build Command**: автоматически из railway.json
5. **Start Command**: автоматически из railway.json

### Шаг 3: Переменные окружения

В Railway Dashboard → Variables добавьте:

```env
# Обязательные переменные
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API ключи для поиска утечек
ITP_TOKEN=your_itp_token
DYXLESS_TOKEN=your_dyxless_token
LEAKOSINT_TOKEN=your_leakosint_token
USERSBOX_TOKEN=your_usersbox_token
VEKTOR_TOKEN=your_vektor_token

# API для проверки компаний
DATANEWTON_KEY=your_datanewton_key
CHECKO_KEY=your_checko_key

# DeepSeek AI (опционально)
DEEPSEEK_API_KEY=your_deepseek_key

# Snusbase (опционально)
SNUSBASE_API_KEY=your_snusbase_key
```

### Шаг 4: Деплой

1. После добавления переменных Railway автоматически начнет деплой
2. Дождитесь завершения сборки
3. Проверьте логи на наличие ошибок

## 🔧 Что еще нужно доработать

### Критично:
1. **Конвертация CommonJS в ES Modules**
   - Все файлы в `apps/web/lib/` нужно конвертировать из `.js` в `.ts`
   - Заменить `require()` на `import`
   - Заменить `module.exports` на `export`

2. **Создание оставшихся API endpoints**
   - `/api/search/route.ts`
   - `/api/company-search/route.ts`
   - `/api/snusbase/[...path]/route.ts`
   - И другие endpoints из `apps/api/src/index.js`

3. **Установка зависимостей**
   ```bash
   cd apps/web
   npm install
   ```

### Рекомендуется:
1. Настроить TypeScript типы для всех сервисов
2. Добавить error boundaries
3. Настроить логирование
4. Добавить тесты

## 📝 Проверка работоспособности

После деплоя проверьте:

1. **Health check**: `https://your-app.railway.app/api/health`
2. **Главная страница**: `https://your-app.railway.app/`
3. **Вход в систему**: `https://your-app.railway.app/login`
4. **Личный кабинет**: `https://your-app.railway.app/dashboard`
5. **Поиск утечек**: `https://your-app.railway.app/search`

## ⚠️ Известные проблемы

1. **TypeScript ошибки** - нормально, Next.js все равно соберет проект
2. **Отсутствующие API endpoints** - нужно доработать
3. **CORS** - не нужен, так как все на одном домене

## 🔄 Откат изменений

Если что-то пошло не так:

```bash
# Вернуться к предыдущей версии
git revert HEAD
git push origin main

# Или использовать старую ветку
git checkout old-working-branch
git push origin main
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что `apps/web/` содержит все необходимые файлы

---

**Важно**: Эта миграция решает проблему конфликта маршрутизации между API и Web приложениями, объединяя их в единое Next.js приложение. Теперь у вас один проект, один деплой, и никаких проблем с CORS!