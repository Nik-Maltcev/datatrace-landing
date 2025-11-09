"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PT_Mono } from "next/font/google"
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
import { Check, ArrowRight, Mail, MessageSquare, ShieldCheck } from "lucide-react"
import Link from "next/link"

function InteractiveHeroGraphic() {
  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg aspect-square">
        <img src="/images/geometric-triangle.png" alt="Geometric Triangle" className="w-full h-full object-contain" />
      </div>
    </div>
  )
}

const DATA_FLOW_SOURCES = [
  {
    code: 'SRC-01',
    label: 'Телеграм-боты',
    description: 'Боты-агрегаторы, где появляются свежие сливы личной информации и закрытые форумы.'
  },
  {
    code: 'SRC-02',
    label: 'OSINT-инструменты',
    description: 'Поиск по открытым источникам, индексам утечек и историческим дампам.'
  },
  {
    code: 'SRC-03',
    label: 'Даркнет-форумы',
    description: 'Мониторинг закрытых площадок с нелегальной продажей украденной информации.'
  },
  {
    code: 'SRC-04',
    label: 'Партнёры по кибербезопасности',
    description: 'Обмен данными с вендорами и подтверждение инцидентов.'
  }
];

const DATA_FLOW_DESTINATIONS = [
  {
    code: 'ACT-01',
    label: 'Точечное удаление',
    description: 'Обратная связь владельцам источников и контроль заявок на удаление или деиндексацию.'
  },
  {
    code: 'ACT-02',
    label: 'Уведомление клиента',
    description: 'Подробный отчёт об обработанных утечках, статусе и SLA.'
  },
  {
    code: 'ACT-03',
    label: 'Защита цифрового следа',
    description: 'Рекомендации по усилению защиты, ротации идентифицирующей информации и смене паролей.'
  },
  {
    code: 'ACT-04',
    label: 'Мониторинг повторных утечек информации',
    description: 'Автоматические проверки на повторное появление данных и их удаление или деиндексация.'
  }
];

const DATA_FLOW_LEGEND = [
  'Легитимная проверка',
  'Аналитика DataTrace',
  'Удаление и контроль'
];


