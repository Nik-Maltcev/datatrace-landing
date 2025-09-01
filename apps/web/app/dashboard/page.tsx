"use client"

import { useEffect, useState } from "react"
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
  const [user, setUser] = useState<User | null>(null)
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
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleCheckPhoneLeaks = async () => {
    if (!user?.phone) {
      setPhoneError("Номер телефона не указан в профиле")
      return
    }

    setIsCheckingPhone(true)
    setPhoneError(null)
    setPhoneLeaks(null)
    setPhoneCheckResponse(null)

    try {
      const response = await fetch("/api/leaks/check-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: user.phone }),
      })

      if (!response.ok) {
        throw new Error("Ошибка при проверке телефона")
      }

      const data = await response.json()
      setPhoneLeaks(data.results || [])
      setPhoneCheckResponse(data)
      if (data.totalLeaks > 0) {
        setShowPhoneDetails(true)
      }
    } catch (error) {
      console.error("Phone check error:", error)
      setPhoneError("Не удалось проверить утечки по номеру телефона")
    } finally {
      setIsCheckingPhone(false)
    }
  }

  const handleCheckEmailLeaks = async () => {
    if (!user?.email) {
      setEmailError("Email не указан в профиле")
      return
    }

    setIsCheckingEmail(true)
    setEmailError(null)
    setEmailLeaks(null)

    try {
      const response = await fetch("/api/leaks/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      })

      if (!response.ok) {
        throw new Error("Ошибка при проверке email")
      }

      const data = await response.json()
      setEmailLeaks(data.results || [])
      setEmailCheckResponse(data)
      if (data.totalLeaks > 0) {
        setShowEmailDetails(true)
      }
    } catch (error) {
      console.error("Email check error:", error)
      setEmailError("Не удалось проверить утечки по email")
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleLeakSearch = () => {
    router.push("/search")
  }

  if (!user) {
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
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
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
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-red-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <Phone className="h-6 w-6 text-red-600" />
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
              disabled={isCheckingPhone || !user.phone}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 font-light disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-red-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <Mail className="h-6 w-6 text-red-600" />
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
              disabled={isCheckingEmail}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 font-light disabled:opacity-50 disabled:cursor-not-allowed"
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
            {emailLeaks && (
              <div className={`mt-4 p-3 rounded-xl border ${
                emailLeaks.length > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <p className="text-sm font-light text-gray-900">
                  {emailLeaks.length > 0
                    ? <><AlertTriangle className="inline h-4 w-4 mr-1 text-red-600" /> Найдено утечек: {emailLeaks.length}</>
                    : <><CheckCircle className="inline h-4 w-4 mr-1 text-green-600" /> Утечек не обнаружено</>}
                </p>
              </div>
            )}
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
    </div>
  )
}