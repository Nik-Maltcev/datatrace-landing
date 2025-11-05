// Временный скрипт для проверки Telegram
const BOT_TOKEN = 'YOUR_BOT_TOKEN'; // Замените на ваш токен
const CHAT_ID = '-1003225419401';

fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: CHAT_ID,
    text: '🧪 Тестовое сообщение'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', JSON.stringify(data, null, 2)))
.catch(err => console.error('Error:', err));
