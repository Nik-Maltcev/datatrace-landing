# DataTrace Web Application Documentation

## 1. Product Overview
- **Purpose.** DataTrace позволяет пользователям искать и устранять утечки персональных данных, поступающие из множества Telegram-ботов и партнёрских источников. Пользователь регистрируется, подтверждает номер телефона и выполняет проверки телефонов и e-mail, после чего вручную помечает обработанные утечки.
- **Key capabilities.** Лэндинг и личный кабинет объединены в одно приложение на Next.js: покупка тарифов, проверка статуса оплаты, управление профилем, запуск проверок на утечки и отображение истории/результатов.

## 2. Technology Stack
- **Фреймворк.** Клиент построен на Next.js 15 (App Router) с React 19 и TypeScript; стилизация выполняется через Tailwind CSS и библиотеку UI-компонентов Radix UI/Shadcn UI. Дополнительно используются Sonner/Toast, Lucide icons и вспомогательные пакеты (react-hook-form, zod).【F:apps/web/package.json†L1-L52】
- **Интеграции.** Бэкенд-функции реализованы через встроенные API-роуты Next.js, которые общаются с Supabase (аутентификация, таблица `user_profiles`) и внешними поставщиками данных об утечках (ITP, Dyxless, LeakOsint, UsersBox, Vektor и др.).【F:apps/web/app/api/user-profile/route.ts†L1-L143】【F:apps/web/app/api/leaks/check-phone/route.ts†L1-L120】

## 3. Application Structure
- **App Router (`apps/web/app`).**
  - `page.tsx` — лендинг и точка входа, где пользователи выбирают тариф и инициируют оплату.【F:apps/web/app/page.tsx†L219-L246】
  - `/login`, `/register`, `/auth/callback` — страницы аутентификации (включая OTP через Telegram).【F:apps/web/app/login/page.tsx†L42-L102】
  - `/dashboard` — основная рабочая область с результатами проверок, формами запуска новых проверок и виджетами тарифа.【F:apps/web/app/dashboard/page.tsx†L1-L210】
  - `/payment` — отдельный экран выбора тарифов с привязкой к оплате PayAnyWay.【F:apps/web/app/payment/page.tsx†L36-L236】
  - `/redirect` — страница, обрабатывающая успешную оплату, синхронизирующая профиль и уведомляющая другие вкладки.【F:apps/web/app/redirect/page.tsx†L10-L109】
- **Hooks (`apps/web/hooks`).** Кастомный хук `use-auth.ts` управляет состоянием пользователя, localStorage, синхронизацией между вкладками и обновлением профиля из Supabase.【F:apps/web/hooks/use-auth.ts†L1-L206】
- **Libraries (`apps/web/lib`).**
  - `plans.ts` — единый источник правды для тарифов, их алиасов и лимитов проверок.【F:apps/web/lib/plans.ts†L1-L55】
  - `api.ts` — настройка базового URL API, добавление токена авторизации и логирование запросов.【F:apps/web/lib/api.ts†L1-L56】
  - `server/supabase-client.ts` — создание серверного клиента Supabase с использованием service-role ключа.【F:apps/web/lib/server/supabase-client.ts†L1-L24】
- **API Routes (`apps/web/app/api`).**
  - `auth/*` — регистрация, вход, обновление токена.
  - `user-profile` — чтение/обновление профиля и тарифов пользователя в таблице `user_profiles` Supabase.【F:apps/web/app/api/user-profile/route.ts†L1-L143】
  - `payment/*` — создание платежа, вебхук PayAnyWay, подтверждение успешной оплаты, ручная проверка транзакции.【F:apps/web/app/api/payment/create/route.ts†L17-L53】【F:apps/web/app/api/payment/notify/route.ts†L1-L190】【F:apps/web/app/api/payment-success/route.ts†L1-L97】【F:apps/web/app/api/check-transaction/route.ts†L1-L98】
  - `leaks/*` и `checks/*` — прокси к внешним источникам утечек и сохранение истории проверок.【F:apps/web/app/api/leaks/check-phone/route.ts†L1-L120】【F:apps/web/app/api/save-check-result/route.ts†L1-L120】
  - `telegram-*` — интеграция с Telegram-ботами для OTP-подтверждений.

