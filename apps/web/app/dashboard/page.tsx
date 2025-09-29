"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PhoneVerification from "@/components/PhoneVerification"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Shield,
  Activity,
  AlertTriangle,
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  Clock,
  Zap,
  ChevronDown,
  Monitor,
  ChevronRight,
  Trash2,
  Brain
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { user, logout, refreshUserData, updateUserChecks } = useAuth()
  const searchParams = useSearchParams()
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [phoneResult, setPhoneResult] = useState<any>(null)
  const [emailResult, setEmailResult] = useState<any>(null)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [breachEmail, setBreachEmail] = useState(user?.email || '')
  const [emailBreachResult, setEmailBreachResult] = useState<any>(null)
  const [isCheckingEmailBreach, setIsCheckingEmailBreach] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentProcessed, setPaymentProcessed] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [isCheckingTransaction, setIsCheckingTransaction] = useState(false)
  const [passwordToCheck, setPasswordToCheck] = useState('')
  const [passwordResult, setPasswordResult] = useState<any>(null)
  const [isCheckingPassword, setIsCheckingPassword] = useState(false)

  // Обработка успешного платежа
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const plan = searchParams.get('plan') || 'basic'
    
    if (paymentStatus === 'success' && user?.email && !paymentProcessed) {
      setPaymentSuccess(true)
      setPaymentProcessed(true)
      
      // Вызываем API для обновления плана пользователя
      const updateUserPlan = async () => {
        try {
          const response = await fetch('/api/payment-success', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              plan: plan
            }),
          })
          
          const data = await response.json()
          
          if (data.ok) {
            console.log('Plan updated successfully')
            // Обновляем данные пользователя
            refreshUserData()
          } else {
            console.error('Failed to update plan:', data.error)
          }
        } catch (error) {
          console.error('Error updating plan:', error)
        }
      }
      
      // Обновляем план
      updateUserPlan()
      
      // Убираем параметры из URL через 5 секунд
      setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('payment')
        url.searchParams.delete('plan')
        window.history.replaceState({}, '', url.toString())
        setPaymentSuccess(false)
        setPaymentProcessed(false)
      }, 5000)
    }
  }, [searchParams, user?.email, paymentProcessed])


  useEffect(() => {
    if (user?.phone) {
      // Проверяем верификацию телефона из localStorage
      const phoneToken = localStorage.getItem('phone_verification_token')
      const verifiedPhone = localStorage.getItem('verified_phone')
      if (phoneToken && verifiedPhone && verifiedPhone === user.phone) {
        console.log('Phone verification found in localStorage')
        setIsPhoneVerified(true)
      } else {
        setIsPhoneVerified(false)  // Заглушка - проверка через PhoneVerification компонент
      }
    }
  }, [user])

  useEffect(() => {
    if (user?.email) {
      setBreachEmail(user.email)
    }
  }, [user?.email])

  const handleCheckTransaction = async () => {
    if (!transactionId.trim()) {
      alert('Пожалуйста, введите ID транзакции')
      return
    }

    if (!user?.email) {
      alert('Ошибка: пользователь не найден')
      return
    }

    setIsCheckingTransaction(true)
    try {
      const response = await fetch('/api/check-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transactionId.trim(),
          email: user.email
        }),
      })

      const data = await response.json()

      if (data.ok) {
        alert(`Успешно! Ваш тариф обновлён до ${data.plan}`)
        refreshUserData()
        setTransactionId('')
      } else {
        alert(`Ошибка: ${data.error.message}`)
      }
    } catch (error) {
      console.error('Error checking transaction:', error)
      alert('Произошла ошибка при проверке транзакции')
    } finally {
      setIsCheckingTransaction(false)
    }
  }



  const handleCheckPhoneLeaks = async () => {
    if (!user?.phone || isCheckingPhone) return
    
    // Проверяем верификацию телефона
    if (!isPhoneVerified) {
      console.log('❌ Phone verification required');
      return;
    }
    
    const checksUsed = user.checksUsed ?? 0
    const checksLimit = user.checksLimit ?? 0
    if (Number.isFinite(checksLimit) && checksLimit >= 0 && checksUsed >= checksLimit) {
      console.log('❌ Checks limit reached');
      return;
    }
    
    setIsCheckingPhone(true)
    try {
      const response = await fetch('/api/leaks/check-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: user.phone, 
          userId: user.email // Добавляем email для сохранения истории
        }),
      })
      const data = await response.json()
      
      // Детальное логирование для отладки
      console.log('📱 Phone check response:', {
        ok: data.ok,
        found: data.found,
        totalLeaks: data.totalLeaks,
        resultsLength: data.results?.length,
        results: data.results?.map((r: any) => ({
          name: r.name,
          found: r.found,
          count: r.count,
          hasItems: !!(r.items && r.items.length > 0)
        }))
      })
      
      setPhoneResult(data)
      
      // Обновляем счетчик проверок локально после успешной проверки
      if (data.ok) {
        updateUserChecks(checksUsed + 1)
        console.log('✅ Phone check counter updated');
      }
    } catch (error) {
      console.error('Phone check error:', error)
    }
    setIsCheckingPhone(false)
  }

  const handleCheckEmailLeaks = async () => {
    if (!user?.email || isCheckingEmail) return
    
    // Проверяем верификацию телефона
    if (!isPhoneVerified) {
      console.log('❌ Phone verification required');
      return;
    }
    
    const checksUsed = user.checksUsed ?? 0
    const checksLimit = user.checksLimit ?? 0
    if (Number.isFinite(checksLimit) && checksLimit >= 0 && checksUsed >= checksLimit) {
      console.log('❌ Checks limit reached');
      return;
    }
    
    setIsCheckingEmail(true)
    try {
      const response = await fetch('/api/leaks/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: user.email, 
          userId: user.email // Добавляем email для сохранения истории
        }),
      })
      const data = await response.json()
      setEmailResult(data)
      
      // Обновляем счетчик проверок локально после успешной проверки
      if (data.ok) {
        updateUserChecks(checksUsed + 1)
        console.log('✅ Email check counter updated');
      }
    } catch (error) {
      console.error('Email check error:', error)
    }
    setIsCheckingEmail(false)
  }

  const handleCheckPassword = async () => {
    if (isCheckingPassword) {
      return
    }

    const password = passwordToCheck.trim()
    if (!password) {
      setPasswordResult({ ok: false, error: 'Введите пароль для проверки' })
      return
    }



    const checksUsed = user?.checksUsed ?? 0
    const checksLimit = user?.checksLimit ?? 0
    if (Number.isFinite(checksLimit) && checksLimit >= 0 && checksUsed >= checksLimit) {
      console.log('❌ Checks limit reached')
      setPasswordResult({ ok: false, error: 'Вы использовали все доступные проверки по текущему тарифу.' })
      return
    }

    setIsCheckingPassword(true)
    setPasswordResult(null)

    try {
      const response = await fetch('/api/check-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password,
          userEmail: user?.email
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.ok) {
        const message =
          typeof data?.error === 'string'
            ? data.error
            : data?.error?.message ||
              'Не удалось выполнить проверку. Попробуйте позже.'

        setPasswordResult({
          ok: false,
          error: message,
          code: data?.error?.code,
        })
        return
      }

      setPasswordResult(data)
      updateUserChecks(checksUsed + 1)
    } catch (error) {
      console.error('Password check error:', error)
      setPasswordResult({
        ok: false,
        error: 'Не удалось выполнить проверку. Попробуйте позже.'
      })
    } finally {
      setIsCheckingPassword(false)
    }
  }

  const handleCheckEmailBreach = async () => {
    if (isCheckingEmailBreach) {
      return
    }

    const emailToCheck = breachEmail.trim()
    if (!emailToCheck) {
      setEmailBreachResult({ ok: false, error: 'Введите email для проверки' })
      return
    }



    const checksUsed = user?.checksUsed ?? 0
    const checksLimit = user?.checksLimit ?? 0
    if (Number.isFinite(checksLimit) && checksLimit >= 0 && checksUsed >= checksLimit) {
      console.log('❌ Checks limit reached')
      setEmailBreachResult({ ok: false, error: 'Вы использовали все доступные проверки по текущему тарифу.' })
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(emailToCheck)) {
      setEmailBreachResult({ ok: false, error: 'Некорректный email' })
      return
    }

    setIsCheckingEmailBreach(true)
    setEmailBreachResult(null)

    try {
      const response = await fetch('/api/leaks/check-email-breach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToCheck,
          userId: user?.email
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.ok) {
        const message =
          typeof data?.error === 'string'
            ? data.error
            : data?.error?.message ||
              'Не удалось выполнить проверку. Попробуйте позже.'

        setEmailBreachResult({
          ok: false,
          error: message,
          code: data?.error?.code,
        })
        return
      }

      setEmailBreachResult(data)
      updateUserChecks(checksUsed + 1)
    } catch (error) {
      console.error('Email breach check error:', error)
      setEmailBreachResult({
        ok: false,
        error: 'Не удалось выполнить проверку. Попробуйте позже.'
      })
    } finally {
      setIsCheckingEmailBreach(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Payment Success Alert */}
      {paymentSuccess && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Оплата прошла успешно!</strong> Ваш тарифный план обновляется. Обновите страницу через несколько секунд.
          </AlertDescription>
        </Alert>
      )}

      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать, {user.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Мониторинг и защита ваших персональных данных</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end md:w-auto">
          <Link href="/">
            <Button variant="outline" className="border-gray-300 hover:bg-gray-50 w-full sm:w-auto">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Вернуться на сайт
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {user.plan === 'professional' ? 'ПРОФЕССИОНАЛЬНЫЙ' : 
                 user.plan === 'basic' ? 'БАЗОВЫЙ' : 'БЕСПЛАТНЫЙ'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {user.checksUsed ?? 0}/{user.checksLimit ?? 0}
            </p>
            <p className="text-sm text-blue-700">
              Проверок использовано
              {(user.checksLimit ?? 0) === 0 ? ' (лимит исчерпан)' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Активен
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 mb-1">24/7</p>
            <p className="text-sm text-green-700">Мониторинг данных</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                Обновлено
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 mb-1">Сегодня</p>
            <p className="text-sm text-purple-700">Последняя проверка</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Проверить телефон</CardTitle>
                <p className="text-sm text-gray-500">Поиск утечек номера телефона</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {user.phone ? `Проверить ${user.phone}` : "Введите номер для проверки"}
            </p>
            <Button 
              onClick={handleCheckPhoneLeaks}
              disabled={!user.phone || isCheckingPhone || !isPhoneVerified}
              className="w-full"
            >
              {isCheckingPhone ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверяю...
                </>
              ) : !isPhoneVerified ? (
                'Подтвердите номер телефона'
              ) : (
                <>
                  Проверить номер
                  <Phone className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            {phoneResult && (
              <div className={`mt-3 p-4 rounded-lg border ${
                phoneResult.error ? 'bg-red-50 border-red-200' :
                phoneResult.found ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              }`}>
                {phoneResult.error ? (
                  <p className="text-sm text-red-600">{phoneResult.error}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">
                        {phoneResult.found ? (
                          <>
                            <AlertTriangle className="inline h-4 w-4 mr-1 text-red-600" />
                            Найдено утечек: {phoneResult.totalLeaks || 0}
                          </>
                        ) : (
                          "Данные в безопасности"
                        )}
                      </p>
                    </div>
                    {phoneResult.found && phoneResult.results && (
                      <div className="mt-3 space-y-2">
                        {phoneResult.results.filter((r: any) => r.found).map((result: any, idx: number) => {
                          const sourceName = result.source || result.name
                          
                          return (
                            <div key={idx} className="bg-white rounded-lg border border-red-200 p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="h-3 w-3 text-red-600" />
                                  </div>
                                  <span className="font-medium text-sm">{sourceName}</span>
                                </div>
                                <Badge variant="destructive" className="text-xs">
                                  {result.count || 0} записей
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Проверить почту на взлом</CardTitle>
                <p className="text-sm text-gray-500">BreachDirectory — поиск в утечках</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <label className="text-sm text-gray-600" htmlFor="breach-email-input">Email для проверки</label>
              <input
                id="breach-email-input"
                type="email"
                value={breachEmail}
                onChange={(e) => setBreachEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="name@example.com"
              />
            </div>
            <Button
              onClick={handleCheckEmailBreach}
              disabled={isCheckingEmailBreach || !breachEmail.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isCheckingEmailBreach ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверяю...
                </>
              ) : (
                <>
                  Проверить на взлом
                  <Shield className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            {emailBreachResult && (
              <div
                className={`mt-3 p-4 rounded-lg border ${
                  emailBreachResult.ok
                    ? emailBreachResult.found
                      ? 'bg-red-50 border-red-200'
                      : 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {emailBreachResult.ok ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">
                        {emailBreachResult.found ? (
                          <>
                            <AlertTriangle className="inline h-4 w-4 mr-1 text-red-600" />
                            Найдено утечек: {emailBreachResult.totalLeaks || 0}
                          </>
                        ) : (
                          'Новых утечек не обнаружено'
                        )}
                      </p>
                      {emailBreachResult.found && (
                        <Badge variant="destructive" className="text-xs">
                          {emailBreachResult.foundSources || 0} источников
                        </Badge>
                      )}
                    </div>
                    {emailBreachResult.message && (
                      <p className="text-sm text-gray-700">{emailBreachResult.message}</p>
                    )}
                    {emailBreachResult.found && Array.isArray(emailBreachResult.results) && (
                      <div className="mt-3 space-y-2">
                        {emailBreachResult.results
                          .filter((result: any) => result?.found)
                          .map((result: any, index: number) => (
                            <div key={index} className="bg-white rounded-lg border border-red-200 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="h-3 w-3 text-red-600" />
                                  </div>
                                  <span className="text-sm font-medium">{result.name}</span>
                                </div>
                                <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                  {result.count || 0} записей
                                </Badge>
                              </div>
                              {result.error && (
                                <p className="mt-2 text-xs text-red-600">{result.error}</p>
                              )}
                              {result.items && (
                                <div className="mt-3 space-y-2">
                                  {(() => {
                                    // Обработка данных от BreachDirectory API
                                    let items = []
                                    
                                    if (Array.isArray(result.items)) {
                                      items = result.items
                                    } else if (Array.isArray(result.items.result)) {
                                      items = result.items.result
                                    } else if (result.items.result) {
                                      items = [result.items.result]
                                    } else {
                                      items = [result.items]
                                    }
                                    
                                    return items.map((item: any, itemIndex: number) => {
                                      const sources = Array.isArray(item.sources) ? item.sources.join(', ') : (item.sources || 'Неизвестный источник')
                                      const hasPassword = item.hash_password || item.password
                                      const password = item.password || (item.hash_password ? '••••••••' : null)
                                      const email = item.email ? item.email.replace('mailto:', '') : breachEmail
                                      
                                      return (
                                        <div key={itemIndex} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-medium text-gray-600">Источник:</span>
                                              <span className="text-xs text-gray-800 font-mono bg-white px-2 py-1 rounded">{sources}</span>
                                            </div>
                                            
                                            {hasPassword && (
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-red-600">Пароль скомпрометирован:</span>
                                                <div className="flex items-center space-x-2">
                                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                                  <span className="text-xs text-red-600 font-mono bg-red-50 px-2 py-1 rounded">
                                                    {password || 'Да'}
                                                  </span>
                                                </div>
                                              </div>
                                            )}
                                            
                                            {item.sha1 && (
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-600">SHA1 хеш:</span>
                                                <span className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded truncate max-w-32">
                                                  {item.sha1.substring(0, 16)}...
                                                </span>
                                              </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-medium text-gray-600">Email:</span>
                                              <span className="text-xs text-gray-800 font-mono bg-white px-2 py-1 rounded">{email}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })
                                  })()
                                  }
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-red-600">
                    {emailBreachResult.error || 'Не удалось выполнить проверку'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Проверить пароль</CardTitle>
                <p className="text-sm text-gray-500">DeHashed — поиск в утечках</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <label className="text-sm text-gray-600" htmlFor="password-input">Пароль для проверки</label>
              <input
                id="password-input"
                type="password"
                value={passwordToCheck}
                onChange={(e) => setPasswordToCheck(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Введите пароль"
              />
            </div>
            <Button
              onClick={handleCheckPassword}
              disabled={isCheckingPassword || !passwordToCheck.trim()}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isCheckingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверяю...
                </>
              ) : (
                <>
                  Проверить пароль
                  <Shield className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            {passwordResult && (
              <div
                className={`mt-3 p-4 rounded-lg border ${
                  passwordResult.ok
                    ? passwordResult.isCompromised
                      ? 'bg-red-50 border-red-200'
                      : 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {passwordResult.ok ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">
                        {passwordResult.isCompromised ? (
                          <>
                            <AlertTriangle className="inline h-4 w-4 mr-1 text-red-600" />
                            Пароль скомпрометирован!
                          </>
                        ) : (
                          'Пароль в безопасности'
                        )}
                      </p>
                      {passwordResult.isCompromised && (
                        <Badge variant="destructive" className="text-xs">
                          {passwordResult.breachCount || 0} записей
                        </Badge>
                      )}
                    </div>
                    {passwordResult.message && (
                      <p className="text-sm text-gray-700 mb-3">{passwordResult.message}</p>
                    )}
                    {passwordResult.databases && passwordResult.databases.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-600">Найден в базах данных:</p>
                        <div className="flex flex-wrap gap-1">
                          {passwordResult.databases.map((db: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs text-red-600 border-red-300">
                              {db}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {passwordResult.recommendations && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-gray-600">Рекомендации:</p>
                        <div className="space-y-1">
                          {passwordResult.recommendations.slice(0, 3).map((rec: string, index: number) => (
                            <p key={index} className="text-xs text-gray-700">{rec}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-red-600">
                    {passwordResult.error || 'Не удалось выполнить проверку'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">История проверок</CardTitle>
                <p className="text-sm text-gray-500">Просмотр всех проверок</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Посмотрите результаты предыдущих проверок и управляйте данными
            </p>
            <Link href="/dashboard/checks">
              <Button variant="outline" className="w-full">
                Открыть историю
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Additional Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Управление тарифом</CardTitle>
                <p className="text-sm text-gray-500">Подписка и оплата</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Просмотрите текущий тариф или обновитесь для большего количества проверок
            </p>
            <Link href="/payment">
              <Button variant="outline" className="w-full">
                Управлять тарифом
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Мониторинг утечек</CardTitle>
                <p className="text-sm text-gray-500">Автоматическое отслеживание и удаление</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Активируйте Telegram-бота для получения уведомлений о новых утечках ваших данных и возможности их удаления в режиме реального времени
            </p>
            <Button 
              variant={user?.plan === 'professional' ? "default" : "outline"} 
              className="w-full" 
              disabled={user?.plan !== 'professional'}
              onClick={() => {
                if (user?.plan === 'professional') {
                  window.open('https://t.me/datatrace_monitor_bot', '_blank')
                }
              }}
            >
              {user?.plan === 'professional' ? 'Запустить мониторинг' : 'Доступно в Professional'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Phone Verification Section */}
      {user.phone && !isPhoneVerified && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Подтвердите номер телефона</h3>
            </div>
            <p className="text-yellow-700 mb-4">
              Для полноценной работы с сервисом необходимо подтвердить ваш номер телефона
            </p>
            <PhoneVerification 
              onVerified={(token: string) => setIsPhoneVerified(true)}
              isVerified={isPhoneVerified}
              userPhone={user.phone}
              userPlan={user.plan}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}