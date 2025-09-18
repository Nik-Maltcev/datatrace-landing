"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle, Star, ArrowLeft, Check, Tag } from "lucide-react"
import Link from "next/link"

export default function PaymentPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState('')

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'DATATRACE25') {
      setPromoApplied(true)
      setPromoError('')
    } else {
      setPromoApplied(false)
      setPromoError('Неверный промокод')
    }
  }

  const calculateDiscountedPrice = (price: string) => {
    if (!promoApplied) return price
    const originalPrice = parseInt(price.replace(/\s/g, ''))
    const discountedPrice = Math.round(originalPrice * 0.75) // 25% скидка
    return discountedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const handlePayment = async (planId: string) => {
    setLoading(planId)
    
    try {
      const successUrl = encodeURIComponent(`${window.location.origin}/dashboard?payment=success`)
      
      // Рассчитываем итоговую цену с учетом промокода
      const plan = plans.find(p => p.id === planId)
      if (!plan) return
      
      const finalPrice = promoApplied 
        ? Math.round(parseInt(plan.price.replace(/\s/g, '')) * 0.75)
        : parseInt(plan.price.replace(/\s/g, ''))
      
      // Прямые ссылки на платежные страницы
      if (planId === 'basic') {
        window.location.href = `https://self.payanyway.ru/17573877087686?MNT_SUCCESS_URL=${successUrl}&productPrice=${finalPrice}`
      } else if (planId === 'professional-6m') {
        window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}&productPrice=${finalPrice}`
      } else if (planId === 'professional-12m') {
        window.location.href = `https://self.payanyway.ru/17579983533311?MNT_SUCCESS_URL=${successUrl}&productPrice=${finalPrice}`
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
      price: '350',
      period: 'за запрос',
      checks: '1',
      features: [
        '1 проверка включена',
        'Поиск по всем источникам',
        'Детальный отчет о найденных данных',
        'Анализ уровня компрометации'
      ],
      popular: false
    },
    {
      id: 'professional-6m',
      name: 'ПРОФЕССИОНАЛЬНЫЙ',
      period: '6 месяцев',
      price: '5 000',
      pricePeriod: 'единовременно',
      checks: '2',
      features: [
        '2 проверки включены',
        'Поиск по всем источникам',
        'Удаление из всех источников',
        'Мониторинг утечек 6 месяцев',
        'Уведомления о новых утечках',
        'Детальные отчеты'
      ],
      popular: true
    },
    {
      id: 'professional-12m',
      name: 'ПРОФЕССИОНАЛЬНЫЙ',
      period: '12 месяцев',
      price: '8 500',
      pricePeriod: 'единовременно',
      checks: '2',
      features: [
        '2 проверки включены',
        'Поиск по всем источникам',
        'Удаление из всех источников',
        'Мониторинг утечек 12 месяцев',
        'Уведомления о новых утечках',
        'Приоритетная поддержка'
      ],
      popular: false
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

        {/* Promo Code Section */}
        <Card className="mb-8 max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Tag className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Промокод</h3>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Введите промокод"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase())
                  setPromoError('')
                  setPromoApplied(false)
                }}
                className="flex-1"
              />
              <Button onClick={applyPromoCode} variant="outline">
                Применить
              </Button>
            </div>
            {promoApplied && (
              <div className="flex items-center text-green-600 text-sm">
                <Check className="h-4 w-4 mr-1" />
                Скидка 25% применена!
              </div>
            )}
            {promoError && (
              <div className="text-red-600 text-sm">
                {promoError}
              </div>
            )}
          </CardContent>
        </Card>

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
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={`border-2 ${plan.popular ? 'border-black bg-gray-50 relative' : 'border-gray-200 hover:border-black transition-colors'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black text-white px-4 py-1 text-sm font-medium rounded">ПОПУЛЯРНЫЙ</div>
                </div>
              )}
              
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
                  {plan.period && plan.period !== 'за запрос' && (
                    <p className="text-lg text-gray-700 mb-2">{plan.period}</p>
                  )}
                  <div className="text-center mb-2">
                    {promoApplied && (
                      <div className="text-2xl text-gray-400 line-through mb-1">
                        {plan.price}₽
                      </div>
                    )}
                    <div className={`text-4xl font-bold ${promoApplied ? 'text-green-600' : 'text-black'}`}>
                      {calculateDiscountedPrice(plan.price)}₽
                    </div>
                    {promoApplied && (
                      <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                        Скидка 25%
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.pricePeriod || plan.period}</p>
                </div>
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                      <p className="text-gray-700">{feature}</p>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => handlePayment(plan.id)}
                  disabled={loading !== null || (user?.plan === plan.id)}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'border-black text-black hover:bg-black hover:text-white bg-transparent'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {loading === plan.id ? 'Переход к оплате...' : 
                   user?.plan === plan.id ? 'Текущий тариф' :
                   'ВЫБРАТЬ ТАРИФ'}
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

        {/* Promo Info */}
        <div className="mt-8 text-center">
          <Card className="max-w-md mx-auto border-dashed border-2 border-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4">
                <Tag className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Промокод DATATRACE25
              </h3>
              <p className="text-gray-600 text-sm">
                Скидка 25% на все тарифы. Введите промокод выше для активации скидки.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}