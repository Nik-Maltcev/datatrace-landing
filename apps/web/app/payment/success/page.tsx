"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Database, Loader2, Zap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

type PaymentStatus = "loading" | "success" | "error"

export default function PaymentSuccessPage() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<PaymentStatus>("loading")
  const [message, setMessage] = useState("Обрабатываем ваш платеж...")

  const clearPendingPaymentFlag = () => {
    try {
      localStorage.removeItem("pending_payment")
    } catch (error) {
      console.error("Unable to clear pending payment flag:", error)
    }
  }

  useEffect(() => {
    let isCancelled = false

    const handleSuccessfulPayment = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const plan = urlParams.get("plan") || "basic"

        // Даём вебхуку немного времени, чтобы применить изменения
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const emailFromUrl = urlParams.get("email")
        let userEmail = emailFromUrl

        if (!userEmail) {
          const userDataString = localStorage.getItem("user")
          if (userDataString) {
            try {
              const userData = JSON.parse(userDataString)
              userEmail = userData.email
            } catch (error) {
              console.error("Error parsing stored user data:", error)
            }
          }
        }

        if (!userEmail) {
          if (!isCancelled) {
            clearPendingPaymentFlag()
            setStatus("success")
            setMessage("Платеж обработан! Обновите дашборд, чтобы увидеть новый тариф.")
            setIsLoading(false)
          }
          return
        }

        const response = await fetch(`/api/user-profile?email=${encodeURIComponent(userEmail)}`)
        const data = await response.json()

        if (isCancelled) {
          return
        }

        if (data.ok && data.profile) {
          const updatedUser = {
            id: data.profile.id,
            email: data.profile.email,
            name: data.profile.name,
            phone: data.profile.phone,
            isAuthenticated: true,
            plan: data.profile.plan,
            rawPlan: data.profile.rawPlan,
            checksUsed: data.profile.checksUsed ?? data.profile.checks_used ?? 0,
            checksLimit: data.profile.checksLimit ?? data.profile.checks_limit ?? 0,
          }

          login(updatedUser, "temp_token", "")
          localStorage.setItem("user", JSON.stringify(updatedUser))

          // Сообщаем другим вкладкам, что тариф обновился
          localStorage.setItem("refresh_user_data", "true")
          setTimeout(() => {
            localStorage.removeItem("refresh_user_data")
          }, 1000)

          // Сигнализируем открывшему окно родителю
          if (window.opener) {
            window.opener.postMessage({
              type: "PAYMENT_SUCCESS",
              user: updatedUser,
            }, "*")
          }

          // Сигнализируем встраивающему фрейму (если есть)
          if (window.parent !== window) {
            window.parent.postMessage({
              type: "PAYMENT_SUCCESS",
              user: updatedUser,
            }, "*")
          }

          clearPendingPaymentFlag()
          setStatus("success")
          setMessage("Платеж успешно обработан! Ваш тариф обновлен.")
          setIsLoading(false)
        } else {
          clearPendingPaymentFlag()
          setStatus("success")
          setMessage("Платеж обработан! Обновите дашборд, чтобы увидеть новый тариф.")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error in payment success handler:", error)
        clearPendingPaymentFlag()
        setStatus("success")
        setMessage("Платеж обработан! Обновите дашборд, чтобы увидеть новый тариф.")
        setIsLoading(false)
      }
    }

    handleSuccessfulPayment()

    return () => {
      isCancelled = true
    }
  }, [login])

  const renderStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
    }

    if (status === "success") {
      return <CheckCircle className="h-16 w-16 text-green-600" />
    }

    return <div className="h-16 w-16 text-red-600">❌</div>
  }

  const renderTitle = () => {
    if (isLoading) {
      return "Обработка платежа..."
    }

    if (status === "success") {
      return "Оплата успешна!"
    }

    return "Ошибка платежа"
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Database className="h-8 w-8 text-black" />
            <span className="text-2xl font-bold text-black">DataTrace</span>
          </div>
          <div className="flex justify-center">
            {renderStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {renderTitle()}
          </CardTitle>
          <p className="text-gray-600">
            {message}
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isLoading ? (
            <p className="text-sm text-gray-500">Это может занять несколько секунд. Не закрывайте вкладку.</p>
          ) : (
            <div className="space-y-3">
              <Link href="/dashboard">
                <Button className="w-full bg-black text-white hover:bg-gray-800">
                  <Zap className="h-4 w-4 mr-2" />
                  Перейти в личный кабинет
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  На главную
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
