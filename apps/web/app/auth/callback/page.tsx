"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Получаем параметры из URL
        const access_token = searchParams.get('access_token')
        const refresh_token = searchParams.get('refresh_token')
        const error = searchParams.get('error')
        const error_description = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(error_description || 'Ошибка подтверждения email')
          return
        }

        if (access_token && refresh_token) {
          // Сохраняем токены
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          // Получаем данные пользователя из токена (базовая декодировка JWT)
          try {
            const payload = JSON.parse(atob(access_token.split('.')[1]))
            
            // Сохраняем данные пользователя
            localStorage.setItem('user', JSON.stringify({
              id: payload.sub,
              email: payload.email,
              name: payload.user_metadata?.name || payload.email?.split('@')[0],
              phone: payload.user_metadata?.phone,
              isAuthenticated: true
            }))

            setStatus('success')
            setMessage('Email успешно подтвержден! Перенаправляем в личный кабинет...')
            
            // Перенаправляем в дашборд через 2 секунды
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError)
            setStatus('error')
            setMessage('Ошибка обработки данных авторизации')
          }
        } else {
          setStatus('error')
          setMessage('Отсутствуют необходимые параметры авторизации')
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
    </div>
  )
}