import crypto from 'crypto';

// Генерируем случайный JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('🔐 Сгенерированный JWT_SECRET:');
console.log(jwtSecret);
console.log('\nДобавьте эту переменную в Railway:');
console.log(`JWT_SECRET=${jwtSecret}`);