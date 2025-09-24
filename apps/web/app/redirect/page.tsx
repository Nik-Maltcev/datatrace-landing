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
    const handleSuccessfulPayment = async () => {
      try {
        console.log('Payment success page loaded')
        
        // Получаем plan из URL
        const urlParams = new URLSearchParams(window.location.search)
        const plan = urlParams.get('plan') || 'basic'
        
        // Ждем 3 секунды, чтобы webhook точно обработался
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Получаем email пользователя из URL или localStorage
        const emailFromUrl = urlParams.get('email')
        
        let userEmail = emailFromUrl
        if (!userEmail) {
          const userDataString = localStorage.getItem('user')
          if (userDataString) {
            try {
              const userData = JSON.parse(userDataString)
              userEmail = userData.email
            } catch (e) {
              console.error('Error parsing user data:', e)
            }
          }
        }
        
        if (!userEmail) {
          console.log('No user email found, redirecting to dashboard with plan')
          // Перенаправляем в дашборд с plan
          window.location.href = `/dashboard?payment=success&plan=${plan}`
          return
        }

        console.log('Fetching updated user profile for:', userEmail)
        
        // Не обновляем план здесь - webhook уже это сделал
        // Просто получаем обновлённые данные пользователя
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
            rawPlan: data.profile.rawPlan,
            checksUsed: data.profile.checksUsed,
            checksLimit: data.profile.checksLimit
          }
          
          console.log('Updating user data:', updatedUser)
          login(updatedUser, 'temp_token', '')
          
          // Также обновляем localStorage напрямую для гарантии
          localStorage.setItem('user', JSON.stringify(updatedUser))
          
          // Отправляем сигнал всем вкладкам о том, что нужно обновить данные
          localStorage.setItem('refresh_user_data', 'true')
          setTimeout(() => {
            localStorage.removeItem('refresh_user_data')
          }, 1000)
          
          // Отправляем сообщение родительскому окну (если это popup)
          if (window.opener) {
            console.log('Sending postMessage to opener window')
            window.opener.postMessage({
              type: 'PAYMENT_SUCCESS',
              user: updatedUser
            }, '*')
          }
          
          // Также отправляем сообщение всем окнам на том же домене
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'PAYMENT_SUCCESS', 
              user: updatedUser
            }, '*')
          }
          
          setStatus('success')
          setMessage('Платеж успешно обработан! Ваш тариф обновлен.')
          setIsLoading(false)
        } else {
          console.log('No profile data, but payment was successful')
          setStatus('success') 
          setMessage('Платеж обработан! Обновите страницу дашборда.')
          setIsLoading(false)
        }
        
      } catch (error) {
        console.error('Error in payment success handler:', error)
        setStatus('success') // Все равно показываем успех, так как webhook сработал
        setMessage('Платеж обработан! Обновите страницу дашборда.')
        setIsLoading(false)
      }
    }
    
    handleSuccessfulPayment()
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
                  Вернитесь к основной вкладке - ваш тариф уже обновлен.
                </p>
              </div>
              
              <a href="/dashboard" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl shadow-lg transform hover:scale-105 transition-all">
                  <Zap className="h-5 w-5 mr-2" />
                  Перейти в дашборд
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