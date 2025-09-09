"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PT_Mono } from "next/font/google"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

const ptMono = PT_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  display: "swap",
})

import { Card, CardContent } from "@/components/ui/card"
import { Check, ArrowRight, Database } from "lucide-react"
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

  const handlePlanSelect = (plan: 'basic' | 'professional' | 'corporate') => {
    if (isLoading) return
    
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    // Если авторизован, открываем ссылку на оплату
    const successUrl = encodeURIComponent('https://datatrace-landing-production-6a5e.up.railway.app/dashboard')
    
    if (plan === 'basic') {
      window.open(`https://self.payanyway.ru/17573877087686?MNT_SUCCESS_URL=${successUrl}`, '_blank')
    } else if (plan === 'professional') {
      window.open(`https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}`, '_blank')
    } else {
      // Корпоративный - обращение к менеджеру
      alert('Для корпоративного тарифа обратитесь к менеджеру')
    }
  }

  return (
    <div className={`min-h-screen bg-white ${ptMono.className}`}>
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">DataTrace</span>
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
                ОТРАСЛИ
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-black">
                РЕСУРСЫ
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-black">
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
                  ИИ-платформа для анализа данных,
                  <br />
                  поиска утечек и защиты информации
                </h1>
              </div>
              <div>
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white px-8 py-3 bg-transparent"
                >
                  {"ОСТАВИТЬ ЗАЯВКУ"}
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

      {/* Industries Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="inline-block bg-black text-white px-4 py-2 text-sm font-medium">ОТРАСЛИ</div>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <div className="text-6xl font-bold text-black mb-4">01</div>
                <h3 className="text-xl font-bold text-black mb-3">ГОСУДАРСТВЕННЫЙ СЕКТОР</h3>
                <p className="text-gray-700">
                  Проведение оценки информационной среды и защита государственных организаций и граждан от
                  информационных угроз с помощью DataTrace.
                </p>
              </div>
              <div>
                <div className="text-6xl font-bold text-black mb-4">03</div>
                <h3 className="text-xl font-bold text-black mb-3">ОБНАРУЖЕНИЕ НЕКИНЕТИЧЕСКИХ ОПЕРАЦИЙ</h3>
                <p className="text-gray-700">
                  Информационные атаки могут использоваться как часть некинетических операций в современной войне. Это
                  имеет основополагающее значение для оценки информационной среды для их обнаружения вовремя.
                </p>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <div className="text-6xl font-bold text-black mb-4">02</div>
                <h3 className="text-xl font-bold text-black mb-3">БИЗНЕС</h3>
                <p className="text-gray-700">
                  Защитите бренды и активы от информационных угроз. Получите рыночные инсайты из нарративов вашей
                  целевой аудитории.
                </p>
              </div>
              <div>
                <div className="text-6xl font-bold text-black mb-4">04</div>
                <h3 className="text-xl font-bold text-black mb-3">БЕЗОПАСНОСТЬ</h3>
                <p className="text-gray-700">
                  Выявление, анализ и противодействие информационным манипуляциям и вмешательству (FMI), дезинформации и
                  координированному неаутентичному поведению (CIB) с помощью DataTrace на уровне медиа-разведки.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="inline-block bg-black text-white px-4 py-2 text-sm font-medium">РЕШЕНИЯ</div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
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
            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-black mb-4">03</div>
                <h3 className="text-2xl font-bold text-black mb-6">Корпоративный модуль</h3>
                <p className="text-gray-700 mb-8">
                  Корпоративный модуль DataTrace специализируется на поиске и удалении корпоративных утечек данных,
                  защищая конфиденциальную информацию компании и её сотрудников.
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
                  <div className="text-4xl font-bold text-black mb-2">500₽</div>
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
                  <div className="text-4xl font-bold text-black mb-2">8 500₽</div>
                  <p className="text-gray-600">за запрос</p>
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
                    <p className="text-gray-700">Повторная проверка</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Постоянный мониторинг</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Уведомления о новых утечках</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handlePlanSelect('professional')}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  ВЫБРАТЬ ТАРИФ
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">КОРПОРАТИВНЫЙ</h3>
                  <div className="text-4xl font-bold text-black mb-2">По запросу</div>
                  <p className="text-gray-600">индивидуально</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Все возможности профессионального тарифа</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Поиск скомпрометированных данных сотрудников</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Удаление данных сотрудников</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Корпоративная панель управления</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Приоритетная поддержка</p>
                  </div>
                </div>
                <Button
                  onClick={() => handlePlanSelect('corporate')}
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black hover:text-white bg-transparent"
                >
                  СВЯЗАТЬСЯ С НАМИ
                </Button>
              </CardContent>
            </Card>


          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <Database className="h-8 w-8 text-white" />
                <span className="text-xl font-bold">DataTrace</span>
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
              <h4 className="font-bold mb-4">ОТРАСЛИ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Государственный сектор
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Бизнес-разведка
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Электронная разведка
                  </Link>
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
