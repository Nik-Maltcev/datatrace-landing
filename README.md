# DataTrace - Система поиска утечек данных

Комплексная система для поиска утечек персональных данных, анализа компаний и проверки паролей с интеграцией ИИ.

## 🚀 Возможности

- 🔍 **Поиск утечек данных** - проверка по телефону, email, соцсетям, ИНН, СНИЛС
- 🏢 **Анализ компаний** - детальная информация по ИНН из официальных источников  
- 🔐 **Проверка паролей** - проверка компрометации паролей через DeHashed API
- 🤖 **ИИ анализ** - структурированные сводки через OpenAI GPT-4/GPT-5
- 🔐 **Аутентификация** - полная система авторизации через Supabase
- ⚡ **Rate Limiting** - защита от злоупотреблений
- 🛡️ **Обработка ошибок** - централизованная система обработки ошибок

## 📁 Структура проекта

```
├── apps/
│   └── api/                     # Основное API приложение
│       ├── src/
│       │   ├── config/          # Конфигурация (Supabase)
│       │   ├── middleware/      # Middleware (аутентификация)
│       │   ├── services/        # Сервисы (OpenAI, Auth, DeHashed)
│       │   ├── utils/           # Утилиты (ErrorHandler)
│       │   └── index.js         # Основной файл сервера
│       ├── public/              # Фронтенд приложение
│       ├── tests/               # Тесты
│       └── README.md            # Документация API
├── .kiro/                       # Спецификации и планы разработки
└── README.md                    # Этот файл
```

## 🛠 Быстрый старт

### Локальная разработка

1. **Клонируйте репозиторий:**
   ```bash
   git clone <your-repo-url>
   cd datatrace
   ```

2. **Установите зависимости:**
   ```bash
   cd apps/api
   npm install
   ```

3. **Настройте переменные окружения:**
   ```bash
   cp .env.example .env
   # Заполните все необходимые ключи в .env
   ```

4. **Запустите сервер:**
   ```bash
   npm run dev
   ```

Приложение будет доступно по адресу `http://localhost:3000`

### Деплой на Railway

1. **Подключите репозиторий к Railway**
2. **Настройте переменные окружения** в Railway Dashboard
3. **Railway автоматически развернет приложение** используя конфигурацию из `railway.json`

## 🔧 Конфигурация

### Обязательные переменные окружения

```bash
# OpenAI для ИИ анализа
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Supabase для аутентификации
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# DeHashed для проверки паролей
DEHASHED_API_KEY=your_dehashed_api_key
```

### Опциональные API ключи источников данных

```bash
# Источники утечек
ITP_TOKEN=your_itp_token
DYXLESS_TOKEN=your_dyxless_token
LEAKOSINT_TOKEN=your_leakosint_token
USERSBOX_TOKEN=your_usersbox_token
VEKTOR_TOKEN=your_vektor_token

# Проверка компаний
DATANEWTON_KEY=your_datanewton_key
CHECKO_KEY=your_checko_key
```

## 📚 Документация

- [API Documentation](apps/api/README.md) - Подробная документация API
- [Deployment Guide](apps/api/DEPLOYMENT.md) - Руководство по деплою
- [Requirements](/.kiro/specs/datatrace-improvements/requirements.md) - Требования проекта
- [Design Document](/.kiro/specs/datatrace-improvements/design.md) - Техническое описание
- [Implementation Tasks](/.kiro/specs/datatrace-improvements/tasks.md) - План реализации

## 🧪 Тестирование

```bash
cd apps/api

# Запуск всех тестов
npm test

# Тесты с покрытием
npm run test:coverage

# Тесты в watch режиме
npm run test:watch
```

## 🏗 Архитектура

### Backend
- **Express.js** - веб-сервер
- **OpenAI API** - ИИ анализ и структуризация данных
- **Supabase** - аутентификация и база данных пользователей
- **DeHashed API** - проверка компрометации паролей

### Frontend
- **Vanilla JavaScript** - без фреймворков для простоты
- **Tailwind CSS** - современная стилизация
- **PT Mono** - моноширинный шрифт для tech-стиля

### Безопасность
- JWT токены для аутентификации
- Rate limiting по пользователям
- Валидация входных данных
- Централизованная обработка ошибок
- Хеширование паролей для проверки

## 🔄 API Эндпоинты

### Аутентификация
- `POST /api/auth/signup` - регистрация
- `POST /api/auth/signin` - вход
- `GET /api/auth/user` - данные пользователя

### Поиск утечек
- `POST /api/search` - полный поиск по всем источникам
- `POST /api/leak-search-step` - пошаговый поиск

### Проверка компаний
- `POST /api/company-search` - поиск информации о компании
- `POST /api/company-summarize` - ИИ анализ компании

### Проверка паролей
- `POST /api/password-check` - проверка компрометации пароля

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [документацию API](apps/api/README.md)
2. Посмотрите [открытые issues](../../issues)
3. Создайте новый issue с подробным описанием проблемы

## 🎯 Roadmap

- [ ] Добавление новых источников данных
- [ ] Интеграция с Telegram ботом
- [ ] Мобильное приложение
- [ ] Расширенная аналитика
- [ ] API для партнеров

---

**DataTrace** - ваш надежный инструмент для контроля безопасности данных 🛡️