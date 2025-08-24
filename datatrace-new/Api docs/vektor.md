# Документация api

### Создание приложения

Для создания API-приложения осуществляется через бот. API > Создать приложение > API Token.

Лимит приложений на один аккаунт \- 16.

[https://infosearch54321.xyz](https://infosearch54321.xyz/) базовый URL для запроса

### Профиль

```
Method: GET
/api/{api_token}/profile

```

api\_token: токен апи (см. п. Создание приложения)

```
{
    "profile":
    {
          "name": "Vektor",
          "creation_date": "2025-02-24 16:25:03.853672",
          "balance": 100.0
    }
}

```

name: название приложения

creation\_date: дата и время создания приложения

balance: актуальный баланс приложения

Ошибка авторизации:

```
{
    "error": "Unothorized"
}

```

### Поиск

```
Method: GET
/api/{api_token}/search/{query}

```

api\_token: токен апи (см. п. Создание приложения)

query: текст запроса

```
{
    "result":
    {
        0:
        {
            "ФИО": "Иванов Иван",
            "ДАТА РОЖДЕНИЯ": "24.07.1949",
            "ТЕЛЕФОН": "79037797417",
            "database": "🇷🇺 clients sportmaster.ru 2013-05.2018"
        },
        1:
        ...
    }
}

```

result: словарь, порядковый номер строки -> строка

Ошибка авторизации:

```
{
    "error": "Unothorized"
}

```

### Многоуровневый Поиск

```
Method: GET
/api/{api_token}/extended_search/{query}

```

api\_token: токен апи (см. п. Создание приложения)

query: текст запроса

```
{
    "result":
    {
        0:
        {
            "ФИО": "Иванов Иван",
            "ДАТА РОЖДЕНИЯ": "24.07.1949",
            "ТЕЛЕФОН": "79037797417",
            "database": "🇷🇺 clients sportmaster.ru 2013-05.2018"
        },
        1:
        ...
    }
}

```

result: словарь, порядковый номер строки -> строка

Ошибка авторизации:

```
{
    "error": "Unothorized"
}

```

Report content on this page

## Report Page

ViolenceChild AbuseCopyrightIllegal DrugsPersonal DetailsOther

Please submit your DMCA takedown request to [dmca@telegram.org](mailto:dmca@telegram.org?subject=Report%20to%20Telegraph%20page%20%22%D0%94%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D1%86%D0%B8%D1%8F%20api%22&body=Reported%20page%3A%20https%3A%2F%2Ftelegra.ph%2FDokument-03-04%0A%0A%0A)