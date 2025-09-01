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
  User,
  Bell,
  Lock,
  Zap,
  ArrowRight
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
  source: string
  data: any
  found: boolean
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [phoneLeaks, setPhoneLeaks] = useState<LeakResult[] | null>(null)
  const [emailLeaks, setEmailLeaks] = useState<LeakResult[] | null>(null)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-light tracking-wide">DataTrace</span>
              <div className="h-4 w-px bg-zinc-700 mx-2" />
              <span className="text-sm text-zinc-400">Dashboard</span>
            </div>
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <div className="h-6 w-px bg-zinc-800" />
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded-full"
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
          <h1 className="text-4xl font-extralight mb-2">
            Добро пожаловать, <span className="font-normal">{user.name}</span>
          </h1>
          <p className="text-zinc-400">Мониторинг и защита ваших персональных данных</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-zinc-400" />
              </div>
              <span className="text-xs text-zinc-500">Активно</span>
            </div>
            <p className="text-2xl font-light mb-1">12</p>
            <p className="text-sm text-zinc-500">Защищенных данных</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-red-600/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-xs text-red-500">Внимание</span>
            </div>
            <p className="text-2xl font-light mb-1">3</p>
            <p className="text-sm text-zinc-500">Найдено утечек</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-600/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs text-green-500">Успешно</span>
            </div>
            <p className="text-2xl font-light mb-1">5</p>
            <p className="text-sm text-zinc-500">Удалено записей</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-zinc-400" />
              </div>
              <span className="text-xs text-zinc-500">24/7</span>
            </div>
            <p className="text-2xl font-light mb-1">15</p>
            <p className="text-sm text-zinc-500">Источников мониторинга</p>
          </div>
        </div>

        {/* User Data Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light">Ваши защищенные данные</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <Lock className="h-4 w-4 mr-2" />
              Изменить
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-black border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Email адрес</p>
                    <p className="font-mono text-sm">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-black border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Номер телефона</p>
                    <p className="font-mono text-sm">{user.phone || "Не указан"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-red-600/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-600/10 rounded-full flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                  <Phone className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light">Проверка телефона</h3>
                  <p className="text-xs text-zinc-500 font-mono">{user.phone || "Не указан"}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
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
              <div className="mt-4 p-3 bg-red-600/10 border border-red-600/20 rounded-xl">
                <p className="text-sm text-red-400">{phoneError}</p>
              </div>
            )}
            {phoneLeaks && (
              <div className={`mt-4 p-3 rounded-xl border ${
                phoneLeaks.length > 0
                  ? 'bg-red-600/10 border-red-600/20'
                  : 'bg-green-600/10 border-green-600/20'
              }`}>
                <p className="text-sm font-light">
                  {phoneLeaks.length > 0
                    ? <><AlertTriangle className="inline h-4 w-4 mr-1 text-red-500" /> Найдено утечек: {phoneLeaks.length}</>
                    : <><CheckCircle className="inline h-4 w-4 mr-1 text-green-500" /> Утечек не обнаружено</>}
                </p>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-red-600/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-600/10 rounded-full flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                  <Mail className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light">Проверка email</h3>
                  <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
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
              <div className="mt-4 p-3 bg-red-600/10 border border-red-600/20 rounded-xl">
                <p className="text-sm text-red-400">{emailError}</p>
              </div>
            )}
            {emailLeaks && (
              <div className={`mt-4 p-3 rounded-xl border ${
                emailLeaks.length > 0
                  ? 'bg-red-600/10 border-red-600/20'
                  : 'bg-green-600/10 border-green-600/20'
              }`}>
                <p className="text-sm font-light">
                  {emailLeaks.length > 0
                    ? <><AlertTriangle className="inline h-4 w-4 mr-1 text-red-500" /> Найдено утечек: {emailLeaks.length}</>
                    : <><CheckCircle className="inline h-4 w-4 mr-1 text-green-500" /> Утечек не обнаружено</>}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleLeakSearch}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                <Search className="h-5 w-5 text-zinc-400" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
            <h3 className="text-base font-light mb-2">Расширенный поиск</h3>
            <p className="text-sm text-zinc-500">
              Глубокое сканирование по всем параметрам
            </p>
          </button>

          <button className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all text-left group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                <Shield className="h-5 w-5 text-zinc-400" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
            <h3 className="text-base font-light mb-2">Мониторинг 24/7</h3>
            <p className="text-sm text-zinc-500">
              Автоматическое отслеживание новых утечек
            </p>
          </button>

          <button className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all text-left group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                <Users className="h-5 w-5 text-zinc-400" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
            <h3 className="text-base font-light mb-2">Для команд</h3>
            <p className="text-sm text-zinc-500">
              Корпоративная защита данных
            </p>
          </button>
        </div>

        {/* Activity Feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light">Активность системы</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Все события
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-black rounded-xl border border-zinc-800">
              <div className="w-8 h-8 bg-green-600/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-light">Система защиты активна</p>
                <p className="text-xs text-zinc-500 mt-1">Все сервисы работают в штатном режиме</p>
              </div>
              <span className="text-xs text-zinc-600">Сейчас</span>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-black rounded-xl border border-zinc-800">
              <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-light">Мониторинг запущен</p>
                <p className="text-xs text-zinc-500 mt-1">Отслеживание 15 источников данных</p>
              </div>
              <span className="text-xs text-zinc-600">5 мин назад</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-10 pt-8 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button
                variant="ghost"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                ← На главную
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Помощь
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
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