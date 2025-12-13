"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PT_Mono } from "next/font/google"
import Script from "next/script"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { Menu, X } from "lucide-react"

const ptMono = PT_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  display: "swap",
})

import { Card, CardContent } from "@/components/ui/card"
import { Check, ArrowRight, Mail, MessageSquare, ShieldCheck, BookOpen } from "lucide-react"
import Link from "next/link"
import { CyberStatsSlider } from "@/components/cyber-stats-slider"
import { ScamCasesSlider } from "@/components/scam-cases-slider"

function YandexMetrikaLandingCounter() {
  return (
    <>
      <Script
        id="yandex-metrika-105574555"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=105574555', 'ym');

ym(105574555, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
          `,
        }}
      />
      <noscript>
        <div>
          <img src="https://mc.yandex.ru/watch/105574555" style={{position:'absolute', left:'-9999px'}} alt="" />
        </div>
      </noscript>
    </>
  )
}

export default function DataTraceLanding() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteFormData, setDeleteFormData] = useState({ links: '', phone: '', fullName: '', consent: false })
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  // Обработчик postMessage для открытия дашборда из фрейма
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OPEN_DASHBOARD') {
        console.log('Received OPEN_DASHBOARD message, opening new tab')
        window.open('/dashboard', '_blank')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Очистка pending_payment при возврате на страницу
  useEffect(() => {
    try {
      const pending = localStorage.getItem('pending_payment')
      if (pending) {
        const data = JSON.parse(pending)
        // Если прошло больше 5 минут, очищаем
        if (Date.now() - data.startedAt > 5 * 60 * 1000) {
          localStorage.removeItem('pending_payment')
        }
      }
    } catch (error) {
      console.error('Error checking pending payment:', error)
    }
  }, [])

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
    try {
      localStorage.setItem(
        'pending_payment',
        JSON.stringify({ plan, email: user?.email ?? null, startedAt: Date.now() })
      )
    } catch (error) {
      console.error('Unable to mark pending payment:', error)
    }

    let email = user?.email ?? ''
    if (!email) {
      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored) as { email?: string }
          email = parsed?.email ?? ''
        }
      } catch (error) {
        console.error('Unable to read user email from storage:', error)
      }
    }

    const emailQuery = email ? '&email=' + email : ''
    const baseRedirect = window.location.origin + '/payment/success?plan=' + plan
    const successUrl = encodeURIComponent(baseRedirect + emailQuery)

    if (plan === 'basic') {
      // Базовый тариф - 350₽
      window.location.href = `https://self.payanyway.ru/17573877087686?MNT_SUCCESS_URL=${successUrl}&productPrice=350`
    } else if (plan === 'professional-6m') {
      // Профессиональный 6 месяцев - 2500₽
      window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}&productPrice=2500`
    } else if (plan === 'professional-12m') {
      // Профессиональный 12 месяцев - 5000₽
      window.location.href = `https://self.payanyway.ru/17579983533311?MNT_SUCCESS_URL=${successUrl}&productPrice=5000`
    }
  }

  return (
    <div className={`min-h-screen bg-white ${ptMono.className}`}>
      <YandexMetrikaLandingCounter />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <Image
                src="/image-removebg-preview.png"
                alt="DataTrace"
                width={200}
                height={60} 
                className="h-14"
              />
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="#" className="text-sm font-medium text-gray-700 hover:text-black">
                  ГЛАВНАЯ
                </Link>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowSolutionsDropdown(true)}
                  onMouseLeave={() => setShowSolutionsDropdown(false)}
                >
                  <button className="text-sm font-medium text-gray-700 hover:text-black flex items-center">
                    РЕШЕНИЯ
                    <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showSolutionsDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        {/* Links here used to point to #solutions which is now removed,
                            but keeping navigation links functional as general anchors
                            or potentially pointing to other sections might be better.
                            However, user asked to remove "Solutions" block, not necessarily the menu item.
                            Ideally, we should remove the menu item if the section is gone,
                            but the prompt was specific about layout blocks.
                            I'll leave the menu item but maybe just scroll to top or something?
                            Or let them remain as dead links for now if not instructed to change navbar.
                            Actually, it's safer to keep them pointing to something that exists or remove them.
                            Wait, "Блок 'решения' ... убрать".
                            I will just leave the menu items alone for now to minimize scope creep unless they break.
                            Since the #solutions section is gone, clicking them will do nothing.
                            I'll point them to top for now.
                        */}
                        <Link 
                          href="#"
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black border-b border-gray-100"
                          onClick={(e) => {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            setShowSolutionsDropdown(false);
                          }}
                        >
                          Обнаружение и удаление скомпрометированной личной информации
                        </Link>
                        <Link 
                          href="#"
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
                          onClick={(e) => {
                            e.preventDefault();
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                            setShowSolutionsDropdown(false);
                          }}
                        >
                          Мониторинг глубинного интернета и даркнета
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <Link 
                  href="#pricing" 
                  className="text-sm font-medium text-gray-700 hover:text-black"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('pricing')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                >
                  ТАРИФЫ
                </Link>
                <Link href="/blog" className="text-sm font-medium text-gray-700 hover:text-black">
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
              <div className="hidden sm:flex items-center space-x-4">
                <Link href="/course">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    ПРАКТИЧЕСКИЙ КУРС ПО БЕЗОПАСНОСТИ
                  </Button>
                </Link>
                <Button
                  onClick={handleDashboardClick}
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                  disabled={isLoading}
                >
                  {isLoading ? "..." : isAuthenticated ? "ЛИЧНЫЙ КАБИНЕТ" : "ВОЙТИ"}
                </Button>
              </div>
              <Button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                variant="outline"
                size="sm"
                className="md:hidden border-black text-black hover:bg-black hover:text-white bg-transparent"
              >
                {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-4">
              <Link 
                href="#" 
                className="block text-sm font-medium text-gray-700 hover:text-black"
                onClick={() => setShowMobileMenu(false)}
              >
                ГЛАВНАЯ
              </Link>
              {/* Keeping menu items but removing #solutions anchor */}
              <Link 
                href="#"
                className="block text-sm font-medium text-gray-700 hover:text-black"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMobileMenu(false);
                }}
              >
                РЕШЕНИЯ
              </Link>
              <Link 
                href="#pricing" 
                className="block text-sm font-medium text-gray-700 hover:text-black"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                  setShowMobileMenu(false);
                }}
              >
                ТАРИФЫ
              </Link>
              <Link 
                href="/blog" 
                className="block text-sm font-medium text-gray-700 hover:text-black"
                onClick={() => setShowMobileMenu(false)}
              >
                БЛОГ
              </Link>
              <Link 
                href="#contacts" 
                className="block text-sm font-medium text-gray-700 hover:text-black"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contacts')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                  setShowMobileMenu(false);
                }}
              >
                КОНТАКТЫ
              </Link>
              <Link href="/course">
                <Button
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  ПРАКТИЧЕСКИЙ КУРС ПО БЕЗОПАСНОСТИ
                </Button>
              </Link>
              <Button
                onClick={() => {
                  handleDashboardClick();
                  setShowMobileMenu(false);
                }}
                variant="outline"
                className="w-full border-black text-black hover:bg-black hover:text-white bg-transparent"
                disabled={isLoading}
              >
                {isLoading ? "..." : isAuthenticated ? "ЛИЧНЫЙ КАБИНЕТ" : "ВОЙТИ"}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* 1. Scam Cases Slider (Real Stories) - replacing Hero */}
      <ScamCasesSlider />

      {/* 2. Button "Оставь заявку на удаление" */}
      <div className="py-8 bg-white flex justify-center">
        <Button
          onClick={() => setShowDeleteModal(true)}
          className="bg-black text-white px-8 py-6 text-lg rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
        >
          Оставь заявку на удаление
        </Button>
      </div>

      {/* 3. Threat Statistics */}
      <CyberStatsSlider />

      {/* 4. Description Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                DataTrace представляет платформу на основе искусственного интеллекта и уникальных технических решений, которая позволяет нашим клиентам обнаружить, удалить и мониторить в режиме реального времени скомпрометированную (украденную) личную информацию из баз данных злоумышленников.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">Анализ данных из открытых источников</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">Анализ данных из глубинного интернета и даркнета</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">Мониторинг личной информации</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">Выявление и оценка негативных сценариев</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">Противодействие фишингу и вторичным атакам</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <div className="inline-block bg-black text-white px-4 py-2 text-sm font-medium mb-4">ОБЗОР СЕРВИСА</div>
            <h2 className="text-3xl font-bold text-black mb-4">Как работает DataTrace</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Посмотрите короткое видео о возможностях платформы</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-gray-200">
              <video 
                controls 
                preload="metadata"
                className="w-full bg-black"
              >
                <source src="/overview-new.mp4" type="video/mp4" />
                Ваш браузер не поддерживает видео
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
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
                  <div className="text-4xl font-bold text-black mb-2">2 500₽</div>
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
                  <BookOpen className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Практический курс</h3>
              <p className="text-gray-600 mb-6">
                Пройдите наш практический курс по безопасности и научитесь защищать свои данные
              </p>
              <Link
                href="/course"
                className="inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors w-full"
              >
                Практический курс
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-black text-white p-4 rounded-full">
                  <MessageSquare className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Заявка на удаление информации</h3>
              <p className="text-gray-600 mb-6">
                Отправьте заявку на удаление вашей информации из интернета
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Заполнить форму
              </button>
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
                Свежие новости об утечках в нашем телеграм канале
              </p>
              <a
                href="https://t.me/data_trace"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-lg transition-colors w-full sm:w-auto"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Подписаться на канал
              </a>
            </div>
            <div>
              <h4 className="font-bold mb-4">КОМПАНЯ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/blog" className="hover:text-white">
                    Блог
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#contacts" 
                    className="hover:text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('contacts')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                  >
                    Контакты
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">РЕШЕНИЯ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link 
                    href="#"
                    className="hover:text-white"
                  >
                    Обнаружение и удаление скомпрометированной личной информации
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#"
                    className="hover:text-white"
                  >
                    Мониторинг глубинного интернета и даркнета
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
                    href="https://t.me/nik_maltcev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Задать вопрос основателю сервиса
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

      {/* Модальное окно удаления информации */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full my-8">
            <h3 className="text-xl font-bold mb-4">Заявка на удаление информации</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!deleteFormData.consent) {
                alert('Необходимо согласие на обработку персональных данных')
                return
              }
              setIsSubmittingDelete(true)
              try {
                const response = await fetch('/api/delete-request', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fullName: deleteFormData.fullName,
                    phone: deleteFormData.phone,
                    links: deleteFormData.links
                  })
                })
                
                if (response.ok) {
                  alert('Заявка отправлена! Мы свяжемся с вами в ближайшее время.')
                  setShowDeleteModal(false)
                  setDeleteFormData({ links: '', phone: '', fullName: '', consent: false })
                } else {
                  alert('Ошибка отправки. Попробуйте позже.')
                }
              } catch (error) {
                alert('Ошибка отправки. Попробуйте позже.')
              } finally {
                setIsSubmittingDelete(false)
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ФИО *</label>
                <input
                  type="text"
                  required
                  value={deleteFormData.fullName}
                  onChange={(e) => setDeleteFormData({...deleteFormData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Номер телефона *</label>
                <input
                  type="tel"
                  required
                  value={deleteFormData.phone}
                  onChange={(e) => setDeleteFormData({...deleteFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="+7 (900) 000-00-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ссылки с вашей информацией (каждая с новой строки) *</label>
                <textarea
                  required
                  value={deleteFormData.links}
                  onChange={(e) => setDeleteFormData({...deleteFormData, links: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder="https://example.com/page1&#13;&#10;https://example.com/page2"
                />
              </div>
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={deleteFormData.consent}
                  onChange={(e) => setDeleteFormData({...deleteFormData, consent: e.target.checked})}
                  className="mt-1"
                />
                <label htmlFor="consent" className="text-sm text-gray-600">
                  Я согласен на обработку персональных данных
                </label>
              </div>
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={isSubmittingDelete}
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                >
                  {isSubmittingDelete ? 'Отправка...' : 'Отправить'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  variant="outline"
                  className="flex-1 border-black text-black hover:bg-black hover:text-white"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
