"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Database, Zap, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function PaymentSuccessPage() {
  const { login, user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Проверяем статус платежа...')

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        console.log('Starting payment status check...')
        
        // Ждем 5 секунд, чтобы webhook точно обработался
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Получаем email пользователя из localStorage
        const userDataString = localStorage.getItem('user')
        let userEmail = null
        
        if (userDataString) {
          try {
            const userData = JSON.parse(userDataString)
            userEmail = userData.email
            console.log('User email from localStorage:', userEmail)
          } catch (e) {
            console.error('Error parsing user data:', e)
          }
        }
        
        // Если нет email в localStorage, получаем из URL
        if (!userEmail) {
          const urlParams = new URLSearchParams(window.location.search)
          const subscriberId = urlParams.get('MNT_SUBSCRIBER_ID')
          if (subscriberId) {
            userEmail = decodeURIComponent(subscriberId)
            console.log('User email from URL:', userEmail)
          }
        }
        
        if (!userEmail) {
          console.log('No user email found')
          setStatus('error')
          setMessage('Ошибка: не найден email пользователя')
          setIsLoading(false)
          return
        }

        // Проверяем обновленные данные пользователя
        console.log('Fetching updated user profile for:', userEmail)
        
        const response = await fetch(`/api/user-profile?email=${encodeURIComponent(userEmail)}`)
        const data = await response.json()
        
        console.log('User profile response:', data)
        
        if (data.ok && data.profile) {
          // Обновляем данные пользователя
          const updatedUser = {
            id: data.profile.id,
            email: data.profile.email,
            name: data.profile.name,
            phone: data.profile.phone,
            isAuthenticated: true,
            plan: data.profile.plan,
            checksUsed: data.profile.checksUsed,
            checksLimit: data.profile.checksLimit
          }
          
          console.log('Updating user data:', updatedUser)
          login(updatedUser, 'temp_token', '')
          
          // Также обновляем localStorage напрямую для гарантии
          localStorage.setItem('user', JSON.stringify(updatedUser))
          
          // Отправляем событие для обновления других вкладок
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'user',
            newValue: JSON.stringify(updatedUser)
          }))
          
          setStatus('success')
          setMessage('Платеж успешно обработан! Можете закрыть эту вкладку и вернуться к основной.')
          setIsLoading(false)
          
          // Не перенаправляем автоматически, пусть пользователь сам закроет вкладку
          // setTimeout(() => {
          //   window.location.href = '/dashboard'
          // }, 2000)
        } else {
          console.error('Failed to get updated profile:', data)
          setStatus('error')
          setMessage('Ошибка при получении данных профиля')
          setIsLoading(false)
        }
        
      } catch (error) {
        console.error('Error in payment check:', error)
        setStatus('error')
        setMessage('Произошла ошибка при обработке платежа')
        setIsLoading(false)
      }
    }
    
    checkPaymentStatus()
  }, [login])


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Database className="h-8 w-8 text-black" />
            <span className="text-2xl font-bold text-black">DataTrace</span>
          </div>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              ) : status === 'success' ? (
                <CheckCircle className="h-12 w-12 text-green-600" />
              ) : (
                <div className="h-12 w-12 text-red-600">❌</div>
              )}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            {isLoading ? (
              <span className="text-blue-600">Обработка платежа...</span>
            ) : status === 'success' ? (
              <span className="text-green-600">Оплата успешна!</span>
            ) : (
              <span className="text-red-600">Ошибка платежа</span>
            )}
          </CardTitle>
          <p className="text-lg text-gray-600">
            {message}
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-6 pt-4">
          {status === 'success' && (
            <>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 mb-2">
                  🎉 Поздравляем! Ваш тариф активирован и готов к использованию.
                </p>
                <p className="text-sm text-gray-500">
                  Можете закрыть эту вкладку и вернуться к основной, ваш тариф уже обновлен.
                </p>
              </div>
              
              <Button 
                onClick={() => window.close()} 
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl shadow-lg transform hover:scale-105 transition-all"
              >
                <Zap className="h-5 w-5 mr-2" />
                Закрыть вкладку
              </Button>
              
              <a href="/dashboard" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full border-gray-300 text-gray-600 hover:bg-gray-50">
                  Открыть дашборд в новой вкладке
                </Button>
              </a>
            </>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Обновить страницу
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-gray-300 text-gray-600 hover:bg-gray-50">
                  Перейти в кабинет
                </Button>
              </Link>
            </div>
          )}
          
          <div className="flex justify-center space-x-4 pt-4">
            <Link href="/">
              <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                На главную
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}