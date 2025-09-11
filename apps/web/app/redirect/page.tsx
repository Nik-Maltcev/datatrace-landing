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
        // Получаем transactionId из URL (PayAnyWay передает MNT_TRANSACTION_ID)
        const urlParams = new URLSearchParams(window.location.search)
        const transactionId = urlParams.get('MNT_TRANSACTION_ID') || urlParams.get('transactionId')
        
        console.log('All URL params:', Object.fromEntries(urlParams.entries()))
        console.log('Transaction ID from URL:', transactionId)
        
        if (!transactionId) {
          console.log('No transaction ID found in URL params')
          setStatus('error')
          setMessage('Ошибка: не найден ID транзакции в URL')
          setIsLoading(false)
          return
        }

        // Проверяем статус платежа каждые 2 секунды, максимум 30 секунд
        let attempts = 0
        const maxAttempts = 15

        const checkStatus = async (): Promise<void> => {
          attempts++
          console.log(`Checking payment status, attempt ${attempts}/${maxAttempts}`)
          
          try {
            const response = await fetch(`/api/check-payment?transactionId=${transactionId}`)
            const data = await response.json()
            
            console.log('Payment status response:', data)
            
            if (data.ok && data.status === 'completed' && data.profile) {
              // Платеж успешен, обновляем данные пользователя
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
              
              setStatus('success')
              setMessage('Платеж успешно обработан!')
              setIsLoading(false)
              
              // Перенаправляем в дашборд через 2 секунды
              setTimeout(() => {
                window.location.href = '/dashboard'
              }, 2000)
              
              return
            }
            
            if (attempts >= maxAttempts) {
              setStatus('error')
              setMessage('Время ожидания истекло. Попробуйте обновить страницу.')
              setIsLoading(false)
              return
            }
            
            // Ждем 2 секунды и проверяем снова
            setTimeout(checkStatus, 2000)
            
          } catch (error) {
            console.error('Error checking payment status:', error)
            
            if (attempts >= maxAttempts) {
              setStatus('error')
              setMessage('Ошибка при проверке статуса платежа')
              setIsLoading(false)
              return
            }
            
            // Повторяем через 2 секунды
            setTimeout(checkStatus, 2000)
          }
        }
        
        // Начинаем проверку через 3 секунды (чтобы webhook успел обработаться)
        setTimeout(checkStatus, 3000)
        
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
                  Перенаправляем в личный кабинет...
                </p>
              </div>
              
              <a href="/dashboard" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl shadow-lg transform hover:scale-105 transition-all">
                  <Zap className="h-5 w-5 mr-2" />
                  Перейти в кабинет
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