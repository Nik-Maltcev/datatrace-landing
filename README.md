# DataTrace - Monorepo

Платформа для поиска утечек данных и анализа информационной безопасности.

## Структура проекта

```
datatrace-monorepo/
├── apps/
│   ├── web/          # Next.js веб-приложение (лендинг + личный кабинет)
│   └── api/          # Express.js API сервис (поиск утечек)
├── package.json      # Корневой package.json с скриптами
└── README.md
```

## Быстрый старт

### Локальная разработка

1. Установите зависимости:
```bash
npm run install:all
```

2. Запустите оба сервиса:
```bash
npm run dev
```

Это запустит:
- Веб-приложение на http://localhost:3000
- API сервис на http://localhost:3001

### Отдельный запуск сервисов

Веб-приложение:
```bash
npm run dev:web
```

API сервис:
```bash
npm run dev:api
```

## Деплой

### Production сборка

```bash
npm run build
npm run start
```

### Railway деплой

1. Подключите репозиторий к Railway
2. Создайте два сервиса:
   - Web Service: `apps/web`
   - API Service: `apps/api`

### Переменные окружения

Для API сервиса (`apps/api/.env`):
```
PORT=3001
ITP_TOKEN=your_token
DYXLESS_TOKEN=your_token
LEAKOSINT_TOKEN=your_token
USERSBOX_TOKEN=your_token
VEKTOR_TOKEN=your_token
OPENAI_API_KEY=your_key
```

## Функциональность

### Веб-приложение (apps/web)
- Лендинг страница DataTrace
- Система авторизации (тестовая)
- Личный кабинет пользователя
- Интеграция с API сервисом

### API сервис (apps/api)
- Поиск утечек по различным источникам
- Проверка компаний по ИНН
- ИИ анализ результатов
- Стилизованный интерфейс поиска

## Технологии

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **UI**: Radix UI, Lucide Icons
- **ИИ**: OpenAI GPT-5
- **Стилизация**: PT Mono font, минималистичный дизайн

## Разработка

Проект использует monorepo архитектуру для удобства разработки и деплоя. Каждое приложение может разрабатываться независимо, но запускаться одной командой.