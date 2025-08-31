# Руководство по настройке кастомной регистрации с Supabase

## 🚀 Быстрый старт

### 1. Настройка Supabase

1. **Создайте проект в Supabase:**
   - Перейдите на [supabase.com](https://supabase.com)
   - Создайте новый проект
   - Дождитесь завершения инициализации

2. **Получите ключи API:**
   - Перейдите в Settings → API
   - Скопируйте:
     - `Project URL` (SUPABASE_URL)
     - `anon public` ключ (SUPABASE_ANON_KEY)
     - `service_role secret` ключ (SUPABASE_SERVICE_ROLE_KEY)

3. **Настройте базу данных:**
   - Перейдите в SQL Editor
   - Выполните скрипт из файла `apps/api/supabase_setup.sql`

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта и в папке `apps/api/`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Установка зависимостей

```bash
# Установка зависимостей для API
cd apps/api
npm install

# Установка зависимостей для веб-приложения
cd ../web
npm install
```

### 4. Запуск приложения

```bash
# Запуск API сервера (в папке apps/api)
npm start

# Запуск веб-приложения (в папке apps/web)
npm run dev
```

## 🧪 Тестирование

### Автоматическое тестирование

```bash
# Запуск тестов регистрации
cd apps/api
node ../../tmp_rovodev_test_registration.js
```

### Ручное тестирование

1. **Откройте браузер:** http://localhost:3000
2. **Перейдите на страницу регистрации:** `/register`
3. **Заполните форму:**
   - Имя: `Иван Иванов`
   - Email: `test@example.com`
   - Телефон: `+7 999 123 45 67`
   - Пароль: `password123`
   - Подтверждение пароля: `password123`
4. **Нажмите "Зарегистрироваться"**

### Проверка в Supabase

1. **Перейдите в Supabase Dashboard**
2. **Authentication → Users** - проверьте создание пользователя
3. **Table Editor → user_profiles** - проверьте создание профиля

## 📋 Функциональность

### ✅ Реализовано

- [x] Кастомная регистрация с дополнительными полями
- [x] Валидация на фронтенде и бэкенде
- [x] Интеграция с Supabase Auth
- [x] Создание профилей пользователей в отдельной таблице
- [x] Row Level Security (RLS) для безопасности
- [x] API endpoints для регистрации и входа
- [x] Обновленные страницы регистрации и входа
- [x] Автоматические тесты

### 🔧 Структура данных

**Обязательные поля при регистрации:**
- Email (валидация формата)
- Пароль (минимум 6 символов)
- Имя (обязательное поле)
- Номер телефона (валидация формата)

**Хранение данных:**
- `auth.users` - основная аутентификация Supabase
- `user_profiles` - дополнительная информация (имя, телефон)

### 🛡️ Безопасность

- **RLS политики** для защиты данных пользователей
- **Валидация входных данных** на всех уровнях
- **Санитизация ответов API** (удаление чувствительных данных)
- **Безопасное хранение токенов** в localStorage

## 🔍 API Endpoints

### POST /api/auth/signup
Регистрация нового пользователя

**Параметры:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Иван Иванов",
  "phone": "+7 999 123 45 67"
}
```

### POST /api/auth/signin
Вход в систему

**Параметры:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### GET /api/auth/user
Получение информации о пользователе (требует авторизации)

### GET /api/auth/profile
Получение профиля пользователя (требует авторизации)

## 🐛 Troubleshooting

### Частые проблемы

1. **"Authentication service not available"**
   ```bash
   # Проверьте переменные окружения
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   ```

2. **"Name and phone are required"**
   - Убедитесь, что передаете все обязательные поля в запросе

3. **"Invalid phone number format"**
   - Используйте формат: `+7 999 123 45 67` или `79991234567`

4. **Ошибки подключения к базе данных**
   ```sql
   -- Проверьте создание таблицы в Supabase SQL Editor
   SELECT * FROM user_profiles LIMIT 1;
   ```

### Логи для отладки

```bash
# Просмотр логов API сервера
cd apps/api
npm start

# В другом терминале - тестирование
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","phone":"+7 999 123 45 67"}'
```

## 📚 Дополнительная документация

- [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) - Подробная документация по интеграции
- [apps/api/supabase_setup.sql](./apps/api/supabase_setup.sql) - SQL скрипт для настройки БД

## 🎯 Следующие шаги

1. **Email подтверждение** - настройка email templates в Supabase
2. **Восстановление пароля** - реализация сброса пароля
3. **Профиль пользователя** - страница редактирования профиля
4. **Валидация телефона** - SMS подтверждение номера
5. **Социальные сети** - вход через Google, GitHub и т.д.

---

**Готово!** 🎉 Ваша кастомная регистрация с Supabase настроена и готова к использованию.