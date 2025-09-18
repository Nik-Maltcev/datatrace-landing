"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PaymentPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const handlePayment = async (plan: 'basic' | 'professional') => {
    setLoading(plan)
    
    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plan,
          email: user?.email 
        }),
      })

      const data = await response.json()
      
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        console.error('Payment URL not received')
        setLoading(null)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setLoading(null)
    }
  }

  const plans = [
    {
      id: 'basic',
      name: 'БАЗОВЫЙ',
      price: '299',
      checks: '1',
      features: [
        'Проверка телефона и email',
        'Базовые источники данных',
        'Простые результаты',
        'Техподдержка'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'ПРОФЕССИОНАЛЬНЫЙ', 
      price: '599',
      checks: '2',
      features: [
        'Проверка телефона и email',
        'Все источники данных',
        'Детализированные результаты',
        'История проверок',
        'Экспорт данных',
        'Приоритетная поддержка'
      ],
      popular: true
    }
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к дашборду
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Выберите тарифный план
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Получите доступ к полнофункциональному поиску утечек данных
            </p>
          </div>
        </div>

        {/* Current Plan */}
        {user?.plan && user.plan !== 'free' && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Текущий тариф: {user.plan === 'professional' ? 'ПРОФЕССИОНАЛЬНЫЙ' : 'БАЗОВЫЙ'}
                  </h3>
                  <p className="text-green-700">
                    Использовано проверок: {user.checksUsed || 0}/{user.checksLimit || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Популярный
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-3xl font-bold text-gray-900">
                  {plan.price}₽
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    / {plan.checks} {plan.checks === '1' ? 'проверка' : 'проверки'}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePayment(plan.id as 'basic' | 'professional')}
                  disabled={loading !== null || (user?.plan === plan.id)}
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {loading === plan.id ? 'Переход к оплате...' : 
                   user?.plan === plan.id ? 'Текущий тариф' :
                   `Выбрать ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Сравнение возможностей
          </h2>
          
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden max-w-4xl mx-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Возможности</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900">Базовый</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900">Профессиональный</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-gray-700">Количество проверок</td>
                  <td className="px-6 py-4 text-center">1</td>
                  <td className="px-6 py-4 text-center">2</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Проверка телефона</td>
                  <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Проверка email</td>
                  <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">История проверок</td>
                  <td className="px-6 py-4 text-center">-</td>
                  <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Детализированные результаты</td>
                  <td className="px-6 py-4 text-center">-</td>
                  <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Техподдержка</td>
                  <td className="px-6 py-4 text-center">Обычная</td>
                  <td className="px-6 py-4 text-center">Приоритетная</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}