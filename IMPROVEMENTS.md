# Улучшения для раздела "Мои проверки"

## 1. База данных (Supabase)

### Создать таблицы:
```sql
-- Таблица проверок пользователей
CREATE TABLE user_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR(20) NOT NULL, -- 'phone' | 'email'
  query TEXT NOT NULL,
  total_leaks INTEGER DEFAULT 0,
  found_sources INTEGER DEFAULT 0,
  results JSONB,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_user_checks_user_id ON user_checks(user_id);
CREATE INDEX idx_user_checks_created_at ON user_checks(created_at DESC);
```

## 2. Улучшенная аутентификация

### Middleware для проверки токенов:
```typescript
export async function authenticateUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) throw new Error('No token provided')
  
  const { data: user } = await supabase.auth.getUser(token)
  return user
}
```

## 3. Централизованный API клиент

### Создать общий сервис:
```typescript
// lib/leakSearchService.ts
export class LeakSearchService {
  async searchAllSources(query: string, type: 'phone' | 'email') {
    // Единая логика поиска
  }
}
```

## 4. Улучшенная аналитика

### Добавить метрики:
- Время выполнения проверок
- Успешность запросов к источникам
- Статистика по типам утечек
- Тренды по времени

## 5. Уведомления

### Система алертов:
- Email уведомления о новых утечках
- Push уведомления в браузере
- Еженедельные отчеты

## 6. Экспорт данных

### Возможности экспорта:
- PDF отчеты
- CSV файлы
- JSON для API интеграций