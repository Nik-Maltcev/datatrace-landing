"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Zap
} from "lucide-react"
import Link from "next/link"

interface LeakResult {
  name: string
  source?: string
  found: boolean
  count?: number
  ok?: boolean
  error?: any
}

interface CheckResponse {
  ok?: boolean
  phone?: string
  email?: string
  totalLeaks?: number
  foundSources?: number
  results?: LeakResult[]
  message?: string
  found?: boolean
  error?: string
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [phoneResult, setPhoneResult] = useState<CheckResponse | null>(null)
  const [emailResult, setEmailResult] = useState<CheckResponse | null>(null)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  useEffect(() => {
    if (user?.phone) {
      // Check if phone is verified
      setIsPhoneVerified(user.phoneVerified || false)
    }
  }, [user])

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

  const handleCheckPhoneLeaks = async () => {
    console.log('🚀 Starting phone check for user:', user)

    // Проверяем верификацию телефона
    if (!isPhoneVerified) {
      setPhoneResult({ error: "Сначала подтвердите ваш номер телефона" })
      return
    }

    if (!user?.phone) {
      setPhoneResult({ error: "Номер телефона не указан в профиле" })
      return
    }

    // Проверяем лимит проверок
    if (user.checksUsed >= user.checksLimit) {
      alert('Лимит проверок исчерпан. Обновите тариф для продолжения работы.')
      return
    }

    console.log('📱 Checking phone:', user.phone)

    setIsCheckingPhone(true)
    setPhoneResult(null)

    try {
      // Используем правильный API endpoint
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

      // Преобразуем результаты для отображения
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

      setPhoneResult({
        ok: data.ok,
        phone: data.phone,
        totalLeaks: data.totalLeaks,
        foundSources: data.foundSources,
        results: transformedResults,
        message: data.message,
        found: data.totalLeaks > 0
      })

      // Обновляем счетчик проверок в localStorage
      if (user) {
        const updatedUser = { ...user, checksUsed: (user.checksUsed || 0) + 1 }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

    } catch (error) {
      console.error("Phone check error:", error)
      setPhoneResult({ error: error instanceof Error ? error.message : "Не удалось проверить утечки по номеру телефона" })
    } finally {
      setIsCheckingPhone(false)
    }
  }

  const handleCheckEmailLeaks = async () => {
    console.log('🚀 Starting email check for user:', user)

    if (!user?.email) {
      setEmailResult({ error: "Email не указан в профиле" })
      return
    }

    // Проверяем лимит проверок
    if (user.checksUsed >= user.checksLimit) {
      alert('Лимит проверок исчерпан. Обновите тариф для продолжения работы.')
      return
    }

    console.log('📧 Checking email:', user.email)

    setIsCheckingEmail(true)
    setEmailResult(null)

    try {
      // Используем правильный API endpoint
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

      // Преобразуем результаты для отображения
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

      setEmailResult({
        ok: data.ok,
        email: data.email,
        totalLeaks: data.totalLeaks,
        foundSources: data.foundSources,
        results: transformedResults,
        message: data.message,
        found: data.totalLeaks > 0
      })

      // Обновляем счетчик проверок в localStorage
      if (user) {
        const updatedUser = { ...user, checksUsed: (user.checksUsed || 0) + 1 }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

    } catch (error) {
      console.error("Email check error:", error)
      setEmailResult({ error: error instanceof Error ? error.message : "Не удалось проверить утечки по email" })
    } finally {
      setIsCheckingEmail(false)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Проверить телефон</CardTitle>
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
              disabled={!user.phone || isCheckingPhone || !isPhoneVerified || (user.checksUsed >= user.checksLimit)}
              className="w-full"
            >
              {isCheckingPhone ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверяю...
                </>
              ) : !isPhoneVerified ? (
                <>
                  Требуется подтверждение номера
                  <Shield className="h-4 w-4 ml-2" />
                </>
              ) : (user.checksUsed >= user.checksLimit) ? (
                <>
                  Лимит проверок исчерпан
                  <AlertTriangle className="h-4 w-4 ml-2" />
                </>
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
                            Найдено утечек: {phoneResult.totalLeaks}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="inline h-4 w-4 mr-1 text-green-600" />
                            Утечек не обнаружено
                          </>
                        )}
                      </p>
                    </div>
                    {phoneResult.found && phoneResult.results && (
                      <div className="mt-3 space-y-2">
                        {phoneResult.results.filter(r => r.found).map((result, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{result.source}</span>
                              <Badge variant="destructive" className="text-xs">
                                {result.count} записей
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Найдены записи с вашим номером телефона
                            </p>
                          </div>
                        ))}
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
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Проверить Email</CardTitle>
                <p className="text-sm text-gray-500">Поиск утечек email адреса</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Проверить {user.email}
            </p>
            <Button 
              onClick={handleCheckEmailLeaks}
              disabled={isCheckingEmail || (user.checksUsed >= user.checksLimit)}
              className="w-full"
              variant="outline"
            >
              {isCheckingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверяю...
                </>
              ) : (user.checksUsed >= user.checksLimit) ? (
                <>
                  Лимит проверок исчерпан
                  <AlertTriangle className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Проверить email
                  <Mail className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            {emailResult && (
              <div className={`mt-3 p-4 rounded-lg border ${
                emailResult.error ? 'bg-red-50 border-red-200' :
                emailResult.found ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              }`}>
                {emailResult.error ? (
                  <p className="text-sm text-red-600">{emailResult.error}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">
                        {emailResult.found ? (
                          <>
                            <AlertTriangle className="inline h-4 w-4 mr-1 text-red-600" />
                            Найдено утечек: {emailResult.totalLeaks}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="inline h-4 w-4 mr-1 text-green-600" />
                            Утечек не обнаружено
                          </>
                        )}
                      </p>
                    </div>
                    {emailResult.found && emailResult.results && (
                      <div className="mt-3 space-y-2">
                        {emailResult.results.filter(r => r.found).map((result, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{result.source}</span>
                              <Badge variant="destructive" className="text-xs">
                                {result.count} записей
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Найдены записи с вашим email адресом
                            </p>
                          </div>
                        ))}
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
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">История проверок</CardTitle>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Защита данных</CardTitle>
                <p className="text-sm text-gray-500">Безопасность и конфиденциальность</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Управляйте настройками безопасности и защитой персональных данных
            </p>
            <Button variant="outline" className="w-full" disabled>
              Скоро доступно
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
            <PhoneVerification />
          </CardContent>
        </Card>
      )}
    </div>
  )
}