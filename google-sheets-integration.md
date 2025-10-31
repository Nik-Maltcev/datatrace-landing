# Интеграция с Google Sheets

## Настройка Google Apps Script

1. Перейдите на https://script.google.com
2. Создайте новый проект
3. Вставьте следующий код:

```javascript
function doPost(e) {
  try {
    // ID вашей Google таблицы (из URL)
    const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Парсим данные из запроса
    const data = JSON.parse(e.postData.contents);
    
    // Добавляем строку с данными
    sheet.appendRow([
      new Date(),
      data.name || '',
      data.phone || '',
      data.email || '',
      data.message || ''
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Сохраните проект
5. Нажмите "Развернуть" > "Новое развертывание"
6. Выберите тип "Веб-приложение"
7. Установите доступ "Любой пользователь"
8. Скопируйте URL развертывания

## Настройка Google Sheets

1. Создайте новую Google таблицу
2. В первой строке добавьте заголовки:
   - A1: Дата
   - B1: Имя
   - C1: Телефон
   - D1: Email
   - E1: Сообщение
3. Скопируйте ID таблицы из URL (между /d/ и /edit)

## Обновление кода

Замените в файле landing/page.tsx:
- `AKfycbxYourScriptIdHere` на ваш URL Google Apps Script
- Убедитесь, что в Google Apps Script указан правильный SHEET_ID