function DataFlowShowcaseLight() {
  const dataSources = DATA_FLOW_SOURCES;

  const dataDestinations = DATA_FLOW_DESTINATIONS;

  const legend = DATA_FLOW_LEGEND;

  return (
    <section className={`relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-emerald-50 py-24 text-slate-900 ${ptMono.className}`}>
      <div className="absolute inset-0 light-noise-mask opacity-30" />
      <div className="absolute inset-0 light-grid-overlay" />
      <div className="absolute inset-0 light-radial" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <span className="inline-flex items-center justify-center rounded-full border border-emerald-300/80 bg-white/70 px-5 py-1 text-[11px] uppercase tracking-[0.45em] text-emerald-600 shadow-[0_8px_20px_rgba(34,197,94,0.15)]">
            легитимное удаление
          </span>
          <h2 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Понимаем, откуда приходят утечки, и бережно закрываем их источники
          </h2>
          <p className="text-base text-slate-600">
            Мы соединяем сигналы от проверенных источников с внутренними протоколами DataTrace, чтобы быстро находить и удалять персональные данные без участия теневых схем.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-8">
            {dataSources.map((source, index) => (
              <div key={source.code} className="group relative flex items-start justify-end gap-6 z-10">
                <div className="hidden relative h-px w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-l from-emerald-300/70 to-transparent lg:block">
                  <span
                    className="trace-line-light"
                    style={{ animationDelay: `${index * 0.6}s` }}
                  />
                </div>
                <div className="max-w-sm text-right">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-400">{source.code}</p>
                  <p className="mt-2 text-lg text-slate-900">{source.label}</p>
                  <p className="mt-2 text-sm text-slate-600">{source.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative flex w-full items-center justify-center min-h-[260px] sm:min-h-[320px] md:min-h-[360px] lg:min-h-[420px]">
            <div className="absolute h-[200px] w-[200px] sm:h-[240px] sm:w-[240px] md:h-[280px] md:w-[280px] lg:h-[300px] lg:w-[300px] rounded-[2.5rem] border border-slate-200/80 bg-white/80 backdrop-blur-md shadow-[0_20px_60px_rgba(34,197,94,0.12)]" />
            <div className="absolute h-[280px] w-[280px] sm:h-[340px] sm:w-[340px] md:h-[380px] md:w-[380px] lg:h-[420px] lg:w-[420px] rounded-full border border-emerald-200/70 blur-sm" />
            <div className="absolute h-[320px] w-[320px] sm:h-[380px] sm:w-[380px] md:h-[420px] md:w-[420px] lg:h-[480px] lg:w-[480px] rounded-full border border-emerald-100/60" />
            <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4 sm:px-6">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border border-emerald-400/50 bg-white">
                <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" strokeWidth={1.3} />
              </div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-emerald-500/70">datatrace</p>
              <p className="text-sm sm:text-base font-semibold text-slate-900">Легитимное удаление</p>
              <div className="mt-2 sm:mt-4 grid gap-1 text-[9px] sm:text-[11px] text-slate-500 max-w-[180px] sm:max-w-none">
                <p>Журнал проверок • Шифрование</p>
                <p>Контроль повторных утечек</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {dataDestinations.map((item, index) => (
              <div key={item.code} className="group relative flex items-start gap-6">
                <div className="max-w-sm">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-400">{item.code}</p>
                  <p className="mt-2 text-lg text-slate-900">{item.label}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
                <div className="hidden relative h-px w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-emerald-300/70 to-transparent lg:block">
                  <span
                    className="trace-line-light"
                    style={{ animationDelay: `${index * 0.6 + 0.3}s` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
          {legend.map((item) => (
            <span key={item} className="inline-flex items-center gap-3 rounded-full border border-emerald-200/80 px-4 py-2 bg-white/90 shadow-[0_10px_30px_rgba(34,197,94,0.12)]">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-lime-200" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .light-noise-mask {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E");
        }
        .light-grid-overlay {
          background-image:
            linear-gradient(to right, rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 197, 94, 0.1) 1px, transparent 1px);
          background-size: 42px 42px;
          mix-blend-mode: multiply;
        }
        .light-radial {
          background: radial-gradient(circle at center, rgba(34, 197, 94, 0.18), transparent 60%);
        }
        .trace-line-light {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.65), transparent);
          animation: sweep-light 3.6s linear infinite;
        }
        @keyframes sweep-light {
          0% { transform: translateX(-100%); opacity: 0; }
          25% { opacity: 1; }
          75% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </section>
  );
}


export default function DataTraceLanding() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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
      {/* Header */}
      <header className="border-b border-gray-200">
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
                        <Link 
                          href="#solutions" 
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black border-b border-gray-100"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('solutions')?.scrollIntoView({ 
                              behavior: 'smooth' 
                            });
                            setShowSolutionsDropdown(false);
                          }}
                        >
                          Обнаружение и удаление скомпрометированной личной информации
                        </Link>
                        <Link 
                          href="#solutions" 
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('solutions')?.scrollIntoView({ 
                              behavior: 'smooth' 
                            });
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
              <Link 
                href="#solutions" 
                className="block text-sm font-medium text-gray-700 hover:text-black"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('solutions')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
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

      {/* Hero Section */}
      <section className="py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-black leading-[1.0]">
                  ИИ-платформа для поиска и удаления скомпрометированной личной информации
                </h1>
              </div>
              <div>
                <Button
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black hover:text-white px-8 py-3 bg-transparent sm:w-auto"
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
                <p className="text-gray-700">
                  Аналитический модуль DataTrace ищет утечки персональных данных по всем доступным источникам и
                  предоставляет возможность их полного удаления с последующим мониторингом.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-black mb-4">02</div>
                <h3 className="text-2xl font-bold text-black mb-6">ИИ модуль</h3>
                <p className="text-gray-700">
                  ИИ модуль DataTrace анализирует репутацию в интернете на основе больших данных, предоставляя
                  комплексную оценку цифрового следа и репутационных рисков.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <DataFlowShowcaseLight />

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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Задать вопрос основателю сервиса</h3>
              <p className="text-gray-600 mb-6">
                Свяжитесь с нами в Telegram для быстрого получения ответа на ваши вопросы
              </p>
              <a
                href="https://t.me/nik_maltcev"
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
                    href="#solutions" 
                    className="hover:text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('solutions')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                  >
                    Обнаружение и удаление скомпрометированной личной информации
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#solutions" 
                    className="hover:text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('solutions')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
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
    </div>
  )
}




