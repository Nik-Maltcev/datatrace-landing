"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Database, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { API_ENDPOINTS, apiRequest } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, isLoading: isCheckingAuth, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Если пользователь уже авторизован, перенаправляем в dashboard
    if (!isCheckingAuth && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isCheckingAuth, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Валидация
    if (!email.trim() || !password.trim()) {
      alert("Email и пароль обязательны для заполнения")
      setIsLoading(false)
      return
    }
    
    try {
      const { response, data: result } = await apiRequest(API_ENDPOINTS.AUTH.SIGNIN, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      })

      if (result.ok) {
        // Используем хук для сохранения данных авторизации
        const userData = {
          id: result.user?.id,
          email: result.user?.email,
          name: result.user?.user_metadata?.name || result.user?.email?.split("@")[0],
          phone: result.user?.user_metadata?.phone,
          isAuthenticated: true,
          plan: 'basic' as const,
          checksUsed: 0,
          checksLimit: 1
        }
        
        login(
          userData,
          result.session?.access_token || '',
          result.session?.refresh_token
        )

        alert(result.message || "Вход выполнен успешно!")
        router.push("/dashboard")
      } else {
        alert(result.error?.message || "Ошибка входа")
      }
    } catch (error) {
      console.error('Login error:', error)
      alert("Ошибка соединения с сервером")
    } finally {
      setIsLoading(false)
    }
  }

  // Показываем загрузку пока проверяем авторизацию
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Database className="h-8 w-8 text-black" />
            <span className="text-xl font-bold text-black">DataTrace</span>
          </div>
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Database className="h-8 w-8 text-black" />
            <span className="text-xl font-bold text-black">DataTrace</span>
          </div>
          <CardTitle className="text-2xl font-bold">Вход в систему</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-black text-white hover:bg-gray-800"
              disabled={isLoading}
            >
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-black hover:underline font-medium">
                Зарегистрироваться
              </Link>
            </p>
          </div>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-black">
              ← Вернуться на главную
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}