import React, { useState } from 'react';

const CompanySearch = () => {
  const [inn, setInn] = useState('');
  const [loadingStage, setLoadingStage] = useState('idle'); // "idle" | "searching" | "processing" | "done" | "error"
  const [resultHTML, setResultHTML] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Валидация ИНН
  const validateINN = (innValue) => {
    const cleanINN = innValue.replace(/\D/g, '');
    return cleanINN.length === 10 || cleanINN.length === 12;
  };

  // Форматирование ИНН для отображения
  const formatINN = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 12);
  };

  // Основная функция поиска
  const handleSearch = async () => {
    if (!validateINN(inn)) {
      setErrorMessage('Введите корректный ИНН (10 или 12 цифр)');
      setLoadingStage('error');
      return;
    }

    try {
      // Этап 1: Поиск информации о компании
      setLoadingStage('searching');
      setErrorMessage('');
      setResultHTML('');

      const companyResponse = await fetch(`/api/company?inn=${inn}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!companyResponse.ok) {
        throw new Error(`Ошибка API: ${companyResponse.status} ${companyResponse.statusText}`);
      }

      const companyData = await companyResponse.json();

      // Этап 2: Обработка через OpenAI
      setLoadingStage('processing');

      const openaiResponse = await fetch('/api/openai/format-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Преобразуй этот JSON в понятное структурированное описание компании на русском языке в HTML с классами Tailwind CSS. 
          
          Используй следующую структуру:
          - Заголовок с названием компании
          - Основная информация (ИНН, ОГРН, статус, дата регистрации)
          - Адрес
          - Контактная информация
          - Руководители
          - Виды деятельности (ОКВЭД)
          - Учредители/владельцы
          
          Используй красивые Tailwind классы для оформления: bg-white, shadow-lg, rounded-lg, p-6, text-gray-800, border, etc.
          Сделай адаптивный дизайн с grid и flex.
          
          Вот JSON: ${JSON.stringify(companyData)}`,
          model: 'gpt-4o'
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`Ошибка OpenAI API: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      
      // Этап 3: Отображение результата
      setResultHTML(openaiData.html || openaiData.content || '');
      setLoadingStage('done');

    } catch (error) {
      console.error('Ошибка при поиске:', error);
      setErrorMessage(error.message || 'Произошла неизвестная ошибка');
      setLoadingStage('error');
    }
  };

  // Обработка Enter в поле ввода
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && loadingStage === 'idle') {
      handleSearch();
    }
  };

  // Сброс состояния для нового поиска
  const resetSearch = () => {
    setLoadingStage('idle');
    setResultHTML('');
    setErrorMessage('');
  };

  // Получение текста статуса
  const getStatusMessage = () => {
    switch (loadingStage) {
      case 'searching':
        return 'Идёт поиск информации...';
      case 'processing':
        return 'Информация обрабатывается...';
      case 'error':
        return errorMessage;
      default:
        return '';
    }
  };

  // Получение иконки статуса
  const getStatusIcon = () => {
    switch (loadingStage) {
      case 'searching':
      case 'processing':
        return (
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'done':
        return (
          <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Поиск информации о компании
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Введите ИНН для получения подробной информации
          </p>
        </div>

        {/* Форма поиска */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="inn" className="block text-sm font-medium text-gray-700 mb-2">
                ИНН компании
              </label>
              <input
                id="inn"
                type="text"
                value={inn}
                onChange={(e) => setInn(formatINN(e.target.value))}
                onKeyPress={handleKeyPress}
                placeholder="Например: 7707083893"
                disabled={loadingStage === 'searching' || loadingStage === 'processing'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                maxLength="12"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={handleSearch}
                disabled={loadingStage === 'searching' || loadingStage === 'processing' || !inn.trim()}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
              >
                {loadingStage === 'searching' || loadingStage === 'processing' ? 'Поиск...' : 'Поиск'}
              </button>
            </div>
          </div>
        </div>

        {/* Статус */}
        {(loadingStage !== 'idle' && loadingStage !== 'done') && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center space-x-3">
              {getStatusIcon()}
              <span className={`text-lg font-medium ${
                loadingStage === 'error' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {getStatusMessage()}
              </span>
            </div>
            {loadingStage === 'error' && (
              <div className="mt-4 text-center">
                <button
                  onClick={resetSearch}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  Попробовать снова
                </button>
              </div>
            )}
          </div>
        )}

        {/* Результат */}
        {loadingStage === 'done' && resultHTML && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <h2 className="text-xl font-semibold text-gray-900">Информация о компании</h2>
              </div>
              <button
                onClick={resetSearch}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Новый поиск
              </button>
            </div>
            <div 
              className="p-6"
              dangerouslySetInnerHTML={{ __html: resultHTML }}
            />
          </div>
        )}

        {/* Подсказки */}
        {loadingStage === 'idle' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Как использовать
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Введите ИНН компании (10 или 12 цифр)</li>
                    <li>Нажмите кнопку "Поиск" или клавишу Enter</li>
                    <li>Дождитесь обработки информации</li>
                    <li>Получите структурированный отчет о компании</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySearch;