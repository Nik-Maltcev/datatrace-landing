-- Исправляем план в транзакции с basic на professional для пользователя clemmyslimy@tiffincrane.com
UPDATE payment_transactions 
SET plan = 'professional' 
WHERE email = 'clemmyslimy@tiffincrane.com' 
AND plan = 'basic'
AND transaction_id LIKE 'payment_clemmyslimy@tiffincrane.com_%'
AND status = 'completed';

-- Проверяем результат
SELECT * FROM payment_transactions 
WHERE email = 'clemmyslimy@tiffincrane.com'
ORDER BY processed_at DESC;