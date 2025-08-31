# Интеграция с Supabase

Этот документ описывает настройку кастомной регистрации с Supabase, включающей дополнительные поля (имя и номер телефона).

## Настройка Supabase

### 1. Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Получите следующие данные из настроек проекта:
   - `SUPABASE_URL` - URL вашего проекта
   - `SUPABASE_ANON_KEY` - публичный ключ
   - `SUPABASE_SERVICE_ROLE_KEY` - приватный ключ для серверных операций

### 2. Настройка базы данных

Выполните SQL скрипт из файла `apps/api/supabase_setup.sql` в SQL Editor вашего Supabase проекта:

```sql
-- Создание таблицы для профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Настройка переменных окружения

Добавьте в файл `.env` (на основе `.env.example`):

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Структура регистрации

### Обязательные поля

- **Email** - адрес электронной почты
- **Password** - пароль (минимум 6 символов)
- **Name** - полное имя пользователя
- **Phone** - номер телефона

### Валидация

#### На фронтенде:
- Проверка совпадения паролей
- Проверка заполнения всех полей
- Валидация формата номера телефона

#### На бэкенде:
- Валидация email формата
- Проверка длины пароля
- Валидация номера телефона (regex: `^[\+]?[1-9][\d]{0,15}$`)

## API Endpoints

### POST /api/auth/signup

Регистрация нового пользователя.

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Иван Иванов",
  "phone": "+7 999 123 45 67"
}
```

**Ответ при успехе:**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "name": "Иван Иванов",
      "phone": "+7 999 123 45 67"
    },
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  },
  "message": "Проверьте email для подтверждения регистрации"
}
```

### GET /api/auth/user

Получение информации о текущем пользователе (требует авторизации).

**Ответ:**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {...},
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "Иван Иванов",
      "phone": "+7 999 123 45 67",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### GET /api/auth/profile

Получение профиля пользователя (требует авторизации).

## Безопасность

### Row Level Security (RLS)

Таблица `user_profiles` защищена политиками RLS:

- Пользователи могут видеть только свои профили
- Пользователи могут обновлять только свои профили
- Только аутентифицированные пользователи могут создавать профили
- Пользователи могут удалять только свои профили

### Валидация данных

- Email проверяется на корректность формата
- Номер телефона валидируется регулярным выражением
- Пароль должен содержать минимум 6 символов
- Все поля обрезаются от лишних пробелов

## Использование на фронтенде

### Регистрация

```typescript
const handleRegister = async (formData) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      phone: formData.phone
    })
  });

  const result = await response.json();
  
  if (result.ok) {
    // Сохранение данных пользователя
    localStorage.setItem("user", JSON.stringify({
      id: result.user?.id,
      email: result.user?.email,
      name: result.user?.user_metadata?.name,
      phone: result.user?.user_metadata?.phone,
      isAuthenticated: true
    }));
    
    // Сохранение токенов
    if (result.session) {
      localStorage.setItem("access_token", result.session.access_token);
      localStorage.setItem("refresh_token", result.session.refresh_token);
    }
  }
};
```

## Troubleshooting

### Частые ошибки

1. **"Authentication service not available"**
   - Проверьте настройки SUPABASE_URL и SUPABASE_ANON_KEY

2. **"Name and phone are required"**
   - Убедитесь, что передаете все обязательные поля

3. **"Invalid phone number format"**
   - Проверьте формат номера телефона (должен содержать только цифры и опциональный +)

4. **"User already registered"**
   - Пользователь с таким email уже существует

### Логирование

В режиме разработки (`NODE_ENV=development`) в ответах API включаются детали ошибок для отладки.