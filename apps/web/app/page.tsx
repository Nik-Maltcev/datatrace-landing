"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PT_Mono } from "next/font/google"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"

const ptMono = PT_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  display: "swap",
})

import { Card, CardContent } from "@/components/ui/card"
import { Check, ArrowRight, Mail, MessageSquare } from "lucide-react"
import Link from "next/link"

function InteractiveHeroGraphic() {
  return (
    <div className="flex justify-center">
      <div className="relative w-[500px] h-[500px]">
        <img src="/images/geometric-triangle.png" alt="Geometric Triangle" className="w-full h-full object-contain" />
      </div>
    </div>
  )
}

export default function DataTraceLanding() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleDashboardClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  const handlePlanSelect = (plan: 'basic' | 'professional-6m' | 'professional-12m') => {
    if (isLoading) return
    
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    // Если авторизован, открываем ссылку на оплату
    const successUrl = encodeURIComponent('https://datatrace-landing-production-6a5e.up.railway.app/redirect')
    
    if (plan === 'basic') {
      // Базовый тариф - 350₽
      window.location.href = `https://self.payanyway.ru/17573877087686?MNT_SUCCESS_URL=${successUrl}&productPrice=350`
    } else if (plan === 'professional-6m') {
      // Профессиональный 6 месяцев - 5000₽
      window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}&productPrice=5000`
    } else if (plan === 'professional-12m') {
      // Профессиональный 12 месяцев - 8500₽
      window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}&productPrice=8500`
    }
  }

  return (
    <div className={`min-h-screen bg-white ${ptMono.className}`}>
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image 
                src="/image-removebg-preview.png" 
                alt="DataTrace" 
                width={200} 
                height={60} 
                className="h-14"
              />
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-black">
                ГЛАВНАЯ
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-black">
                О НАС
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-black">
                РЕШЕНИЯ
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-black">
                БЛОГ
              </Link>
              <Link 
                href="#contacts" 
                className="text-sm font-medium text-gray-700 hover:text-black"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contacts')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              >
                КОНТАКТЫ
              </Link>
            </nav>
            <Button
              onClick={handleDashboardClick}
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white bg-transparent"
              disabled={isLoading}
            >
              {isLoading ? "..." : isAuthenticated ? "ЛИЧНЫЙ КАБИНЕТ" : "ВОЙТИ"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold text-black leading-[1.0]">
                  ИИ-платформа для поиска и удаления скомпрометированной личной информации
                </h1>
              </div>
              <div>
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white px-8 py-3 bg-transparent"
                  onClick={() => {
                    document.getElementById('solutions')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                >
                  {"УЗНАТЬ ПОДРОБНЕЕ"}
                </Button>
              </div>
            </div>
            <InteractiveHeroGraphic />
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                DataTrace предоставляет платформу на основе искусственного интеллекта для аналитиков и лиц, принимающих
                решения в бизнесе, правительстве и гражданском обществе. Наша платформа усиливает медиа-аналитику,
                укрепляет анализ открытых источников и защищает от информационных угроз.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">Анализ данных открытых источников в информационной среде</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">Выявление и оценка нарративов</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">Идентификация и противодействие информационным угрозам</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">
                  Защита от переманивания сотрудников через предотвращение поиска их скомпрометированных контактов
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Solutions Section */}
      <section id="solutions" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="inline-block bg-black text-white px-4 py-2 text-sm font-medium">РЕШЕНИЯ</div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-black mb-4">01</div>
                <h3 className="text-2xl font-bold text-black mb-6">Аналитический модуль</h3>
                <p className="text-gray-700 mb-8">
                  Аналитический модуль DataTrace ищет утечки персональных данных по всем доступным источникам и
                  предоставляет возможность их полного удаления с последующим мониторингом.
                </p>
                <Button variant="ghost" className="text-black hover:bg-black hover:text-white p-0">
                  УЗНАТЬ БОЛЬШЕ <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-black mb-4">02</div>
                <h3 className="text-2xl font-bold text-black mb-6">ИИ модуль</h3>
                <p className="text-gray-700 mb-8">
                  ИИ модуль DataTrace анализирует репутацию в интернете на основе больших данных, предоставляя
                  комплексную оценку цифрового следа и репутационных рисков.
                </p>
                <Button variant="ghost" className="text-black hover:bg-black hover:text-white p-0">
                  УЗНАТЬ БОЛЬШЕ <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="inline-block bg-black text-white px-4 py-2 text-sm font-medium">ТАРИФЫ</div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">БАЗОВЫЙ</h3>
                  <div className="text-4xl font-bold text-black mb-2">350₽</div>
                  <p className="text-gray-600">за запрос</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">1 проверка включена</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Поиск по всем источникам</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Детальный отчет о найденных данных</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Анализ уровня компрометации</p>
                  </div>
                </div>
                <Button
                  onClick={() => handlePlanSelect('basic')}
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black hover:text-white bg-transparent"
                >
                  ВЫБРАТЬ ТАРИФ
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-black bg-gray-50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-black text-white px-4 py-1 text-sm font-medium rounded">ПОПУЛЯРНЫЙ</div>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">ПРОФЕССИОНАЛЬНЫЙ</h3>
                  <p className="text-lg text-gray-700 mb-2">6 месяцев</p>
                  <div className="text-4xl font-bold text-black mb-2">5 000₽</div>
                  <p className="text-gray-600">единовременно</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">2 проверки включены</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Поиск по всем источникам</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Удаление из всех источников</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Мониторинг утечек 6 месяцев</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Уведомления о новых утечках</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Детальные отчеты</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handlePlanSelect('professional-6m')}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  ВЫБРАТЬ ТАРИФ
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">ПРОФЕССИОНАЛЬНЫЙ</h3>
                  <p className="text-lg text-gray-700 mb-2">12 месяцев</p>
                  <div className="text-4xl font-bold text-black mb-2">8 500₽</div>
                  <p className="text-gray-600">единовременно</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">2 проверки включены</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Поиск по всем источникам</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Удаление из всех источников</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Мониторинг утечек 12 месяцев</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Уведомления о новых утечках</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Приоритетная поддержка</p>
                  </div>
                </div>
                <Button
                  onClick={() => handlePlanSelect('professional-12m')}
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black hover:text-white bg-transparent"
                >
                  ВЫБРАТЬ ТАРИФ
                </Button>
              </CardContent>
            </Card>


          </div>
        </div>
      </section>

      {/* Contacts Section */}
      <section id="contacts" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Остались вопросы?</h2>
          <p className="text-xl text-gray-600 mb-12">
            Мы готовы помочь! Свяжитесь с нами любым удобным способом
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-black text-white p-4 rounded-full">
                  <Mail className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Напишите нам</h3>
              <p className="text-gray-600 mb-6">
                Отправьте ваш вопрос на почту поддержки, и мы ответим в течение 24 часов
              </p>
              <a
                href="mailto:support@datatrace.tech"
                className="inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                support@datatrace.tech
              </a>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-black text-white p-4 rounded-full">
                  <MessageSquare className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Telegram поддержка</h3>
              <p className="text-gray-600 mb-6">
                Свяжитесь с нами в Telegram для быстрого получения ответа на ваши вопросы
              </p>
              <a
                href="https://t.me/datatrace_support_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Написать в Telegram
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="mb-6">
                <Image 
                  src="/image-removebg-preview.png" 
                  alt="DataTrace" 
                  width={200} 
                  height={60} 
                  className="h-14 brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 mb-6">
                Получите ценную стратегию, культуру и тренд-анализ, адаптированный под ваши цели.
              </p>
              <div className="flex space-x-4">
                <input
                  type="email"
                  placeholder="Ваш email здесь"
                  className="bg-gray-800 text-white px-4 py-2 rounded flex-1"
                />
                <Button className="bg-white text-black hover:bg-gray-200">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">КОМПАНИЯ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    О нас
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Новости
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Партнеры
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Блог
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Контакты
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">РЕШЕНИЯ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Телеграм
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Коммерческие
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Правительство
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Безопасность
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    OSINT
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Мониторинг медиа
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">КОНТАКТЫ</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <a 
                    href="mailto:support@datatrace.tech" 
                    className="hover:text-white"
                  >
                    support@datatrace.tech
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <a 
                    href="https://t.me/datatrace_support_bot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Telegram Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">DataTrace 2025 © Все права защищены</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="#" className="text-gray-400 hover:text-white text-sm">
                  Политика конфиденциальности
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white text-sm">
                  Условия использования
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white text-sm">
                  Соглашение об обработке данных
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Модальное окно авторизации */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-center">Требуется авторизация</h3>
            <p className="text-gray-600 mb-6 text-center">
              Для покупки тарифа необходимо войти в аккаунт или зарегистрироваться.
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={() => {
                  setShowAuthModal(false)
                  router.push('/login')
                }}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Войти
              </Button>
              <Button 
                onClick={() => {
                  setShowAuthModal(false)
                  router.push('/register')
                }}
                variant="outline"
                className="flex-1 border-black text-black hover:bg-black hover:text-white"
              >
                Регистрация
              </Button>
            </div>
            <Button 
              onClick={() => setShowAuthModal(false)}
              variant="ghost"
              className="w-full mt-3 text-gray-500 hover:text-gray-700"
            >
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
