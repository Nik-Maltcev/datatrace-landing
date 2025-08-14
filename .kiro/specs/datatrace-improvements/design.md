# Design Document

## Overview

Данный документ описывает техническое решение для улучшения системы DataTrace. Основные цели включают исправление критических ошибок API, интеграцию Supabase авторизации, удаление режима "быстро" и добавление режима проверки паролей через DeHashed API.

## Architecture

### Current Architecture
- **Backend**: Express.js API сервер с интеграцией OpenAI
- **Frontend**: Статический HTML с vanilla JavaScript
- **External APIs**: ITP, Dyxless, LeakOsint, Usersbox, Vektor, Datanewton, Checko
- **AI Processing**: OpenAI GPT для анализа и структуризации данных

### Proposed Architecture Changes
- **Authentication Layer**: Supabase Auth интеграция
- **New API Integration**: DeHashed API для проверки паролей
- **Improved Error Handling**: Централизованная обработка ошибок
- **Enhanced OpenAI Integration**: Поддержка Responses API для GPT-5

## Components and Interfaces

### 1. Authentication Module (Supabase Integration)

#### AuthService
```javascript
class AuthService {
  constructor(supabaseUrl, supabaseKey)
  async signIn(email, password)
  async signUp(email, password)
  async signOut()
  async getSession()
  async getUser()
}
```

#### AuthMiddleware
```javascript
const authMiddleware = (req, res, next) => {
  // Проверка JWT токена из Supabase
  // Валидация пользователя
  // Добавление user объекта в req
}
```

### 2. Enhanced OpenAI Service

#### OpenAIService
```javascript
class OpenAIService {
  constructor(apiKey, model)
  async generateSummary(data, type) // type: 'company' | 'leaks'
  async createCompletion(prompt, options)
  handleResponsesAPI(response) // Для GPT-5
  handleChatCompletionsAPI(response) // Для других моделей
  createFallbackResponse(data, type)
}
```

### 3. DeHashed Integration

#### DeHashedService
```javascript
class DeHashedService {
  constructor(apiKey, baseUrl)
  async checkPassword(password)
  async searchByHash(hash)
  formatResults(rawData)
}
```

### 4. Error Handling System

#### ErrorHandler
```javascript
class ErrorHandler {
  static handleAPIError(error, source)
  static createFallbackResponse(data, type)
  static logError(error, context)
  static formatErrorResponse(error)
}
```

### 5. Frontend Authentication Components

#### AuthComponent
- Login/Register форма
- Session management
- Protected routes logic
- User profile display

## Data Models

### User Model (Supabase)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);
```

### Search History Model (Optional)
```sql
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  search_type VARCHAR(50) NOT NULL, -- 'leaks', 'company', 'password'
  query_data JSONB NOT NULL,
  results_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Response Models

#### StandardAPIResponse
```javascript
{
  ok: boolean,
  data?: any,
  error?: {
    code: string,
    message: string,
    details?: any
  },
  meta?: {
    timestamp: string,
    requestId: string,
    source: string
  }
}
```

#### CompanySummaryResponse
```javascript
{
  ok: boolean,
  model: string, // 'gpt-5', 'gpt-4', 'fallback'
  summary: {
    company: {
      name: string,
      inn: string,
      status: string,
      address: string,
      // ... other fields
    },
    ceo: { name: string, position: string },
    // ... other structured data
  },
  timestamp: string
}
```

#### PasswordCheckResponse
```javascript
{
  ok: boolean,
  isCompromised: boolean,
  breachCount: number,
  breaches: [{
    name: string,
    date: string,
    description: string,
    dataTypes: string[]
  }],
  recommendations: string[]
}
```

## Error Handling

### Error Categories
1. **Authentication Errors**: 401, 403
2. **API Integration Errors**: 502, 503, 504
3. **Validation Errors**: 400
4. **Rate Limiting**: 429
5. **Internal Errors**: 500

### Error Handling Strategy
```javascript
const errorHandlingStrategy = {
  // Retry logic for transient errors
  retryableErrors: [502, 503, 504, 429],
  maxRetries: 3,
  retryDelay: 1000, // ms
  
  // Fallback responses
  fallbackEnabled: true,
  fallbackTimeout: 30000, // ms
  
  // Logging
  logLevel: 'error',
  logDestination: 'console' // можно расширить до файлов/внешних сервисов
}
```

### OpenAI Error Handling
```javascript
async function handleOpenAIRequest(requestFn, fallbackFn) {
  try {
    // Основной запрос с таймаутом
    const response = await Promise.race([
      requestFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 30000)
      )
    ]);
    return response;
  } catch (error) {
    console.error('OpenAI request failed:', error);
    // Возвращаем fallback ответ
    return fallbackFn();
  }
}
```

## Testing Strategy

### Unit Tests
- AuthService methods
- OpenAIService error handling
- DeHashedService integration
- Error handling utilities

### Integration Tests
- API endpoints with authentication
- OpenAI integration with different models
- DeHashed API integration
- End-to-end authentication flow

### Error Scenario Tests
- Network failures
- API timeouts
- Invalid authentication tokens
- Malformed API responses

## Security Considerations

### Authentication Security
- JWT token validation
- Secure session management
- CORS configuration
- Rate limiting per user

### API Security
- Environment variable protection
- API key rotation strategy
- Input validation and sanitization
- SQL injection prevention (для будущих DB операций)

### Data Privacy
- Минимизация логирования чувствительных данных
- Secure password hashing для DeHashed запросов
- GDPR compliance considerations

## Performance Optimizations

### Caching Strategy
- Response caching for company data (TTL: 1 hour)
- User session caching
- API rate limit tracking

### Request Optimization
- Parallel API calls where possible
- Request deduplication
- Connection pooling for external APIs

### Frontend Optimizations
- Lazy loading of components
- Progressive enhancement
- Optimistic UI updates

## Deployment Considerations

### Environment Variables
```bash
# Existing
OPENAI_API_KEY=
OPENAI_MODEL=
ITP_TOKEN=
DYXLESS_TOKEN=
# ... other existing tokens

# New additions
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEHASHED_API_KEY=
DEHASHED_BASE_URL=https://api.dehashed.com
```

### Database Setup (Supabase)
- User authentication tables
- RLS (Row Level Security) policies
- Database migrations

### Monitoring and Logging
- API response times
- Error rates by endpoint
- Authentication success/failure rates
- External API availability

## Migration Plan

### Phase 1: Error Handling Improvements
1. Implement centralized error handling
2. Fix OpenAI API integration issues
3. Add proper fallback mechanisms

### Phase 2: Authentication Integration
1. Setup Supabase project
2. Implement authentication middleware
3. Update frontend with auth components

### Phase 3: Feature Enhancements
1. Remove fast mode functionality
2. Implement DeHashed integration
3. Add password check mode

### Phase 4: Testing and Optimization
1. Comprehensive testing
2. Performance optimization
3. Security audit