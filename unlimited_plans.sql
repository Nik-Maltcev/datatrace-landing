-- Обновляем всех пользователей на безлимитные тарифы
UPDATE user_profiles 
SET 
  checks_limit = 999,
  checks_used = 0,  -- Сбрасываем использованные проверки
  updated_at = NOW()
WHERE checks_limit < 999;

-- Проверяем результат
SELECT 
  email, 
  plan, 
  checks_limit, 
  checks_used,
  updated_at
FROM user_profiles 
ORDER BY updated_at DESC
LIMIT 10;

-- Статистика по планам
SELECT 
  plan,
  COUNT(*) as users_count,
  AVG(checks_limit) as avg_limit
FROM user_profiles 
GROUP BY plan
ORDER BY plan;