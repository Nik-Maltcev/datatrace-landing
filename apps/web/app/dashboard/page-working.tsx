"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import PhoneVerification from "@/components/PhoneVerification"
import {
  Search,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  Clock,
  Zap,
  Crown,
  TrendingUp
} from "lucide-react"

import Link from "next/link"

interface User {
  email: string
  name: string
  phone?: string
  isAuthenticated: boolean
}

interface LeakResult {
  name: string
  source?: string
  data: any
  found: boolean
  count?: number
  ok?: boolean
  error?: any
}

interface PhoneCheckResponse {
  ok: boolean
  phone?: string
  email?: string
  totalLeaks: number
  foundSources?: number
  results: LeakResult[]
  errors?: Array<{ source: string; error: string }>
  message: string
  timestamp?: string
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout, updateUserChecks, refreshUserData } = useAuth()

  // Состояние верификации телефона
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)

  // Принудительно обновляем данные при загрузке компонента
  useEffect(() => {
    if (user?.email && !isAuthLoading) {
      console.log('Dashboard loaded, refreshing user data to ensure latest info')
      console.log('Current user data:', {
        plan: user.plan,
        checksUsed: user.checksUsed, 
        checksLimit: user.checksLimit,
        email: user.email
      })
      refreshUserData()
    }
  }, [user?.email, isAuthLoading])
  
  // Проверяем верификацию телефона при загрузке
  useEffect(() => {
    const verificationToken = localStorage.getItem('phone_verification_token')
    const verifiedPhone = localStorage.getItem('verified_phone')
    
    // Если есть токен, но номер телефона в профиле изменился - сбрасываем верификацию
    if (verificationToken && verifiedPhone && user?.phone && verifiedPhone !== user.phone) {
      console.log('📱 Номер телефона изменился, сбрасываем верификацию')
      localStorage.removeItem('phone_verification_token')
      localStorage.removeItem('verified_phone')
      setIsPhoneVerified(false)
    } else if (verificationToken && (!user?.phone || verifiedPhone === user?.phone)) {
      setIsPhoneVerified(true)
    }
  }, [user?.phone])

  const handlePhoneVerified = (token: string) => {
    setIsPhoneVerified(true)
  }
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [phoneLeaks, setPhoneLeaks] = useState<LeakResult[] | null>(null)
  const [emailLeaks, setEmailLeaks] = useState<LeakResult[] | null>(null)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [showPhoneDetails, setShowPhoneDetails] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoMessage, setPromoMessage] = useState('')
  const [isCheckingPromo, setIsCheckingPromo] = useState(false)
  const [showEmailDetails, setShowEmailDetails] = useState(false)
  const [phoneCheckResponse, setPhoneCheckResponse] = useState<PhoneCheckResponse | null>(null)
  const [emailCheckResponse, setEmailCheckResponse] = useState<PhoneCheckResponse | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isAuthLoading, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleCheckPhoneLeaks = async () => {
    console.log('🚀 Starting phone check for user:', user)

    // Проверяем верификацию телефона
    if (!isPhoneVerified) {
      setPhoneError("Сначала подтвердите ваш номер телефона")
      return
    }

    if (!user?.phone) {
      setPhoneError("Номер телефона не указан в профиле")
      return
    }

    // Проверяем лимит проверок
    if (user.checksUsed >= user.checksLimit) {
      setShowUpgradeModal(true)
      return
    }

    console.log('📱 Checking phone:', user.phone)

    setIsCheckingPhone(true)
    setPhoneError(null)
    setPhoneLeaks(null)
    setPhoneCheckResponse(null)

    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error("Токен авторизации не найден")
      }

      console.log('🔑 Token found, making API request...')

      // Используем локальный Next.js API route с логикой из основного API
      const response = await fetch('/api/check-user-phone', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: user.phone,
          userId: user.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Ошибка при проверке телефона")
      }

      const data = await response.json()

      console.log('📱 Phone check API response:', data)
      console.log('📊 Phone check results:', data.results)

      // Данные уже приходят в правильном формате от нового API
      const transformedResults = data.results?.map((result: any) => ({
        name: result.name,
        source: result.name,
        found: result.ok && (
          Array.isArray(result.items) ? result.items.length > 0 :
          (typeof result.items === 'object' && result.items !== null) ? Object.keys(result.items).length > 0 :
          false
        ),
        count: Array.isArray(result.items) ? result.items.length :
               (typeof result.items === 'object' && result.items !== null) ?
               Object.values(result.items).reduce((sum: number, items: any) => sum + (Array.isArray(items) ? items.length : 0), 0) : 0,
        ok: result.ok,
        error: result.error
      })) || []

      setPhoneLeaks(transformedResults)
      setPhoneCheckResponse({
        ok: data.ok,
        phone: data.phone,
        totalLeaks: data.totalLeaks,
        foundSources: data.foundSources,
        results: transformedResults,
        message: data.message,
        timestamp: data.timestamp
      })

      // Увеличиваем счетчик использованных проверок
      updateUserChecks((user.checksUsed || 0) + 1)

      if (data.totalLeaks > 0) {
        setShowPhoneDetails(true)
      }
    } catch (error) {
      console.error("Phone check error:", error)
      setPhoneError(error instanceof Error ? error.message : "Не удалось проверить утечки по номеру телефона")
    } finally {
      setIsCheckingPhone(false)
    }
  }

  const handleCheckEmailLeaks = async () => {
    console.log('🚀 Starting email check for user:', user)

    if (!user?.email) {
      setEmailError("Email не указан в профиле")
      return
    }

    // Проверяем лимит проверок
    if (user.checksUsed >= user.checksLimit) {
      setShowUpgradeModal(true)
      return
    }

    console.log('📧 Checking email:', user.email)

    setIsCheckingEmail(true)
    setEmailError(null)
    setEmailLeaks(null)
    setEmailCheckResponse(null)

    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error("Токен авторизации не найден")
      }

      console.log('🔑 Token found, making API request...')

      // Используем локальный Next.js API route с логикой из основного API
      const response = await fetch('/api/check-user-email', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Ошибка при проверке email")
      }

      const data = await response.json()

      console.log('📧 Email check API response:', data)
      console.log('📊 Email check results:', data.results)

      // Данные уже приходят в правильном формате от нового API
      const transformedResults = data.results?.map((result: any) => ({
        name: result.name,
        source: result.name,
        found: result.ok && (
          Array.isArray(result.items) ? result.items.length > 0 :
          (typeof result.items === 'object' && result.items !== null) ? Object.keys(result.items).length > 0 :
          false
        ),
        count: Array.isArray(result.items) ? result.items.length :
               (typeof result.items === 'object' && result.items !== null) ?
               Object.values(result.items).reduce((sum: number, items: any) => sum + (Array.isArray(items) ? items.length : 0), 0) : 0,
        ok: result.ok,
        error: result.error
      })) || []

      setEmailLeaks(transformedResults)
      setEmailCheckResponse({
        ok: data.ok,
        email: data.email,
        totalLeaks: data.totalLeaks,
        foundSources: data.foundSources,
        results: transformedResults,
        message: data.message,
        timestamp: data.timestamp
      })

      // Увеличиваем счетчик использованных проверок
      updateUserChecks((user.checksUsed || 0) + 1)

      if (data.totalLeaks > 0) {
        setShowEmailDetails(true)
      }
    } catch (error) {
      console.error("Email check error:", error)
      setEmailError(error instanceof Error ? error.message : "Не удалось проверить утечки по email")
    } finally {
      setIsCheckingEmail(false)
    }
  }
  // Обновляем данные при фокусе на вкладку
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, refreshing user data...')
      refreshUserData()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Слушаем сообщения от popup окон (платежные страницы)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received postMessage:', event.data)
      
      if (event.data?.type === 'PAYMENT_SUCCESS') {
        console.log('Payment success message received, updating user data')
        
        if (event.data.user) {
          // Обновляем данные пользователя из сообщения
          const updatedUser = event.data.user
          console.log('Updating user from postMessage:', updatedUser)
          
          // Обновляем localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser))
          
          // Принудительно обновляем данные из API для гарантии
          setTimeout(() => {
            console.log('Refreshing user data after postMessage')
            refreshUserData()
          }, 1000)
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Функция принудительного обновления данных
  const handleRefreshData = () => {
    console.log('Manual refresh user data...')
    refreshUserData()
  }

  // Функция проверки промокода
  const handlePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoMessage('Введите промокод')
      return
    }

    setIsCheckingPromo(true)
    setPromoMessage('')
    setPromoDiscount(0)

    try {
      // Здесь можно добавить API запрос для проверки промокода
      // Пока делаем простую проверку
      const validPromoCodes: { [key: string]: { discount: number; message: string } } = {
        'SAVE10': { discount: 10, message: 'Скидка 10% применена!' },
        'SAVE20': { discount: 20, message: 'Скидка 20% применена!' },
        'NEWUSER': { discount: 15, message: 'Скидка для новых пользователей 15%!' },
        'DATATRACE2025': { discount: 25, message: 'Новогодняя скидка 25%!' }
      }

      const promo = validPromoCodes[promoCode.toUpperCase()]
      if (promo) {
        setPromoDiscount(promo.discount)
        setPromoMessage(promo.message)
      } else {
        setPromoMessage('Промокод не найден или недействителен')
      }
    } catch (error) {
      console.error('Error checking promo code:', error)
      setPromoMessage('Ошибка при проверке промокода')
    } finally {
      setIsCheckingPromo(false)
    }
  }

  const handlePayment = async (plan: 'basic' | 'professional') => {
    console.log('Payment button clicked:', plan)
    if (!user) {
      console.error('No user found')
      return
    }
    
    setIsPaymentLoading(true)
    try {
      console.log('Creating payment for:', { plan, userId: user.id, userEmail: user.email })
      
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan,
          userId: user.id,
          userEmail: user.email
        })
      })

      console.log('Payment API response status:', response.status)
      const data = await response.json()
      console.log('Payment API response data:', data)

      if (data.ok) {
        console.log('Redirecting to payment URL:', data.paymentUrl)
        // Перенаправляем на страницу оплаты
        window.location.href = data.paymentUrl
      } else {
        console.error('Payment creation failed:', data.error)
        alert('Ошибка создания платежа: ' + data.error)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Ошибка при создании платежа')
    } finally {
      setIsPaymentLoading(false)
    }
  }

  const handleCheckPassword = async (password: string) => {
    if (!password.trim()) {
      alert('Пожалуйста, введите пароль')
      return
    }

    try {
      const response = await fetch('/api/check-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: password,
          userEmail: user?.email
        })
      })

      const data = await response.json()

      if (data.ok) {
        const message = data.isCompromised 
          ? `Пароль скомпрометирован! Найдено ${data.breachCount} записей в утечках данных`
          : 'Пароль не найден в известных утечках'
        
        alert(message + '\n\nРекомендации:\n' + data.recommendations.join('\n'))
        
        // Очищаем поле ввода
        const input = document.getElementById('password-input') as HTMLInputElement
        if (input) input.value = ''
      } else {
        alert('Ошибка: ' + data.error?.message)
      }
    } catch (error) {
      console.error('Password check error:', error)
      alert('Ошибка при проверке пароля')
    }
  }

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Добро пожаловать, {user.name}
        </h1>
        <p className="text-gray-600">Мониторинг и защита ваших персональных данных</p>
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <p className="text-sm text-blue-700">Проверок использовано</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Проверить данные</CardTitle>
                <p className="text-sm text-gray-500">Поиск утечек в базах данных</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Выполните проверку своих email, телефона или других данных на предмет утечек
            </p>
            <Link href="/dashboard/checks">
              <Button className="w-full">
                Перейти к проверкам
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Управление тарифом</CardTitle>
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
      </div>
            <p className="text-sm text-gray-500">Найдено утечек</p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs text-green-600">Успешно</span>
            </div>
            <p className="text-2xl font-light mb-1 text-gray-900">5</p>
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
            <PhoneVerification />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-light text-gray-900">Ваш тариф</h2>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshData}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                  {user.plan === 'professional' ? 'ПРОФЕССИОНАЛЬНЫЙ' : 
                   user.plan === 'basic' ? 'БАЗОВЫЙ' : 'БЕСПЛАТНЫЙ'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-70 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Лимит проверок</p>
              <p className="text-xl font-bold text-gray-900">{user.checksLimit ?? 0}</p>
            </div>
            <div className="bg-white bg-opacity-70 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Использовано</p>
              <p className="text-xl font-bold text-gray-900">{user.checksUsed ?? 0}</p>
            </div>
            <div className="bg-white bg-opacity-70 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Осталось</p>
              <p className="text-xl font-bold text-green-600">{(user.checksLimit ?? 0) - (user.checksUsed ?? 0)}</p>
            </div>
          </div>
        </div>

        {/* User Data Section */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light text-gray-900">Ваши защищенные данные</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <Lock className="h-4 w-4 mr-2" />
              Изменить
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email адрес</p>
                    <p className="font-mono text-sm text-gray-900">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Номер телефона</p>
                    <p className="font-mono text-sm text-gray-900">{user.phone || "Не указан"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phone Verification */}
        <PhoneVerification 
          onVerified={handlePhoneVerified}
          isVerified={isPhoneVerified}
          userPhone={user?.phone}
          userPlan={user?.plan}
        />

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-green-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-gray-900">Проверка телефона</h3>
                  <p className="text-xs text-gray-500 font-mono">{user.phone || "Не указан"}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Сканирование баз данных на наличие утечек вашего номера
            </p>
            <Button
              onClick={handleCheckPhoneLeaks}
              disabled={isCheckingPhone || !user.phone || (user.checksUsed >= user.checksLimit) || !isPhoneVerified || user.plan === 'free'}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 font-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingPhone ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сканирование...
                </>
              ) : !isPhoneVerified ? (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Требуется подтверждение номера
                </>
              ) : user.plan === 'free' ? (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Требуется платный тариф
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Запустить проверку
                </>
              )}
            </Button>
            {phoneError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{phoneError}</p>
              </div>
            )}
            {phoneCheckResponse && (
              <div className={`mt-4 rounded-xl border ${
                phoneCheckResponse.totalLeaks > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-light text-gray-900">
                      {phoneCheckResponse.totalLeaks > 0
                        ? <><AlertTriangle className="inline h-4 w-4 mr-1 text-red-600" /> Найдено утечек: {phoneCheckResponse.totalLeaks}</>
                        : <><CheckCircle className="inline h-4 w-4 mr-1 text-green-600" /> Утечек не обнаружено</>
                      }
                    </p>
                    {phoneCheckResponse.totalLeaks > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPhoneDetails(!showPhoneDetails)}
                        className="text-gray-600 hover:text-gray-900 p-1 h-auto"
                      >
                        {showPhoneDetails ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {showPhoneDetails && phoneCheckResponse.totalLeaks > 0 && (
                    <div className="mt-3 space-y-2 border-t border-red-200 pt-3">
                      {phoneCheckResponse.results.map((result, index) => (
                        result.found && (
                          <div key={index} className="bg-white rounded-lg p-3 border border-red-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                  {result.source === 'Snusbase' ? (
                                    <Database className="h-3 w-3 text-red-600" />
                                  ) : result.source === 'DeHashed' ? (
                                    <Server className="h-3 w-3 text-red-600" />
                                  ) : (
                                    <Globe className="h-3 w-3 text-red-600" />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{result.source}</span>
                              </div>
                              <Badge variant="destructive" className="text-xs">
                                {result.count || 0} записей
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              Найдены записи с вашим номером телефона в базе данных {result.source}
                            </p>
                          </div>
                        )
                      ))}

                      {phoneCheckResponse.errors && phoneCheckResponse.errors.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800 font-medium mb-1">Предупреждения:</p>
                          {phoneCheckResponse.errors.map((error, index) => (
                            <p key={index} className="text-xs text-yellow-700">
                              {error.source}: {error.error}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-green-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-gray-900">Проверка email</h3>
                  <p className="text-xs text-gray-500 font-mono">{user.email}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Поиск компрометации email адреса в известных утечках
            </p>
            <Button
              onClick={handleCheckEmailLeaks}
              disabled={isCheckingEmail || (user.checksUsed >= user.checksLimit) || user.plan === 'free'}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 font-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сканирование...
                </>
              ) : user.plan === 'free' ? (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Требуется платный тариф
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Запустить проверку
                </>
              )}
            </Button>
            {emailError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{emailError}</p>
              </div>
            )}
            {emailCheckResponse && (
              <div className={`mt-4 rounded-xl border ${
                emailCheckResponse.totalLeaks > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-light text-gray-900">
                      {emailCheckResponse.totalLeaks > 0
                        ? <><AlertTriangle className="inline h-4 w-4 mr-1 text-red-600" /> Найдено утечек: {emailCheckResponse.totalLeaks}</>
                        : <><CheckCircle className="inline h-4 w-4 mr-1 text-green-600" /> Утечек не обнаружено</>
                      }
                    </p>
                    {emailCheckResponse.totalLeaks > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmailDetails(!showEmailDetails)}
                        className="text-gray-600 hover:text-gray-900 p-1 h-auto"
                      >
                        {showEmailDetails ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {showEmailDetails && emailCheckResponse.totalLeaks > 0 && (
                    <div className="mt-3 space-y-2 border-t border-red-200 pt-3">
                      {emailCheckResponse.results.map((result, index) => (
                        result.found && (
                          <div key={index} className="bg-white rounded-lg p-3 border border-red-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                  {result.source === 'Snusbase' ? (
                                    <Database className="h-3 w-3 text-red-600" />
                                  ) : result.source === 'DeHashed' ? (
                                    <Server className="h-3 w-3 text-red-600" />
                                  ) : (
                                    <Globe className="h-3 w-3 text-red-600" />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{result.source}</span>
                              </div>
                              <Badge variant="destructive" className="text-xs">
                                {result.count || 0} записей
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              Найдены записи с вашим email адресом в базе данных {result.source}
                            </p>
                          </div>
                        )
                      ))}

                      {emailCheckResponse.errors && emailCheckResponse.errors.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800 font-medium mb-1">Предупреждения:</p>
                          {emailCheckResponse.errors.map((error, index) => (
                            <p key={index} className="text-xs text-yellow-700">
                              {error.source}: {error.error}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Password Check Section */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-green-200 transition-all group mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-light text-gray-900">Проверка пароля</h3>
                <p className="text-xs text-gray-500">Проверка компрометации через DeHashed</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Проверьте, был ли ваш пароль скомпрометирован в известных утечках данных
          </p>
          <div className="flex space-x-3">
            <input
              type="password"
              placeholder="Введите пароль для проверки"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              id="password-input"
            />
            <Button
              onClick={() => {
                const input = document.getElementById('password-input') as HTMLInputElement
                if (input?.value) {
                  handleCheckPassword(input.value)
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 font-light"
            >
              <Shield className="h-4 w-4 mr-2" />
              Проверить
            </Button>
          </div>
        </div>

        {/* Promo Code Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-light text-gray-900 mb-2">Есть промокод?</h3>
            <p className="text-gray-600 text-sm">Введите промокод для получения скидки на тарифы</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Введите промокод"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCheckingPromo}
              />
              <Button 
                onClick={handlePromoCode}
                disabled={isCheckingPromo || !promoCode.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isCheckingPromo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Применить'
                )}
              </Button>
            </div>
            
            {promoMessage && (
              <div className={`mt-3 text-center text-sm ${
                promoDiscount > 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {promoMessage}
              </div>
            )}
            
            {promoDiscount > 0 && (
              <div className="mt-2 text-center">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Скидка {promoDiscount}% активирована
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Payment Plans */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-light text-gray-900 mb-2">
              {(user.checksUsed >= user.checksLimit) ? 'Лимит проверок исчерпан' : 'Доступные тарифы'}
            </h2>
            <p className="text-gray-600">
              {(user.checksUsed >= user.checksLimit) ? 'Выберите тариф для продолжения работы' : 'Увеличьте лимит проверок'}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-2">БАЗОВЫЙ</h3>
              <div className="mb-2">
                {promoDiscount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-gray-500 line-through">350₽</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Math.round(350 * (1 - promoDiscount / 100))}₽
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">350₽</p>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">1 проверка включена</p>
              <Button 
                onClick={() => {
                  if (!isAuthenticated) {
                    alert('Для покупки необходимо войти в аккаунт');
                    router.push('/login');
                    return;
                  }
                  const successUrl = encodeURIComponent('https://www.datatrace.tech/redirect?plan=basic');
                  window.location.href = `https://self.payanyway.ru/17573877087686?MNT_SUCCESS_URL=${successUrl}`;
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Оплатить
              </Button>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-4 relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">6 месяцев</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2 mt-2">ПРОФЕССИОНАЛЬНЫЙ</h3>
              <div className="mb-2">
                {promoDiscount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-gray-500 line-through">5 000₽</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Math.round(5000 * (1 - promoDiscount / 100))}₽
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">5 000₽</p>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">2 проверки + 6 месяцев мониторинга</p>
              <Button 
                onClick={() => {
                  if (!isAuthenticated) {
                    alert('Для покупки необходимо войти в аккаунт');
                    router.push('/login');
                    return;
                  }
                  const successUrl = encodeURIComponent('https://www.datatrace.tech/redirect?plan=professional');
                  window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}`;
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Оплатить
              </Button>
            </div>
            <div className="bg-white border border-purple-200 rounded-xl p-4 relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">12 месяцев</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2 mt-2">ПРОФЕССИОНАЛЬНЫЙ</h3>
              <div className="mb-2">
                {promoDiscount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-gray-500 line-through">8 500₽</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Math.round(8500 * (1 - promoDiscount / 100))}₽
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">8 500₽</p>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">2 проверки + 12 месяцев мониторинга</p>
              <Button 
                onClick={() => {
                  if (!isAuthenticated) {
                    alert('Для покупки необходимо войти в аккаунт');
                    router.push('/login');
                    return;
                  }
                  const successUrl = encodeURIComponent('https://www.datatrace.tech/redirect?plan=professional_12m');
                  window.location.href = `https://self.payanyway.ru/1757389094773?MNT_SUCCESS_URL=${successUrl}`;
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Оплатить
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-all text-left group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Shield className="h-5 w-5 text-gray-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-base font-light mb-2 text-gray-900">Мониторинг 24/7</h3>
            <p className="text-sm text-gray-500">
              Автоматическое отслеживание новых утечек
            </p>
          </button>

          <Link href="/dashboard/checks">
            <button className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-all text-left group w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <h3 className="text-base font-light mb-2 text-gray-900">Мои проверки</h3>
              <p className="text-sm text-gray-500">
                История проверок и результаты
              </p>
            </button>
          </Link>
        </div>

        {/* Activity Feed */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light text-gray-900">Активность системы</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              Все события
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-light text-gray-900">Система защиты активна</p>
                <p className="text-xs text-gray-500 mt-1">Все сервисы работают в штатном режиме</p>
              </div>
              <span className="text-xs text-gray-400">Сейчас</span>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-light text-gray-900">Мониторинг запущен</p>
                <p className="text-xs text-gray-500 mt-1">Отслеживание 15 источников данных</p>
              </div>
              <span className="text-xs text-gray-400">5 мин назад</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button
                variant="ghost"
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              >
                ← На главную
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              >
                Помощь
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно upgrade */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Проверки закончились!</h3>
              <p className="text-gray-600 mb-4">
                У вас закончились проверки на тарифе "{user.plan === 'free' ? 'БЕСПЛАТНЫЙ' : user.plan === 'basic' ? 'БАЗОВЫЙ' : user.plan?.toUpperCase() || 'БЕСПЛАТНЫЙ'}". 
                Обновите тариф для продолжения работы.
              </p>
            </div>
            
            {user.plan === 'basic' && (
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">ПРОФЕССИОНАЛЬНЫЙ (6 мес)</h4>
                    <span className="text-lg font-bold text-blue-600">5 000₽</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">2 проверки + 6 месяцев мониторинга</p>
                  <Button 
                    onClick={() => {
                      setShowUpgradeModal(false)
                      const successUrl = encodeURIComponent('https://www.datatrace.tech/redirect?plan=professional')
                      window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}`
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Обновить тариф
                  </Button>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">ПРОФЕССИОНАЛЬНЫЙ (12 мес)</h4>
                    <span className="text-lg font-bold text-purple-600">8 500₽</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">2 проверки + 12 месяцев мониторинга</p>
                  <Button 
                    onClick={() => {
                      setShowUpgradeModal(false)
                      const successUrl = encodeURIComponent('https://www.datatrace.tech/redirect?plan=professional_12m')
                      window.location.href = `https://self.payanyway.ru/1757389094773?MNT_SUCCESS_URL=${successUrl}`
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Обновить тариф
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button 
                onClick={() => setShowUpgradeModal(false)}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Отмена
              </Button>
              {user.plan !== 'basic' && (
                <Button 
                  onClick={() => {
                    setShowUpgradeModal(false)
                    const successUrl = encodeURIComponent('https://www.datatrace.tech/redirect?plan=basic')
                    window.location.href = `https://self.payanyway.ru/17573877087686?MNT_SUCCESS_URL=${successUrl}`
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Купить еще
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}