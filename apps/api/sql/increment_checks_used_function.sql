-- Функция для увеличения счетчика использованных проверок
CREATE OR REPLACE FUNCTION increment_checks_used(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles 
  SET checks_used = COALESCE(checks_used, 0) + 1,
      updated_at = NOW()
  WHERE id = user_id OR user_id::text = user_id::text;
  
  -- Если записи не существует, создаем её
  INSERT INTO user_profiles (id, checks_used, checks_limit, plan, created_at, updated_at)
  SELECT user_id, 1, 2, 'professional', NOW(), NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id OR user_id::text = user_id::text
  );
END;
$$ LANGUAGE plpgsql;