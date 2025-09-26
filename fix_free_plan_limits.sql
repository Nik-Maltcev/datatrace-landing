-- Исправляем лимиты для всех тарифов

-- Free тариф: 0 проверок
UPDATE user_profiles 
SET checks_limit = 0 
WHERE plan = 'free' AND checks_limit != 0;

-- Basic тариф: 1 проверка
UPDATE user_profiles 
SET checks_limit = 1 
WHERE plan = 'basic' AND checks_limit != 1;

-- Professional тариф: 2 проверки (все варианты)
UPDATE user_profiles 
SET checks_limit = 2 
WHERE plan IN ('professional', 'professional-6m', 'professional-12m', 'professional_6m', 'professional_12m', 'pro', 'expert', 'corporate') 
AND checks_limit != 2;

-- Пользователи без тарифа получают free
UPDATE user_profiles 
SET plan = 'free', checks_limit = 0 
WHERE plan IS NULL OR plan = '';

-- Проверяем результат
SELECT plan, checks_limit, COUNT(*) as user_count
FROM user_profiles 
GROUP BY plan, checks_limit
ORDER BY plan, checks_limit;