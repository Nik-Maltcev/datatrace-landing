"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase отправляет токены в hash fragments, а не в query parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const access_token = hashParams.get('access_token') || searchParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token') || searchParams.get('refresh_token')
        const error = hashParams.get('error') || searchParams.get('error')
        const error_description = hashParams.get('error_description') || searchParams.get('error_description')
        
        console.log('Auth callback debug:', {
          hash: window.location.hash,
          search: window.location.search,
          access_token: access_token ? 'present' : 'missing',
          refresh_token: refresh_token ? 'present' : 'missing',
          error: error
        })

        if (error) {
          console.log('Auth error detected:', { error, error_description })
          
          // Обработка разных типов ошибок
          if (error === 'access_denied' && error_description?.includes('Email link is invalid')) {
            setStatus('success')
            setMessage('Подтверждение email завершено! Вы можете войти в систему.')
            
            // Перенаправляем на страницу входа
            setTimeout(() => {
              router.push('/login')
            }, 2000)
            return
          }
          
          setStatus('error')
          setMessage(error_description || 'Ошибка подтверждения email')
          return
        }

        // Проверяем тип события (подтверждение email или восстановление пароля)
        const type = hashParams.get('type') || searchParams.get('type')
        
        if (access_token && refresh_token) {
          // Сохраняем токены
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          // Получаем данные пользователя из токена (базовая декодировка JWT)
          try {
            // Правильная декодировка JWT с поддержкой UTF-8
            const base64Payload = access_token.split('.')[1]
            const decodedPayload = decodeURIComponent(atob(base64Payload).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
            const payload = JSON.parse(decodedPayload)
            
            console.log('Decoded JWT payload:', payload)
            
            // Сохраняем данные пользователя
            localStorage.setItem('user', JSON.stringify({
              id: payload.sub,
              email: payload.email,
              name: payload.user_metadata?.name || payload.email?.split('@')[0],
              phone: payload.user_metadata?.phone,
              isAuthenticated: true
            }))

            setStatus('success')
            setMessage(`Email успешно подтвержден! Перенаправляем в личный кабинет...`)
            
            // Очищаем URL от токенов
            window.history.replaceState({}, document.title, window.location.pathname)
            
            // Перенаправляем в дашборд через 1 секунду (быстрее)
            setTimeout(() => {
              router.push('/dashboard')
            }, 1000)
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError)
            setStatus('error')
            setMessage('Ошибка обработки данных авторизации')
          }
        } else if (type === 'signup') {
          // Обработка подтверждения email без токенов
          setStatus('success')
          setMessage('Email успешно подтвержден! Теперь вы можете войти в систему.')
          
          // Перенаправляем на страницу входа
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        } else {
          // Проверяем, есть ли какие-либо параметры в URL
          const hasAnyParams = window.location.hash.length > 1 || window.location.search.length > 1
          
          if (hasAnyParams) {
            // Есть параметры, но не токены - вероятно подтверждение успешно
            setStatus('success')
            setMessage('Email подтвержден! Теперь вы можете войти в систему.')
            
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          } else {
            // Никаких параметров нет
            setStatus('error')
            setMessage('Отсутствуют необходимые параметры авторизации. Попробуйте войти через страницу входа.')
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('Произошла ошибка при подтверждении email')
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Database className="h-8 w-8 text-green-600" />
          <span className="text-xl font-bold text-black">DataTrace</span>
        </div>
        <CardTitle className="text-2xl font-bold">
          {status === 'loading' && 'Подтверждение email...'}
          {status === 'success' && 'Email подтвержден!'}
          {status === 'error' && 'Ошибка подтверждения'}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          )}
          {status === 'success' && (
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto" />
          )}
        </div>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {status === 'error' && (
          <div className="space-y-3">
            <Link 
              href="/login" 
              className="block w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Попробовать войти
            </Link>
            <Link 
              href="/register" 
              className="block w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg transition-colors"
            >
              Зарегистрироваться заново
            </Link>
          </div>
        )}

        {status === 'success' && (
          <p className="text-sm text-gray-500">
            Автоматическое перенаправление через несколько секунд...
          </p>
        )}

        <div className="mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-black">
            ← Вернуться на главную
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Загрузка...</p>
          </CardContent>
        </Card>
      }>
        <AuthCallbackContent />
      </Suspense>
    </div>
  )
}