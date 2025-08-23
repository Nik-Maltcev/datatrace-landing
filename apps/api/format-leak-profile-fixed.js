// Исправленный метод format-leak-profile только для GPT-5

app.post('/api/format-leak-profile', optionalAuth, userRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { data: leakData } = req.body;

    if (!Array.isArray(leakData) || leakData.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные для форматирования',
        details: 'Expected array of leak data'
      });
    }

    console.log('🎨 Format leak profile request received');
    console.log('📝 Prepared data length:', JSON.stringify(leakData).length);

    if (!openai) {
      console.log('⚠️ OpenAI not available, returning basic formatting');
      return res.json({
        ok: true,
        model: 'none',
        profile: '📋 Базовое форматирование данных\n\nПоказаны результаты поиска в базовом формате.'
      });
    }

    // Подготавливаем данные для AI
    const rawDataText = JSON.stringify(leakData, null, 2);
    const maxLength = 10000;
    const truncatedData = rawDataText.length > maxLength 
      ? rawDataText.substring(0, maxLength) + '\n\n[ДАННЫЕ ОБРЕЗАНЫ]'
      : rawDataText;

    const prompt = `Ты - эксперт по анализу данных утечек и созданию структурированных профилей. 

ВАЖНО:
1. Отвечай ТОЛЬКО на русском языке
2. НЕ выдумывай данные - используй только то, что есть в источниках
3. Замаскируй все чувствительные данные (паспорта, карты, полные адреса)
4. Группируй данные логически
5. Если данных нет - не включай раздел
6. Создай красивый, структурированный профиль

СТРУКТУРА ОТВЕТА:
📋 Основная информация
- Полное имя
- Дата рождения  
- Пол
- Телефоны

📧 Email адреса
- Список email с описанием

🏠 Адреса проживания
- Основной адрес
- Дополнительные адреса

🔍 Telegram профиль
- ID и имена в контактах

🏦 Финансовые данные
- Банковские карты (замаскированные)
- Банки и услуги

📄 Документы
- Паспорт (замаскированный)
- СНИЛС (замаскированный)

🛒 Интернет-сервисы
- Группировка по категориям

💰 Финансовые услуги
- МФО, займы, страхование

🎯 Дополнительные сведения
- VIP статусы, деятельность, география

ИСХОДНЫЕ ДАННЫЕ:
${truncatedData}

Создай красивый профиль на основе этих данных:`;

    try {
      console.log('🤖 Sending request to OpenAI for profile formatting...');
      console.log(`🔄 Trying model: gpt-5`);
      
      // Создаем параметры запроса для GPT-5
      const requestParams = {
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'Ты - эксперт по анализу данных и созданию структурированных профилей. Отвечай только на русском языке.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 4096,
        temperature: 0.3
      };

      const completion = await openai.chat.completions.create(requestParams);
      console.log(`✅ Successfully used model: gpt-5`);

      const formattedProfile = completion.choices[0]?.message?.content;
      
      if (!formattedProfile || formattedProfile.trim() === '') {
        console.log('⚠️ Empty response from GPT-5');
        console.log('📋 Providing basic summary instead');
        const fallbackProfile = `📊 Анализ данных по запросу "${truncatedData.substring(0, 100)}..."\n\nК сожалению, детальный анализ временно недоступен. Показаны базовые результаты поиска.`;
        
        return res.json({
          ok: true,
          model: 'fallback',
          profile: fallbackProfile
        });
      }

      console.log('✅ OpenAI profile formatting completed');
      console.log('📊 Response length:', formattedProfile.length);

      res.json({
        ok: true,
        model: 'gpt-5',
        profile: formattedProfile,
        meta: {
          sources_processed: leakData.length,
          data_length: truncatedData.length,
          original_data_length: rawDataText.length,
          response_length: formattedProfile.length
        }
      });

    } catch (aiError) {
      console.error('❌ OpenAI error:', aiError.message);
      console.log('📋 Providing fallback profile formatting...');
      
      const fallbackProfile = `📊 Анализ данных по запросу "${truncatedData.substring(0, 100)}..."\n\nК сожалению, ИИ анализ временно недоступен. Показаны базовые результаты поиска.`;
      
      res.json({
        ok: true,
        model: 'fallback',
        profile: fallbackProfile,
        error: 'AI service temporarily unavailable',
        details: aiError.message,
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Error in format-leak-profile:', error);
    res.status(500).json({
      ok: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});
