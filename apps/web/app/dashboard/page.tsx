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
  Loader2
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
    return <div>Загрузка...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">DataTrace</span>
              <Badge variant="secondary" className="ml-2">Личный кабинет</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Добро пожаловать, {user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Панель управления</h1>
          <p className="text-gray-600">Управляйте своими данными и мониторингом утечек</p>
        </div>

        {/* User Info Card */}
        <Card className="mb-8 border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Ваши данные для проверки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-black">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Телефон</p>
                    <p className="font-medium text-black">{user.phone || "Не указан"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Check Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-6 w-6 text-blue-600" />
                <span>Проверить номер телефона</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Проверить утечки по вашему номеру телефона: {user.phone || "не указан"}
              </p>
              <Button 
                onClick={handleCheckPhoneLeaks}
                disabled={isCheckingPhone || !user.phone}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCheckingPhone ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Проверяем...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Проверить телефон
                  </>
                )}
              </Button>
              {phoneError && (
                <p className="mt-2 text-sm text-red-600">{phoneError}</p>
              )}
              {phoneLeaks && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium">
                    {phoneLeaks.length > 0 
                      ? `Найдено утечек: ${phoneLeaks.length}` 
                      : "Утечек не найдено ✓"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-6 w-6 text-green-600" />
                <span>Проверить email</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Проверить утечки по вашему email: {user.email}
              </p>
              <Button 
                onClick={handleCheckEmailLeaks}
                disabled={isCheckingEmail}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isCheckingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Проверяем...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Проверить email
                  </>
                )}
              </Button>
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
              )}
              {emailLeaks && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium">
                    {emailLeaks.length > 0 
                      ? `Найдено утечек: ${emailLeaks.length}` 
                      : "Утечек не найдено ✓"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Other Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-6 w-6 text-purple-600" />
                <span>Расширенный поиск</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Поиск утечек по любым данным с расширенными параметрами
              </p>
              <Button 
                onClick={handleLeakSearch}
                variant="outline"
                className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть поиск
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 hover:border-yellow-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-yellow-600" />
                <span>Мониторинг</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Настройте постоянный мониторинг ваших данных
              </p>
              <Button 
                variant="outline"
                className="w-full border-yellow-600 text-yellow-600 hover:bg-yellow-50"
              >
                Настроить мониторинг
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-indigo-600" />
                <span>Корпоративный доступ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Управляйте данными сотрудников
              </p>
              <Button 
                variant="outline"
                className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                Подключить команду
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-black">Система активна</p>
                    <p className="text-sm text-gray-600">Готова к проверке ваших данных</p>
                  </div>
                </div>
                <Badge variant="secondary">Активно</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
              Вернуться на главную
            </Button>
          </Link>
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </Button>
        </div>
      </div>
    </div>
  )
}