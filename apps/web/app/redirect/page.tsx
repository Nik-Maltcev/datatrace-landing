"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Database, Zap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function PaymentSuccessPage() {
  const { updateUserPlan, user, refreshUserData } = useAuth()

  useEffect(() => {
    const refreshData = async () => {
      if (user?.id) {
        console.log('Refreshing user data after payment')
        await refreshUserData()
      } else {
        console.log('No user found, trying to refresh localStorage')
        // Пытаемся перечитать данные из localStorage
        const userData = localStorage.getItem("user")
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData)
            console.log('Found user in localStorage:', parsedUser)
            // Принудительно обновляем данные из базы
            if (parsedUser.id) {
              const response = await fetch('/api/user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parsedUser.id })
              })
              
              const result = await response.json()
              console.log('Force refresh API response:', result)
              
              if (response.ok && result.ok && result.profile) {
                const updatedUser = {
                  ...parsedUser,
                  plan: result.profile.plan || 'free',
                  checksLimit: result.profile.checks_limit || 0,
                  checksUsed: result.profile.checks_used || 0
                }
                
                console.log('Force updating localStorage with:', updatedUser)
                localStorage.setItem("user", JSON.stringify(updatedUser))
                // Перезагружаем страницу чтобы обновить состояние
                window.location.reload()
              }
            }
          } catch (error) {
            console.error('Error parsing user data:', error)
          }
        }
      }
    }
    
    // Обновляем данные через 3 секунды, чтобы webhook успел отработать
    const timer = setTimeout(refreshData, 3000)
    
    return () => clearTimeout(timer)
  }, [user?.id, refreshUserData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Database className="h-8 w-8 text-black" />
            <span className="text-2xl font-bold text-black">DataTrace</span>
          </div>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-green-600 mb-2">
            Оплата успешна!
          </CardTitle>
          <p className="text-lg text-gray-600">
            Ваш тариф активирован
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-6 pt-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-700 mb-2">
              🎉 Поздравляем! Теперь вы можете использовать все возможности DataTrace для защиты ваших данных.
            </p>
            <p className="text-sm text-gray-500">
              Ваши проверки обновлены и готовы к использованию
            </p>
          </div>
          
          <a href="/dashboard" target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl shadow-lg transform hover:scale-105 transition-all">
              <Zap className="h-5 w-5 mr-2" />
              Начать проверку
            </Button>
          </a>
          
          <div className="flex justify-center space-x-4 pt-4">
            <Link href="/">
              <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                На главную
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}