## 4. Authentication and User State
- **Регистрация/вход.** API-роуты `auth/signup` и `auth/signin` работают с Supabase: создают пользователя, получают JWT, сохраняют профиль в `user_profiles`. Хук `useAuth` вызывает эти эндпоинты через `login` и кладёт `access_token`/`refresh_token` в localStorage.【F:apps/web/app/api/auth/signup/route.ts†L1-L160】【F:apps/web/hooks/use-auth.ts†L60-L120】
- **Локальное состояние.** `useAuth` нормализует план (через `resolvePlanFromParam`), хранит исходное значение в `rawPlan`, управляет счётчиком проверок и реагирует на события `storage`/`refreshUserData` для синхронизации между вкладками.【F:apps/web/hooks/use-auth.ts†L17-L206】
- **Обновление профиля.** `refreshUserData` делает GET запрос к `/api/user-profile`, возвращающий нормализованный план, оригинальный `rawPlan` и актуальные лимиты, и обновляет локальное состояние без потери нулевых значений лимита.【F:apps/web/hooks/use-auth.ts†L160-L203】【F:apps/web/app/api/user-profile/route.ts†L42-L143】
- **Supabase доступ.** Серверные роуты используют `getSupabaseClient` из `lib/server/supabase-client.ts`, требующий `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`. Клиентские части (например, `api/user-profile`) падают с 503, если ключи не заданы, что облегчает диагностику конфигурации.【F:apps/web/lib/server/supabase-client.ts†L1-L24】【F:apps/web/app/api/payment-success/route.ts†L1-L97】

## 5. Subscription and Billing Flow
- **Определение тарифов.** В `lib/plans.ts` описаны алиасы тарифов (`basic`, `professional-6m`, `professional_12m`, `expert`, `corporate`), они нормализуются к `free/basic/professional` и получают лимиты: Free — 0 проверок, Basic — 1, Professional (включая все профессиональные варианты) — 2.【F:apps/web/lib/plans.ts†L1-L55】
- **Выбор и инициирование оплаты.** Страницы `page.tsx` и `payment/page.tsx` формируют `successUrl` и отправляют запрос на `/api/payment/create`, который собирает параметры PayAnyWay (сумма, план, email) для редиректа на платёжную форму.【F:apps/web/app/page.tsx†L219-L246】【F:apps/web/app/payment/page.tsx†L36-L118】【F:apps/web/app/api/payment/create/route.ts†L17-L53】
- **Обработка успешной оплаты.**
  - `/redirect` после успешной оплаты ждёт завершения вебхука, подтягивает профиль через `/api/user-profile`, вызывает `login` и оповещает другие вкладки через `localStorage` и `postMessage`.【F:apps/web/app/redirect/page.tsx†L15-L109】
  - `/api/payment/notify` — PayAnyWay webhook: определяет тариф по `MNT_CUSTOM1` или сумме, нормализует план, выставляет лимиты, сбрасывает счётчик проверок и сохраняет транзакцию в Supabase.【F:apps/web/app/api/payment/notify/route.ts†L18-L190】
  - `/api/payment-success` — ручное подтверждение из кабинета: использует service-role Supabase клиента, нормализует план, фиксирует лимит/`rawPlan`, сбрасывает `checks_used` и возвращает профиль для фронтенда.【F:apps/web/app/api/payment-success/route.ts†L1-L97】
  - `/api/check-transaction` — резервный эндпоинт, проверяющий таблицу `payment_transactions`, нормализующий тариф и выставляющий лимиты при наличии записи.【F:apps/web/app/api/check-transaction/route.ts†L1-L98】
- **Локальное обновление тарифа.** `useAuth.updateUserPlan` и `refreshUserData` приводят локальное состояние к нормализованному плану и сбрасывают счётчик проверок после покупки.【F:apps/web/hooks/use-auth.ts†L122-L153】【F:apps/web/hooks/use-auth.ts†L160-L203】

## 6. Dashboard and Leak Checks
- **Контролируемые действия.** На `/dashboard` реализованы проверки телефона, e-mail и утечек; каждая проверка перед запуском сверяет текущий лимит (`checksLimit`) и количество использованных проверок. При исчерпании лимита проверки блокируются с уведомлением в консоли/интерфейсе.【F:apps/web/app/dashboard/page.tsx†L168-L283】【F:apps/web/app/dashboard/page.tsx†L300-L338】
- **Учёт проверок.** После успешного ответа `updateUserChecks` увеличивает счётчик локально, а серверные роуты сбрасывают `checks_used` при смене тарифа, чтобы лимиты начинали отсчёт заново.【F:apps/web/app/dashboard/page.tsx†L213-L286】【F:apps/web/app/api/payment/notify/route.ts†L102-L170】【F:apps/web/app/api/payment-success/route.ts†L52-L82】
- **Интеграция с провайдерами.** Роут `leaks/check-phone` агрегирует данные нескольких внешних сервисов, подтягивает токены из переменных окружения и нормализует ответы через собственные утилиты; результаты сохраняются в Supabase через `saveCheckResult`. Аналогичные роуты существуют для e-mail и других типов проверок.【F:apps/web/app/api/leaks/check-phone/route.ts†L1-L120】【F:apps/web/app/api/save-check-result/route.ts†L1-L120】

