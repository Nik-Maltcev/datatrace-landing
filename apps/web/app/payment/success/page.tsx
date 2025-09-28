"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Database, Loader2, Zap } from "lucide-react"
import Link from "next/link"

type PaymentStatus = "loading" | "success" | "error"

export default function PaymentSuccessPage() {
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
    let timeoutId: NodeJS.Timeout

    const handleSuccessfulPayment = async () => {
      try {
        console.log("Payment success page loaded")
        const urlParams = new URLSearchParams(window.location.search)
        const plan = urlParams.get("plan") || "basic"
        console.log("Plan from URL:", plan)

        // Даём вебхуку немного времени, чтобы применить изменения
        await new Promise((resolve) => setTimeout(resolve, 1500))

        if (isCancelled) return

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

        console.log("User email for profile fetch:", userEmail)

        if (!userEmail) {
          console.log("No user email found, redirecting to dashboard with plan")
          if (!isCancelled) {
            clearPendingPaymentFlag()
            setStatus("success")
            setMessage("Платеж успешно обработан! Открываем личный кабинет...")
            setIsLoading(false)
            
            // Открываем личный кабинет в новом окне
            setTimeout(() => {
              window.open('/dashboard', '_blank')
            }, 1000)
          }
          return
        }

        const response = await fetch(`/api/user-profile?email=${encodeURIComponent(userEmail)}`)
        const data = await response.json()
        console.log("Profile API response:", data)

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

          console.log("Updated user data:", updatedUser)
          localStorage.setItem("user", JSON.stringify(updatedUser))
          localStorage.setItem("access_token", "temp_token")

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
          setMessage("Платеж успешно обработан! Открываем личный кабинет...")
          setIsLoading(false)
          
          // Открываем личный кабинет в новом окне
          setTimeout(() => {
            window.open('/dashboard', '_blank')
          }, 1000)
        } else {
          console.log("Profile not found or API error, showing fallback success")
          clearPendingPaymentFlag()
          setStatus("success")
          setMessage("Платеж обработан! Открываем личный кабинет...")
          setIsLoading(false)
          
          // Открываем личный кабинет в новом окне
          setTimeout(() => {
            window.open('/dashboard', '_blank')
          }, 1000)
        }
      } catch (error) {
        console.error("Error in payment success handler:", error)
        if (!isCancelled) {
          clearPendingPaymentFlag()
          setStatus("success")
          setMessage("Платеж обработан! Открываем личный кабинет...")
          setIsLoading(false)
          
          // Открываем личный кабинет в новом окне
          setTimeout(() => {
            window.open('/dashboard', '_blank')
          }, 1000)
        }
      }
    }

    // Добавляем таймаут на случай, если что-то пойдет не так
    timeoutId = setTimeout(() => {
      if (!isCancelled) {
        console.log("Timeout reached, showing success anyway")
        clearPendingPaymentFlag()
        setStatus("success")
        setMessage("Платеж обработан! Открываем личный кабинет...")
        setIsLoading(false)
        
        // Открываем личный кабинет в новом окне
        setTimeout(() => {
          window.open('/dashboard', '_blank')
        }, 1000)
      }
    }, 5000) // 5 секунд максимум

    handleSuccessfulPayment()

    return () => {
      isCancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

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
            <Link href="/dashboard">
              <Button className="w-full bg-black text-white hover:bg-gray-800">
                <Zap className="h-4 w-4 mr-2" />
                Перейти в личный кабинет
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
