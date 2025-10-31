# Интеграция с Google Sheets

## Настройка Google Apps Script

1. Перейдите на https://script.google.com
2. Создайте новый проект
3. Удалите весь существующий код и вставьте следующий код (БЕЗ слова javascript в начале):

function doPost(e) {
  try {
    var SHEET_ID = '141fMoGy3u4_7libbtdwq4fv0xyGJQcrQTTJgdueiQM0';
    var sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    var data = JSON.parse(e.postData.contents);
    
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

✅ **ГОТОВО!** Код уже обновлен с вашим URL:
- Google Apps Script URL: https://script.google.com/macros/s/AKfycbxmr-ckIYNv1kXVnhf3GVSzweRLMlzm_ne1r5a0UB7XyUXhGl4IxBdEN6y6rrrzf1Q/exec
- Google Sheet ID: 141fMoGy3u4_7libbtdwq4fv0xyGJQcrQTTJgdueiQM0

Форма теперь будет отправлять данные в вашу Google таблицу!