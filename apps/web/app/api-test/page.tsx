"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { API_ENDPOINTS } from "@/lib/api"

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testApiConnection = async () => {
    addResult("🧪 Начинаем тестирование API...")
    
    // Test 1: Check API configuration
    addResult(`🔧 NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'не установлен'}`)
    addResult(`🔗 API Base URL: ${API_ENDPOINTS.AUTH.SIGNUP.split('/api')[0]}`)
    addResult(`📍 Current origin: ${window.location.origin}`)
    
    // Test 2: Try to reach API health endpoint
    try {
      const healthUrl = `${API_ENDPOINTS.AUTH.SIGNUP.split('/api')[0]}/health`
      addResult(`🏥 Проверяем health endpoint: ${healthUrl}`)
      
      const response = await fetch(healthUrl)
      addResult(`📡 Health response status: ${response.status}`)
      
      if (response.ok) {
        const text = await response.text()
        addResult(`✅ Health check успешен: ${text}`)
      } else {
        addResult(`❌ Health check failed: ${response.statusText}`)
      }
    } catch (error) {
      addResult(`❌ Health check error: ${error.message}`)
    }
    
    // Test 3: Try to reach signup endpoint
    try {
      addResult(`🔐 Проверяем signup endpoint: ${API_ENDPOINTS.AUTH.SIGNUP}`)
      
      const response = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          name: "Test User",
          phone: "+7 999 123 45 67"
        })
      })
      
      addResult(`📡 Signup response status: ${response.status}`)
      addResult(`📡 Signup response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)
      
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        addResult(`✅ Получен JSON ответ: ${JSON.stringify(data, null, 2)}`)
      } else {
        const text = await response.text()
        addResult(`❌ Получен не-JSON ответ: ${text.substring(0, 200)}...`)
      }
    } catch (error) {
      addResult(`❌ Signup test error: ${error.message}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧪 API Configuration Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={testApiConnection}>
                Тестировать API
              </Button>
              <Button variant="outline" onClick={clearResults}>
                Очистить
              </Button>
            </div>
            
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">Нажмите "Тестировать API" для начала диагностики...</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              <h3 className="font-semibold mb-2">Ожидаемые результаты:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>✅ NEXT_PUBLIC_API_URL должен быть установлен</li>
                <li>✅ Health endpoint должен возвращать 200</li>
                <li>✅ Signup endpoint должен возвращать JSON (даже с ошибкой валидации)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}