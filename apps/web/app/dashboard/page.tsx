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
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [phoneResult, setPhoneResult] = useState<any>(null)
  const [emailResult, setEmailResult] = useState<any>(null)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [expandedPhoneSources, setExpandedPhoneSources] = useState<Set<string>>(new Set())
  const [expandedEmailSources, setExpandedEmailSources] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user?.phone) {
      // Check if phone is verified
      setIsPhoneVerified(false)  // Заглушка - проверка через PhoneVerification компонент
    }
  }, [user])

  const togglePhoneSource = (sourceName: string) => {
    setExpandedPhoneSources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sourceName)) {
        newSet.delete(sourceName)
      } else {
        newSet.add(sourceName)
      }
      return newSet
    })
  }

  const toggleEmailSource = (sourceName: string) => {
    setExpandedEmailSources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sourceName)) {
        newSet.delete(sourceName)
      } else {
        newSet.add(sourceName)
      }
      return newSet
    })
  }

  const handleCheckPhoneLeaks = async () => {
    if (!user?.phone || isCheckingPhone) return
    
    setIsCheckingPhone(true)
    try {
      const response = await fetch('/api/leaks/check-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: user.phone }),
      })
      const data = await response.json()
      setPhoneResult(data)
    } catch (error) {
      console.error('Phone check error:', error)
    }
    setIsCheckingPhone(false)
  }

  const handleCheckEmailLeaks = async () => {
    if (!user?.email || isCheckingEmail) return
    
    setIsCheckingEmail(true)
    try {
      const response = await fetch('/api/leaks/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })
      const data = await response.json()
      setEmailResult(data)
    } catch (error) {
      console.error('Email check error:', error)
    }
    setIsCheckingEmail(false)
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
              disabled={!user.phone || isCheckingPhone}
              className="w-full"
            >
              {isCheckingPhone ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверяю...
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
                          const isExpanded = expandedPhoneSources.has(sourceName)
                          
                          return (
                            <div key={idx} className="bg-white rounded-lg border border-red-200">
                              <div 
                                className="p-3 cursor-pointer hover:bg-red-50 transition-colors"
                                onClick={() => togglePhoneSource(sourceName)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                      <AlertTriangle className="h-3 w-3 text-red-600" />
                                    </div>
                                    <span className="font-medium text-sm">{sourceName}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="destructive" className="text-xs">
                                      {result.count || 0} записей
                                    </Badge>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <div className="border-t border-red-200 p-3 bg-red-25">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                                    Детали утечки:
                                  </h4>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <p>• Источник: {sourceName}</p>
                                    <p>• Количество записей: {result.count || 0}</p>
                                    
                                    {/* Отображаем нормализованные данные */}
                                    {result.items && result.items.length > 0 && (
                                      <div className="mt-3 space-y-2">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Найденная информация:</p>
                                        {result.items.slice(0, 3).map((item: any, itemIdx: number) => (
                                          <div key={itemIdx} className="bg-gray-50 p-2 rounded text-xs">
                                            {Object.entries(item)
                                              .filter(([key, value]) => 
                                                value && key !== 'id' && key !== 'user_id' && 
                                                String(value).length > 0 && String(value) !== 'null'
                                              )
                                              .slice(0, 5)
                                              .map(([key, value]) => (
                                                <div key={key} className="flex justify-between py-1">
                                                  <span className="font-medium text-gray-600">{key}:</span>
                                                  <span className="text-gray-800">{String(value)}</span>
                                                </div>
                                              ))
                                            }
                                          </div>
                                        ))}
                                        {result.items.length > 3 && (
                                          <p className="text-xs text-gray-500">
                                            ... и ещё {result.items.length - 3} записей
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    
                                    <p>• Рекомендуется сменить пароли для аккаунтов, связанных с этим номером</p>
                                  </div>
                                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-xs text-yellow-800">
                                      ⚠️ Для получения подробной информации об утечке обратитесь в службу поддержки
                                    </p>
                                  </div>
                                </div>
                              )}
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
              disabled={isCheckingEmail}
              className="w-full"
              variant="outline"
            >
              {isCheckingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверяю...
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
                            Найдено утечек: {emailResult.totalLeaks || 0}
                          </>
                        ) : (
                          "Данные в безопасности"
                        )}
                      </p>
                    </div>
                    {emailResult.found && emailResult.results && (
                      <div className="mt-3 space-y-2">
                        {emailResult.results.filter((r: any) => r.found).map((result: any, idx: number) => {
                          const sourceName = result.source || result.name
                          const isExpanded = expandedEmailSources.has(sourceName)
                          
                          return (
                            <div key={idx} className="bg-white rounded-lg border border-red-200">
                              <div 
                                className="p-3 cursor-pointer hover:bg-red-50 transition-colors"
                                onClick={() => toggleEmailSource(sourceName)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                      <AlertTriangle className="h-3 w-3 text-red-600" />
                                    </div>
                                    <span className="font-medium text-sm">{sourceName}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="destructive" className="text-xs">
                                      {result.count || 0} записей
                                    </Badge>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <div className="border-t border-red-200 p-3 bg-red-25">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                                    Детали утечки:
                                  </h4>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <p>• Источник: {sourceName}</p>
                                    <p>• Количество записей: {result.count || 0}</p>
                                    
                                    {/* Отображаем нормализованные данные */}
                                    {result.items && result.items.length > 0 && (
                                      <div className="mt-3 space-y-2">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Найденная информация:</p>
                                        {result.items.slice(0, 3).map((item: any, itemIdx: number) => (
                                          <div key={itemIdx} className="bg-gray-50 p-2 rounded text-xs">
                                            {Object.entries(item)
                                              .filter(([key, value]) => 
                                                value && key !== 'id' && key !== 'user_id' && 
                                                String(value).length > 0 && String(value) !== 'null'
                                              )
                                              .slice(0, 5)
                                              .map(([key, value]) => (
                                                <div key={key} className="flex justify-between py-1">
                                                  <span className="font-medium text-gray-600">{key}:</span>
                                                  <span className="text-gray-800">{String(value)}</span>
                                                </div>
                                              ))
                                            }
                                          </div>
                                        ))}
                                        {result.items.length > 3 && (
                                          <p className="text-xs text-gray-500">
                                            ... и ещё {result.items.length - 3} записей
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    
                                    <p>• Рекомендуется сменить пароли для аккаунтов с этим email</p>
                                  </div>
                                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-xs text-yellow-800">
                                      ⚠️ Для получения подробной информации об утечке обратитесь в службу поддержки
                                    </p>
                                  </div>
                                </div>
                              )}
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
            <PhoneVerification 
              onVerified={(token: string) => setIsPhoneVerified(true)}
              isVerified={isPhoneVerified}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}