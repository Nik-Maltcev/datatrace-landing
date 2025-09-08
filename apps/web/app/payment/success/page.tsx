"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Database } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PaymentSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Обновляем данные пользователя после успешной оплаты
    const updateUserData = () => {
      const userData = localStorage.getItem("user")
      if (userData) {
        try {
          const user = JSON.parse(userData)
          // Сбрасываем счетчик использованных проверок
          user.checksUsed = 0
          localStorage.setItem("user", JSON.stringify(user))
        } catch (error) {
          console.error('Error updating user data:', error)
        }
      }
    }

    updateUserData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Database className="h-8 w-8 text-black" />
            <span className="text-xl font-bold text-black">DataTrace</span>
          </div>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Оплата успешна!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Ваш тариф успешно активирован. Теперь вы можете использовать все возможности DataTrace.
          </p>
          <div className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full bg-black text-white hover:bg-gray-800">
                Перейти в личный кабинет
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                На главную
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}