## 7. Utilities and Supporting Modules
- **PhoneVerification компонент.** Управляет OTP-подтверждением телефона и хранит маркеры подтверждения в `localStorage`, что используется на дашборде для проверки статуса верификации.【F:apps/web/components/PhoneVerification.tsx†L200-L330】【F:apps/web/app/dashboard/page.tsx†L120-L167】
- **API helpers.** `lib/api.ts` задаёт базовый URL (через `NEXT_PUBLIC_API_URL` или текущий origin) и автоматически добавляет `Authorization` заголовок при наличии `access_token`. Это исключает дублирование логики при обращениях к встроенным API роутам.【F:apps/web/lib/api.ts†L1-L56】
- **Supabase helpers.** `lib/server/supabase-client.ts` создаёт единственный экземпляр клиента на стороне сервера, а `lib/config/supabase-api.ts` (используется в некоторых маршрутах) даёт fallback на anon key, если service key отсутствует, позволяя маршрутам явно сигнализировать об ошибке конфигурации.【F:apps/web/lib/server/supabase-client.ts†L1-L24】【F:apps/web/lib/config/supabase-api.ts†L1-L23】

## 8. Configuration and Environment
- **Обязательные переменные.** `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` — для серверных маршрутов; `NEXT_PUBLIC_SUPABASE_ANON_KEY`/`NEXT_PUBLIC_API_URL` — для клиентской части. Маршруты утечек требуют токены сторонних сервисов (`ITP_TOKEN`, `DYXLESS_TOKEN`, `LEAKOSINT_TOKEN`, `USERSBOX_TOKEN`, `VEKTOR_TOKEN` и соответствующие BASE URL).【F:apps/web/lib/server/supabase-client.ts†L1-L24】【F:apps/web/app/api/leaks/check-phone/route.ts†L1-L120】【F:apps/web/lib/api.ts†L1-L23】
- **Хранение пользовательского состояния.** `localStorage` содержит сериализованный объект `user`, `access_token` и `refresh_token`. События `storage` и кастомный `refresh_user_data` используются для межвкладочной синхронизации; при логауте данные очищаются (`clearAuth`).【F:apps/web/hooks/use-auth.ts†L34-L120】

## 9. Development and Testing
- **Команды.** В `package.json` определены стандартные скрипты: `pnpm dev` — запуск dev-сервера, `pnpm build` — продакшн сборка, `pnpm lint` — проверка ESLint/TypeScript правил.【F:apps/web/package.json†L1-L17】
- **Локальный запуск.** После установки зависимостей (`pnpm install`) нужно задать Supabase и внешние токены (или использовать тестовые из `.env.local`/Railway). При отсутствии обязательных переменных серверные роуты вернут 503, что облегчает отладку конфигурации.
- **Отладка API.** Благодаря подробному логированию в `lib/api.ts` и в API-роутах (`payment/notify`, `payment-success`, `check-transaction`) удобно отслеживать входящие запросы, финальные планы и лимиты — логи выводятся прямо в серверной консоли Railway/Vercel.【F:apps/web/lib/api.ts†L1-L56】【F:apps/web/app/api/payment/notify/route.ts†L18-L190】【F:apps/web/app/api/payment-success/route.ts†L1-L97】

## 10. Operational Tips
- **Восстановление после оплаты.** Если webhook не пришёл, пользователь может перейти на `/redirect` (успешная оплата) или вручную отправить ID транзакции через `/dashboard` → `/api/check-transaction`, который повторно применит тариф и лимит проверок.【F:apps/web/app/redirect/page.tsx†L15-L109】【F:apps/web/app/dashboard/page.tsx†L40-L122】【F:apps/web/app/api/check-transaction/route.ts†L1-L98】
- **Миграция тарифов.** При изменении тарифной сетки достаточно обновить `lib/plans.ts`; все серверные и клиентские части используют эту функцию нормализации и автоматически подстроят лимиты и отображение плана.【F:apps/web/lib/plans.ts†L1-L55】【F:apps/web/hooks/use-auth.ts†L90-L153】【F:apps/web/app/api/payment/notify/route.ts†L86-L170】
- **Расширение функциональности.** Для новых источников утечек добавьте роут в `app/api/leaks`, используя существующие нормализаторы и `saveCheckResult` для сохранения истории, а на фронтенде подключите кнопку/форму в `dashboard/page.tsx` с проверкой лимитов через `useAuth`.
