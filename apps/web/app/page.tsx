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
import { Check, ArrowRight, Mail, MessageSquare, ShieldCheck } from "lucide-react"
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

function DataFlowShowcase() {
  const dataSources = [
    {
      label: "????????-????",
      description: "????-??????????, ??? ?????????? ?????? ????? ? ??????????",
      accent: "from-sky-400 to-blue-500",
      glow: "shadow-[0_0_22px_rgba(56,189,248,0.35)]",
      delay: 0
    },
    {
      label: "OSINT-???????????",
      description: "????? ?? ???????? ?????????? ? ???????? ??????",
      accent: "from-indigo-400 to-sky-500",
      glow: "shadow-[0_0_22px_rgba(129,140,248,0.35)]",
      delay: 0.6
    },
    {
      label: "???????-??????",
      description: "?????????? ???????? ???????? ? ???????????? ?????????",
      accent: "from-purple-400 to-fuchsia-500",
      glow: "shadow-[0_0_22px_rgba(168,85,247,0.35)]",
      delay: 1.2
    },
    {
      label: "???????? ?? ?????????????????",
      description: "??????? ????? ????????? ? ????????????? ??????????",
      accent: "from-emerald-400 to-teal-500",
      glow: "shadow-[0_0_22px_rgba(16,185,129,0.35)]",
      delay: 1.8
    }
  ]

  const dataDestinations = [
    {
      label: "???????? ????????",
      description: "???????? ????? ?????????? ?????????? ? ?????? ?? ????????????",
      accent: "from-teal-400 to-emerald-500",
      glow: "shadow-[0_0_22px_rgba(16,185,129,0.35)]",
      delay: 0.4
    },
    {
      label: "??????????? ???????",
      description: "????????? ????? ?? ???????????? ??????? ? ??????? ??????",
      accent: "from-sky-400 to-cyan-500",
      glow: "shadow-[0_0_22px_rgba(14,165,233,0.35)]",
      delay: 1.0
    },
    {
      label: "?????? ?????",
      description: "???????????? ?? ???????? ?????? ? ????????? ??????",
      accent: "from-indigo-400 to-violet-500",
      glow: "shadow-[0_0_22px_rgba(129,140,248,0.35)]",
      delay: 1.6
    },
    {
      label: "?????????? ????????",
      description: "?????????????? ???????? ?? ??-????????? ??????",
      accent: "from-purple-400 to-pink-500",
      glow: "shadow-[0_0_22px_rgba(236,72,153,0.35)]",
      delay: 2.0
    }
  ]

  const legend = [
    { label: "????????? ????????", accent: "from-teal-400 to-emerald-500" },
    { label: "????????? DataTrace", accent: "from-sky-400 to-blue-500" },
    { label: "???????? ? ????????", accent: "from-indigo-400 to-violet-500" }
  ]

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-24 text-white">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[420px] w-[420px] rounded-full bg-sky-500/25 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.45em] text-white/70">
              ??????? ????????
            </span>
            <h2 className="mt-6 text-4xl font-bold lg:text-5xl">
              ????????, ?????? ???????? ??????, ? ??????? ????????? ?? ?????????
            </h2>
            <p className="mt-4 text-lg text-white/70">
              ?? ????????? ??????? ?? ??????????? ?????????? ? ??????????? ??????????? DataTrace, ????? ?????? ???????? ? ??????? ???????????? ?????? ??? ??????? ??????? ????.
            </p>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-8">
              {dataSources.map((source) => (
                <div key={source.label} className="group flex items-center justify-end gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold">{source.label}</p>
                    <p className="text-sm text-white/60">{source.description}</p>
                  </div>
                  <div className="flow-line" aria-hidden="true">
                    <span className="flow-particle" style={{ animationDelay: `${source.delay}s` }} />
                  </div>
                  <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${source.accent} ${source.glow}`} />
                </div>
              ))}
            </div>

            <div className="relative flex justify-center">
              <div className="relative flex h-72 w-72 items-center justify-center">
                <div className="data-ring data-ring-outer absolute inset-2 rounded-full border border-white/10" />
                <div className="data-ring data-ring-middle absolute inset-8 rounded-full border border-white/15" />
                <div className="data-ring data-ring-inner absolute inset-16 rounded-full border border-white/25" />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur">
                    <ShieldCheck className="h-10 w-10 text-sky-200" />
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.45em] text-white/50">DataTrace</p>
                  <p className="text-lg font-semibold text-white">??????? ????????</p>
                </div>

                <div className="absolute -top-10 right-6 h-4 w-4 rounded-full bg-cyan-400/70 blur-[1px] animate-ping" />
                <div className="absolute -bottom-6 left-12 h-5 w-5 rounded-full bg-purple-500/70 blur-[1px] animate-[ping_4s_ease-in-out_infinite]" />
                <div className="absolute top-1/2 left-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
                <div className="absolute top-1/2 right-0 h-2 w-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
              </div>
            </div>

            <div className="space-y-8">
              {dataDestinations.map((destination) => (
                <div key={destination.label} className="group flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${destination.accent} ${destination.glow}`} />
                  <div className="flow-line" aria-hidden="true">
                    <span className="flow-particle" style={{ animationDelay: `${destination.delay}s` }} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{destination.label}</p>
                    <p className="text-sm text-white/60">{destination.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`inline-flex h-3 w-3 rounded-full bg-gradient-to-br ${item.accent}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .flow-line {
          position: relative;
          width: 104px;
          height: 2px;
          overflow: hidden;
          border-radius: 9999px;
          background: linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
        }
        .flow-particle {
          position: absolute;
          top: 50%;
          left: 0;
          width: 36px;
          height: 36px;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.6);
          background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.25) 55%, rgba(255,255,255,0) 70%);
          animation: flowMove 4.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .data-ring {
          animation: ringPulse 9s ease-in-out infinite;
        }
        .data-ring-middle {
          animation-delay: 1.2s;
        }
        .data-ring-inner {
          animation-delay: 2.4s;
        }
        @keyframes flowMove {
          0% {
            left: 0%;
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.4);
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.85);
          }
        }
        @keyframes ringPulse {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
        }
        @media (max-width: 1024px) {
          .flow-line {
            width: 80px;
          }
        }
        @media (max-width: 640px) {
          .flow-line {
            width: 64px;
          }
        }
      `}</style>
    </>
  )
}

export default function DataTraceLanding() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false)

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
    const successUrl = encodeURIComponent(`https://www.datatrace.tech/redirect?plan=${plan}`)
    
    if (plan === 'basic') {
      // Базовый тариф - 350₽
      window.location.href = `https://self.payanyway.ru/17573877087686?MNT_SUCCESS_URL=${successUrl}&productPrice=350`
    } else if (plan === 'professional-6m') {
      // Профессиональный 6 месяцев - 5000₽
      window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}&productPrice=5000`
    } else if (plan === 'professional-12m') {
      // Профессиональный 12 месяцев - 8500₽
      window.location.href = `https://self.payanyway.ru/17579983533311?MNT_SUCCESS_URL=${successUrl}&productPrice=8500`
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

      <DataFlowShowcase />

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
      <section id="pricing" className="py-20">
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
                Подпишись на наш блог
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
                    Обнаружение и удаление скомпрометированной личной информации
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
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

