"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Database, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { API_ENDPOINTS, apiRequest } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import HCaptcha from '@hcaptcha/react-hcaptcha'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captcha = useRef<HCaptcha>(null)
  const { isAuthenticated, isLoading: isCheckingAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Если пользователь уже авторизован, перенаправляем в dashboard
    if (!isCheckingAuth && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isCheckingAuth, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Валидация
    if (formData.password !== formData.confirmPassword) {
      alert("Пароли не совпадают")
      setIsLoading(false)
      return
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert("Все поля обязательны для заполнения")
      setIsLoading(false)
      return
    }

    if (!agreedToTerms) {
      alert("Необходимо согласие на обработку персональных данных")
      setIsLoading(false)
      return
    }

    if (!captchaToken) {
      alert("Пожалуйста, подтвердите, что вы не робот")
      setIsLoading(false)
      return
    }

    // Валидация номера телефона (должен быть в формате +7XXXXXXXXXX)
    const normalizedPhone = normalizePhone(formData.phone)
    if (!normalizedPhone.match(/^\+7\d{10}$/)) {
      alert("Неверный формат номера телефона. Используйте формат: +79001234567")
      setIsLoading(false)
      return
    }
    
    try {
      const { response, data: result } = await apiRequest(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: normalizePhone(formData.phone),
          captchaToken
        })
      })

      if (result.ok) {
        // Не сохраняем данные пользователя до подтверждения email
        // localStorage.setItem("user", JSON.stringify({...}))
        // localStorage.setItem("access_token", result.session.access_token)
        // localStorage.setItem("refresh_token", result.session.refresh_token)

        alert(result.message || "Регистрация успешна! Проверьте email для подтверждения аккаунта.")
        // Перенаправляем на страницу входа для последующей авторизации
        router.push("/login")
      } else {
        alert(result.error?.message || "Ошибка регистрации")
        // Сбрасываем captcha при ошибке
        if (captcha.current) {
          captcha.current.resetCaptcha()
        }
        setCaptchaToken(null)
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert("Ошибка соединения с сервером")
      // Сбрасываем captcha при ошибке
      if (captcha.current) {
        captcha.current.resetCaptcha()
      }
      setCaptchaToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  const normalizePhone = (phone: string) => {
    // Удаляем все символы кроме цифр и +
    let cleaned = phone.replace(/[^\d+]/g, '')
    // Если начинается с 8, заменяем на +7
    if (cleaned.startsWith('8')) {
      cleaned = '+7' + cleaned.slice(1)
    }
    // Если начинается с 7 без +, добавляем +
    if (cleaned.startsWith('7') && !cleaned.startsWith('+7')) {
      cleaned = '+' + cleaned
    }
    // Если начинается с 9, добавляем +7
    if (cleaned.startsWith('9')) {
      cleaned = '+7' + cleaned
    }
    return cleaned
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'phone' ? normalizePhone(value) : value
    })
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
          <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Ваше имя"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Номер телефона</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+79001234567 или 89001234567"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  value={formData.password}
                  onChange={handleInputChange}
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Повторите пароль"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                Я согласен на{" "}
                <Link href="#" className="text-black hover:underline">
                  обработку персональных данных
                </Link>
              </label>
            </div>
            
            {/* hCaptcha */}
            <div className="flex justify-center">
              <HCaptcha
                ref={captcha}
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || ""}
                onVerify={(token) => {
                  setCaptchaToken(token)
                }}
                onExpire={() => {
                  setCaptchaToken(null)
                }}
                onError={() => {
                  setCaptchaToken(null)
                }}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-black text-white hover:bg-gray-800"
              disabled={isLoading || !agreedToTerms || !captchaToken}
            >
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-black hover:underline font-medium">
                Войти
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