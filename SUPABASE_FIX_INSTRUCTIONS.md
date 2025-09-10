# Инструкция по исправлению тарифа по умолчанию в Supabase

## Проблема
При регистрации пользователям присваивается тариф 'basic' вместо 'free'.

## Решение
Выполните следующий SQL скрипт в SQL Editor вашего Supabase проекта:

```sql
-- Обновляем существующих пользователей с тарифом 'basic' на 'free'
UPDATE user_profiles 
SET plan = 'free', checks_limit = 0, checks_used = 0 
WHERE plan = 'basic';

-- Удаляем существующий триггер если он есть
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Создаем новую функцию для создания профиля с тарифом 'free'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name, phone, plan, checks_used, checks_limit)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'free',
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для автоматического создания профиля
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Что делает этот скрипт:

1. **Обновляет существующих пользователей** - меняет тариф с 'basic' на 'free'
2. **Удаляет старый триггер** - если он существует
3. **Создает новую функцию** - которая создает профиль с тарифом 'free'
4. **Создает новый триггер** - который автоматически вызывается при регистрации

## После выполнения:
- Все новые пользователи будут получать тариф 'free' по умолчанию
- Существующие пользователи с тарифом 'basic' будут переведены на 'free'
- Код приложения больше не будет создавать дублирующие записи профилей