### Базовый URL

POST https://api-dyxless.cfd/query

Все параметры передаются в теле запроса (JSON).

### Аутентификация

Используйте параметр token, выданный ботом.

Передавайте его в теле запроса.

### Баланс и тарификация

Стоимость списывается за каждый запрос в зависимости от типа:

| Тип запроса | Значение параметра type | Стоимость списания | Описание |
| --- | --- | --- | --- |
| Стандартный | standart (по умолчанию) | 2 ₽ | Поиск по основной базе. |
| Telegram | telegram | 10 ₽ | Поиск по базе Telegram. |

Если баланс меньше стоимости нужного типа запроса, вернётся
ошибка 403 с сообщением о недостатке средств.

### Лимиты

- Не более 100 запросов за 15 минут на IP.
- Content-Type: application/json.

## /query — поиск

Выполняет поиск и возвращает JSON со сводной информацией.

- token (string) — обязательный
- query (string) — обязательный
- type (string, optional) — standart \| telegram. По умолчанию standart.


### Примеры: стандартный запрос

NodeJSPythonPHPcURL

```
// npm i axios
const axios = require('axios');

async function run() {
  const res = await axios.post('https://api-dyxless.cfd/query', {
    token: '***-your-token-***',
    query: '79877777777' // type не указан → будет standart (2 ₽)
  }, { headers: { 'Content-Type': 'application/json' } });
  console.log(res.data);
}

run().catch(console.error);

```

```
# pip install requests
import requests

payload = {
  "token": "***-your-token-***",
  "query": "79877777777"
}

r = requests.post(
  "https://api-dyxless.cfd/query",
  json=payload,
  headers={"Content-Type": "application/json"}
)
print(r.json())

```

```
<?php
$ch = curl_init('https://api-dyxless.cfd/query');
$payload = json_encode([\
  'token' => '***-your-token-***',\
  'query' => '79877777777'\
]);
curl_setopt_array($ch, [\
  CURLOPT_POST => true,\
  CURLOPT_HTTPHEADER => ['Content-Type: application/json'],\
  CURLOPT_POSTFIELDS => $payload,\
  CURLOPT_RETURNTRANSFER => true\
]);
$resp = curl_exec($ch);
curl_close($ch);
echo $resp;
?>
```

```
curl -X POST \
  https://api-dyxless.cfd/query \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "***-your-token-***",
    "query": "79877777777"
  }'

```

### Примеры: Telegram-запрос

Поддерживаются username (с @ или без) и числовой ID (можно с #). Стоимость: 10
₽.

NodeJSPythonPHPcURL

```
// npm i axios
const axios = require('axios');

async function run() {
  const res = await axios.post('https://api-dyxless.cfd/query', {
    token: '***-your-token-***',
    query: '@someusername',
    type: 'telegram' // 10 ₽
  }, { headers: { 'Content-Type': 'application/json' } });
  console.log(res.data);
}

run().catch(console.error);

```

```
# pip install requests
import requests

payload = {
  "token": "***-your-token-***",
  "query": "#123456789",
  "type": "telegram"
}

r = requests.post(
  "https://api-dyxless.cfd/query",
  json=payload,
  headers={"Content-Type": "application/json"}
)
print(r.json())

```

```
<?php
$ch = curl_init('https://api-dyxless.cfd/query');
$payload = json_encode([\
  'token' => '***-your-token-***',\
  'query' => '@someusername',\
  'type'  => 'telegram'\
]);
curl_setopt_array($ch, [\
  CURLOPT_POST => true,\
  CURLOPT_HTTPHEADER => ['Content-Type: application/json'],\
  CURLOPT_POSTFIELDS => $payload,\
  CURLOPT_RETURNTRANSFER => true\
]);
$resp = curl_exec($ch);
curl_close($ch);
echo $resp;
?>
```

```
curl -X POST \
  https://api-dyxless.cfd/query \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "***-your-token-***",
    "query": "@someusername",
    "type": "telegram"
  }'

```

### Пример успешного ответа — стандартный

```
{
  "status": true,
  "counts": 2,
  "data": [\
    { "table_name": "numbers_fix", "number": "+79877777777", "...": "..." },\
    { "table_name": "mails", "mail": "user@example.com", "...": "..." }\
  ]
}

```

### Пример успешного ответа — Telegram

```
{
  "status": true,
  "counts": 1,
  "data": [\
    {\
      "id": "123456789",\
      "number": "79990000000",\
      "countryCode": "Россия",\
      "username": "someusername",\
      "first_name": "Ivan",\
      "last_name": "Ivanov",\
      "history": ["@someusername | Ivan Ivanov"],\
      "mails": ["user@example.com"],\
      "locations": [],\
      "ips": [],\
      "created_date": "01.01.2020",\
      "is_premium": false,\
      "chats": [],\
      "messages": [],\
      "table_name": "telegram"\
    }\
  ]
}

```

## Ошибки и статусы

**400 Bad Request**

Отсутствуют обязательные параметры token и/или
query.


```
{ "status": false, "message": "Необходимы token и query параметры" }
```

**401 Unauthorized**

Неверный токен.

```
{ "status": false, "message": "Неверный токен" }
```

**403 Forbidden**

Недостаточно баланса для выбранного типа запроса.

```
{ "status": false, "message": "Недостаточно средств на балансе API-токена. Требуется: 10" }
```

**403 Forbidden**

Доступ к данным ограничен (скрытые данные).

```
{ "status": false, "message": "Данные были скрыты." }
```

**404 Not Found**

Данные не найдены.

```
{ "status": false, "message": "Пользователь не найден" }
```

**500 Internal Server Error**

Непредвиденная ошибка сервера.

```
{ "status": false, "message": "Внутренняя ошибка сервера" }
```