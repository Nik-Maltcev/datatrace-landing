"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  Search,
  Shield,
  Users,
  Activity,
  Settings,
  LogOut,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  Loader2,
  ChevronRight,
  ChevronDown,
  User,
  Bell,
  Lock,
  Zap,
  ArrowRight,
  Clock,
  Server,
  RefreshCw,
  Globe
} from "lucide-react"

import Link from "next/link"
import { useRouter } from "next/navigation"

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
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [phoneLeaks, setPhoneLeaks] = useState<LeakResult[] | null>(null)
  const [emailLeaks, setEmailLeaks] = useState<LeakResult[] | null>(null)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [showPhoneDetails, setShowPhoneDetails] = useState(false)
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
  const handleLeakSearch = () => {
    router.push("/search")
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-light tracking-wide text-gray-900">DataTrace</span>
              <div className="h-4 w-px bg-gray-200 mx-2" />
              <span className="text-sm text-gray-500">Dashboard</span>
            </div>
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshData}
                  className="text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-full"
                  title="Обновить данные"
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 hover:bg-gray-50 rounded-full"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-extralight mb-2 text-gray-900">
            Добро пожаловать, <span className="font-normal">{user.name}</span>
          </h1>
          <p className="text-gray-500">Мониторинг и защита ваших персональных данных</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-700" />
              </div>
              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                {user.plan === 'professional' ? 'ПРОФЕССИОНАЛЬНЫЙ' : 
                 user.plan === 'basic' ? 'БАЗОВЫЙ' : 'БЕСПЛАТНЫЙ'}
              </span>
            </div>
            <p className="text-2xl font-light mb-1 text-gray-900">{user.checksUsed ?? 0}/{user.checksLimit ?? 0}</p>
            <p className="text-sm text-gray-600">Проверок использовано</p>
            
            {/* Debug info - временно для диагностики */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                DEBUG: checksUsed={user.checksUsed}, checksLimit={user.checksLimit}, plan={user.plan}
              </div>
            )}
            
            <div className="mt-3 bg-white bg-opacity-50 rounded-lg p-2">
              <p className="text-xs text-blue-700 font-medium">
                Тариф: {user.plan === 'professional' ? 'ПРОФЕССИОНАЛЬНЫЙ' : user.plan === 'basic' ? 'БАЗОВЫЙ' : 'БЕСПЛАТНЫЙ'}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-xs text-gray-500">Активно</span>
            </div>
            <p className="text-2xl font-light mb-1 text-gray-900">12</p>
            <p className="text-sm text-gray-500">Защищенных данных</p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-xs text-red-600">Внимание</span>
            </div>
            <p className="text-2xl font-light mb-1 text-gray-900">3</p>
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
            <p className="text-sm text-gray-500">Удалено записей</p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-xs text-gray-500">24/7</span>
            </div>
            <p className="text-2xl font-light mb-1 text-gray-900">15</p>
            <p className="text-sm text-gray-500">Источников мониторинга</p>
          </div>
        </div>

        {/* Plan Info Section */}
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
              disabled={isCheckingPhone || !user.phone || (user.checksUsed >= user.checksLimit)}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 font-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingPhone ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сканирование...
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
              disabled={isCheckingEmail || (user.checksUsed >= user.checksLimit)}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 font-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сканирование...
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
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-2">БАЗОВЫЙ</h3>
              <p className="text-2xl font-bold text-gray-900 mb-2">500₽</p>
              <p className="text-sm text-gray-600 mb-4">1 проверка включена</p>
              <Button 
                onClick={() => {
                  if (!isAuthenticated) {
                    alert('Для покупки необходимо войти в аккаунт');
                    router.push('/login');
                    return;
                  }
                  const successUrl = encodeURIComponent('https://datatrace-landing-production-6a5e.up.railway.app/redirect?plan=basic');
                  window.location.href = `https://self.payanyway.ru/17573877087686?MNT_SUCCESS_URL=${successUrl}`;
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Оплатить
              </Button>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-2">ПРОФЕССИОНАЛЬНЫЙ</h3>
              <p className="text-2xl font-bold text-gray-900 mb-2">8 500₽</p>
              <p className="text-sm text-gray-600 mb-4">2 проверки включены</p>
              <Button 
                onClick={() => {
                  if (!isAuthenticated) {
                    alert('Для покупки необходимо войти в аккаунт');
                    router.push('/login');
                    return;
                  }
                  const successUrl = encodeURIComponent('https://datatrace-landing-production-6a5e.up.railway.app/redirect?plan=professional');
                  window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}`;
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Оплатить
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleLeakSearch}
            className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Search className="h-5 w-5 text-gray-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-base font-light mb-2 text-gray-900">Расширенный поиск</h3>
            <p className="text-sm text-gray-500">
              Глубокое сканирование по всем параметрам
            </p>
          </button>

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
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">ПРОФЕССИОНАЛЬНЫЙ</h4>
                  <span className="text-lg font-bold text-blue-600">8 500₽</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">2 проверки включены</p>
                <Button 
                  onClick={() => {
                    setShowUpgradeModal(false)
                    const successUrl = encodeURIComponent('https://datatrace-landing-production-6a5e.up.railway.app/redirect?plan=professional')
                    window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}`
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Обновить тариф
                </Button>
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
                    const successUrl = encodeURIComponent('https://datatrace-landing-production-6a5e.up.railway.app/redirect?plan=basic')
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