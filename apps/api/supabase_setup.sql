-- Создание таблицы для профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free' NOT NULL,
  checks_used INTEGER DEFAULT 0 NOT NULL,
  checks_limit INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Настройка RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свои профили
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Политика: пользователи могут обновлять только свои профили
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Политика: только аутентифицированные пользователи могут создавать профили
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять только свои профили
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Функция для увеличения счетчика использованных проверок
CREATE OR REPLACE FUNCTION increment_checks_used(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles 
  SET checks_used = COALESCE(checks_used, 0) + 1,
      updated_at = NOW()
  WHERE id = user_id OR user_profiles.user_id = user_id;
  
  -- Если записи не существует, создаем её
  INSERT INTO user_profiles (id, user_id, email, name, phone, checks_used, checks_limit, plan, created_at, updated_at)
  SELECT user_id, user_id, '', '', '', 1, 2, 'professional', NOW(), NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id OR user_profiles.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Комментарии к таблице и столбцам
COMMENT ON TABLE user_profiles IS 'Расширенные профили пользователей с дополнительной информацией';
COMMENT ON COLUMN user_profiles.user_id IS 'Ссылка на пользователя в auth.users';
COMMENT ON COLUMN user_profiles.email IS 'Email адрес пользователя';
COMMENT ON COLUMN user_profiles.name IS 'Полное имя пользователя';
COMMENT ON COLUMN user_profiles.phone IS 'Номер телефона пользователя';
COMMENT ON COLUMN user_profiles.plan IS 'Тарифный план пользователя (free, basic, professional)';
COMMENT ON COLUMN user_profiles.checks_used IS 'Количество использованных проверок';
COMMENT ON COLUMN user_profiles.checks_limit IS 'Лимит проверок для текущего тарифа';