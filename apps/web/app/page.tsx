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
      code: 'SRC-01',
      label: 'РўРµР»РµРіСЂР°Рј-Р±РѕС‚С‹',
      description: 'Р‘РѕС‚С‹-Р°РіСЂРµРіР°С‚РѕСЂС‹, РіРґРµ РїРѕСЏРІР»СЏСЋС‚СЃСЏ СЃРІРµР¶РёРµ СЃР»РёРІС‹ Рё РѕР±СЃСѓР¶РґРµРЅРёСЏ.'
    },
    {
      code: 'SRC-02',
      label: 'OSINT-РёРЅСЃС‚СЂСѓРјРµРЅС‚С‹',
      description: 'РџРѕРёСЃРє РїРѕ РѕС‚РєСЂС‹С‚С‹Рј РёСЃС‚РѕС‡РЅРёРєР°Рј, РёРЅРґРµРєСЃР°Рј СѓС‚РµС‡РµРє Рё РёСЃС‚РѕСЂРёС‡РµСЃРєРёРј РґР°РјРїР°Рј.'
    },
    {
      code: 'SRC-03',
      label: 'Р”Р°СЂРєРЅРµС‚-С„РѕСЂСѓРјС‹',
      description: 'РњРѕРЅРёС‚РѕСЂРёРЅРі Р·Р°РєСЂС‹С‚С‹С… РїР»РѕС‰Р°РґРѕРє СЃ РЅРµР»РµРіР°Р»СЊРЅС‹РјРё РїСЂРѕРґР°Р¶Р°РјРё Рё РѕР±СЃСѓР¶РґРµРЅРёСЏРјРё.'
    },
    {
      code: 'SRC-04',
      label: 'РџР°СЂС‚РЅС‘СЂС‹ РїРѕ РєРёР±РµСЂР±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё',
      description: 'Р­С‚РёС‡РЅС‹Р№ РѕР±РјРµРЅ СЃРёРіРЅР°Р»Р°РјРё СЃ РІРµРЅРґРѕСЂР°РјРё Рё РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РёРЅС†РёРґРµРЅС‚РѕРІ.'
    }
  ];

  const dataDestinations = [
    {
      code: 'ACT-01',
      label: 'РўРѕС‡РµС‡РЅРѕРµ СѓРґР°Р»РµРЅРёРµ',
      description: 'РћР±СЂР°С‚РЅР°СЏ СЃРІСЏР·СЊ РІР»Р°РґРµР»СЊС†Р°Рј РёСЃС‚РѕС‡РЅРёРєРѕРІ Рё РєРѕРЅС‚СЂРѕР»СЊ Р·Р°СЏРІРѕРє РЅР° РґРµРёРЅРґРµРєСЃР°С†РёСЋ.'
    },
    {
      code: 'ACT-02',
      label: 'РЈРІРµРґРѕРјР»РµРЅРёРµ РєР»РёРµРЅС‚Р°',
      description: 'РџРѕРґСЂРѕР±РЅС‹Р№ РѕС‚С‡С‘С‚ РѕР± РѕР±СЂР°Р±РѕС‚Р°РЅРЅС‹С… СѓС‚РµС‡РєР°С…, СЃС‚Р°С‚СѓСЃРµ Рё SLA.'
    },
    {
      code: 'ACT-03',
      label: 'Р—Р°С‰РёС‚Р° СЃР»РµРґР°',
      description: 'Р РµРєРѕРјРµРЅРґР°С†РёРё РїРѕ СѓСЃРёР»РµРЅРёСЋ Р·Р°С‰РёС‚С‹, СЂРѕС‚Р°С†РёРё РєР»СЋС‡РµР№ Рё РїРѕР»РёС‚РёРє.'
    },
    {
      code: 'ACT-04',
      label: 'РњРѕРЅРёС‚РѕСЂРёРЅРі РїРѕРІС‚РѕСЂРѕРІ',
      description: 'РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРёРµ РїСЂРѕРІРµСЂРєРё РЅР° РїРѕРІС‚РѕСЂРЅРѕРµ РїРѕСЏРІР»РµРЅРёРµ РґР°РЅРЅС‹С… Рё РёС… Р±Р»РѕРєРёСЂРѕРІРєСѓ.'
    }
  ];

  const legend = [
    'Р­С‚РёС‡РЅР°СЏ РїСЂРѕРІРµСЂРєР°',
    'РђРЅР°Р»РёС‚РёРєР° DataTrace',
    'РЈРґР°Р»РµРЅРёРµ Рё РєРѕРЅС‚СЂРѕР»СЊ'
  ];

  return (
    <section className={`relative overflow-hidden bg-[#050607] py-24 text-white ${ptMono.className}`}>
      <div className="absolute inset-0 noise-mask opacity-30" />
      <div className="absolute inset-0 grid-overlay" />
      <div className="absolute inset-0 bg-radial" />

      <div className="relative container mx-auto px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <span className="inline-flex items-center justify-center rounded-full border border-emerald-400/40 px-5 py-1 text-[11px] uppercase tracking-[0.45em] text-emerald-200">
            СЌС‚РёС‡РЅРѕРµ СѓРґР°Р»РµРЅРёРµ
          </span>
          <h2 className="text-4xl font-bold leading-tight text-slate-50 lg:text-5xl">
            РџРѕРЅРёРјР°РµРј, РѕС‚РєСѓРґР° РїСЂРёС…РѕРґСЏС‚ СѓС‚РµС‡РєРё, Рё Р±РµСЂРµР¶РЅРѕ Р·Р°РєСЂС‹РІР°РµРј РёС… РёСЃС‚РѕС‡РЅРёРєРё
          </h2>
          <p className="text-base text-slate-300">
            РњС‹ СЃРѕРµРґРёРЅСЏРµРј СЃРёРіРЅР°Р»С‹ РѕС‚ РїСЂРѕРІРµСЂРµРЅРЅС‹С… РёСЃС‚РѕС‡РЅРёРєРѕРІ СЃ РІРЅСѓС‚СЂРµРЅРЅРёРјРё РїСЂРѕС‚РѕРєРѕР»Р°РјРё DataTrace, С‡С‚РѕР±С‹ Р±С‹СЃС‚СЂРѕ РЅР°С…РѕРґРёС‚СЊ Рё СѓРґР°Р»СЏС‚СЊ РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ Р±РµР· СѓС‡Р°СЃС‚РёСЏ С‚РµРЅРµРІС‹С… СЃС…РµРј.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-8">
            {dataSources.map((source, index) => (
              <div key={source.code} className="group relative flex items-start justify-end gap-6">
                <div className="hidden relative h-px w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-l from-emerald-400/70 to-transparent lg:block">
                  <span
                    className="trace-line"
                    style={{ animationDelay: `${index * 0.6}s` }}
                  />
                </div>
                <div className="max-w-sm text-right">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-300/80">{source.code}</p>
                  <p className="mt-2 text-lg text-slate-100">{source.label}</p>
                  <p className="mt-2 text-sm text-slate-400">{source.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute h-[340px] w-[340px] rounded-[2.5rem] border border-emerald-500/30 bg-black/40 backdrop-blur-md shadow-[0_0_60px_rgba(34,197,94,0.18)]" />
            <div className="absolute h-[420px] w-[420px] rounded-full border border-emerald-500/10 blur-sm" />
            <div className="absolute h-[480px] w-[480px] rounded-full border border-emerald-500/5" />
            <div className="relative z-10 flex flex-col items-center gap-3 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/50 bg-black/60">
                <ShieldCheck className="h-10 w-10 text-emerald-400" strokeWidth={1.3} />
              </div>
              <p className="text-[11px] uppercase tracking-[0.5em] text-emerald-200/80">datatrace</p>
              <p className="text-base font-semibold text-slate-100">Р­С‚РёС‡РЅРѕРµ СѓРґР°Р»РµРЅРёРµ</p>
              <div className="mt-4 grid gap-1 text-[11px] text-emerald-200/70">
                <p>Р–СѓСЂРЅР°Р» РґРµР№СЃС‚РІРёР№ вЂў РЁРёС„СЂРѕРІР°РЅРёРµ вЂў SLA 24/7</p>
                <p>РљРѕРЅС‚СЂРѕР»СЊ РїРѕРІС‚РѕСЂРЅС‹С… РїРѕСЏРІР»РµРЅРёР№</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {dataDestinations.map((item, index) => (
              <div key={item.code} className="group relative flex items-start gap-6">
                <div className="max-w-sm">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-300/80">{item.code}</p>
                  <p className="mt-2 text-lg text-slate-100">{item.label}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                </div>
                <div className="hidden relative h-px w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-emerald-400/70 to-transparent lg:block">
                  <span
                    className="trace-line"
                    style={{ animationDelay: `${index * 0.6 + 0.3}s` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          {legend.map((item) => (
            <span key={item} className="inline-flex items-center gap-3 rounded-full border border-emerald-400/40 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-lime-200" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .noise-mask {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
        }
        .grid-overlay {
          background-image:
            linear-gradient(to right, rgba(78, 247, 170, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(78, 247, 170, 0.08) 1px, transparent 1px);
          background-size: 36px 36px;
          mix-blend-mode: lighten;
        }
        .bg-radial {
          background: radial-gradient(circle at center, rgba(34, 197, 94, 0.22), transparent 55%);
        }
        .trace-line {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.85), transparent);
          animation: sweep 3.4s linear infinite;
        }
        @keyframes sweep {
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

    // Р•СЃР»Рё Р°РІС‚РѕСЂРёР·РѕРІР°РЅ, РѕС‚РєСЂС‹РІР°РµРј СЃСЃС‹Р»РєСѓ РЅР° РѕРїР»Р°С‚Сѓ
    const successUrl = encodeURIComponent(`https://www.datatrace.tech/redirect?plan=${plan}`)
    
    if (plan === 'basic') {
      // Р‘Р°Р·РѕРІС‹Р№ С‚Р°СЂРёС„ - 350в‚Ѕ
      window.location.href = `https://self.payanyway.ru/17573877087686?MNT_SUCCESS_URL=${successUrl}&productPrice=350`
    } else if (plan === 'professional-6m') {
      // РџСЂРѕС„РµСЃСЃРёРѕРЅР°Р»СЊРЅС‹Р№ 6 РјРµСЃСЏС†РµРІ - 5000в‚Ѕ
      window.location.href = `https://self.payanyway.ru/1757389094772?MNT_SUCCESS_URL=${successUrl}&productPrice=5000`
    } else if (plan === 'professional-12m') {
      // РџСЂРѕС„РµСЃСЃРёРѕРЅР°Р»СЊРЅС‹Р№ 12 РјРµСЃСЏС†РµРІ - 8500в‚Ѕ
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
                Р“Р›РђР’РќРђРЇ
              </Link>
              <div 
                className="relative"
                onMouseEnter={() => setShowSolutionsDropdown(true)}
                onMouseLeave={() => setShowSolutionsDropdown(false)}
              >
                <button className="text-sm font-medium text-gray-700 hover:text-black flex items-center">
                  Р Р•РЁР•РќРРЇ
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
                        РћР±РЅР°СЂСѓР¶РµРЅРёРµ Рё СѓРґР°Р»РµРЅРёРµ СЃРєРѕРјРїСЂРѕРјРµС‚РёСЂРѕРІР°РЅРЅРѕР№ Р»РёС‡РЅРѕР№ РёРЅС„РѕСЂРјР°С†РёРё
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
                        РњРѕРЅРёС‚РѕСЂРёРЅРі РіР»СѓР±РёРЅРЅРѕРіРѕ РёРЅС‚РµСЂРЅРµС‚Р° Рё РґР°СЂРєРЅРµС‚Р°
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
                РўРђР РР¤Р«
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-black">
                Р‘Р›РћР“
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
                РљРћРќРўРђРљРўР«
              </Link>
            </nav>
            <Button
              onClick={handleDashboardClick}
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white bg-transparent"
              disabled={isLoading}
            >
              {isLoading ? "..." : isAuthenticated ? "Р›РР§РќР«Р™ РљРђР‘РРќР•Рў" : "Р’РћР™РўР"}
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
                  РР-РїР»Р°С‚С„РѕСЂРјР° РґР»СЏ РїРѕРёСЃРєР° Рё СѓРґР°Р»РµРЅРёСЏ СЃРєРѕРјРїСЂРѕРјРµС‚РёСЂРѕРІР°РЅРЅРѕР№ Р»РёС‡РЅРѕР№ РёРЅС„РѕСЂРјР°С†РёРё
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
                  {"РЈР—РќРђРўР¬ РџРћР”Р РћР‘РќР•Р•"}
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
                DataTrace РїСЂРµРґСЃС‚Р°РІР»СЏРµС‚ РїР»Р°С‚С„РѕСЂРјСѓ РЅР° РѕСЃРЅРѕРІРµ РёСЃРєСѓСЃСЃС‚РІРµРЅРЅРѕРіРѕ РёРЅС‚РµР»Р»РµРєС‚Р° Рё СѓРЅРёРєР°Р»СЊРЅС‹С… С‚РµС…РЅРёС‡РµСЃРєРёС… СЂРµС€РµРЅРёР№, РєРѕС‚РѕСЂР°СЏ РїРѕР·РІРѕР»СЏРµС‚ РЅР°С€РёРј РєР»РёРµРЅС‚Р°Рј РѕР±РЅР°СЂСѓР¶РёС‚СЊ, СѓРґР°Р»РёС‚СЊ Рё РјРѕРЅРёС‚РѕСЂРёС‚СЊ РІ СЂРµР¶РёРјРµ СЂРµР°Р»СЊРЅРѕРіРѕ РІСЂРµРјРµРЅРё СЃРєРѕРјРїСЂРѕРјРµС‚РёСЂРѕРІР°РЅРЅСѓСЋ (СѓРєСЂР°РґРµРЅРЅСѓСЋ) Р»РёС‡РЅСѓСЋ РёРЅС„РѕСЂРјР°С†РёСЋ РёР· Р±Р°Р· РґР°РЅРЅС‹С… Р·Р»РѕСѓРјС‹С€Р»РµРЅРЅРёРєРѕРІ.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">РђРЅР°Р»РёР· РґР°РЅРЅС‹С… РёР· РѕС‚РєСЂС‹С‚С‹С… РёСЃС‚РѕС‡РЅРёРєРѕРІ</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">РђРЅР°Р»РёР· РґР°РЅРЅС‹С… РёР· РіР»СѓР±РёРЅРЅРѕРіРѕ РёРЅС‚РµСЂРЅРµС‚Р° Рё РґР°СЂРєРЅРµС‚Р°</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">РњРѕРЅРёС‚РѕСЂРёРЅРі Р»РёС‡РЅРѕР№ РёРЅС„РѕСЂРјР°С†РёРё</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">Р’С‹СЏРІР»РµРЅРёРµ Рё РѕС†РµРЅРєР° РЅРµРіР°С‚РёРІРЅС‹С… СЃС†РµРЅР°СЂРёРµРІ</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                <p className="text-gray-700">РџСЂРѕС‚РёРІРѕРґРµР№СЃС‚РІРёРµ С„РёС€РёРЅРіСѓ Рё РІС‚РѕСЂРёС‡РЅС‹Рј Р°С‚Р°РєР°Рј</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Solutions Section */}
      <section id="solutions" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="inline-block bg-black text-white px-4 py-2 text-sm font-medium">Р Р•РЁР•РќРРЇ</div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-black mb-4">01</div>
                <h3 className="text-2xl font-bold text-black mb-6">РђРЅР°Р»РёС‚РёС‡РµСЃРєРёР№ РјРѕРґСѓР»СЊ</h3>
                <p className="text-gray-700 mb-8">
                  РђРЅР°Р»РёС‚РёС‡РµСЃРєРёР№ РјРѕРґСѓР»СЊ DataTrace РёС‰РµС‚ СѓС‚РµС‡РєРё РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С… РїРѕ РІСЃРµРј РґРѕСЃС‚СѓРїРЅС‹Рј РёСЃС‚РѕС‡РЅРёРєР°Рј Рё
                  РїСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚ РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊ РёС… РїРѕР»РЅРѕРіРѕ СѓРґР°Р»РµРЅРёСЏ СЃ РїРѕСЃР»РµРґСѓСЋС‰РёРј РјРѕРЅРёС‚РѕСЂРёРЅРіРѕРј.
                </p>
                <Button variant="ghost" className="text-black hover:bg-black hover:text-white p-0">
                  РЈР—РќРђРўР¬ Р‘РћР›Р¬РЁР• <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-black mb-4">02</div>
                <h3 className="text-2xl font-bold text-black mb-6">РР РјРѕРґСѓР»СЊ</h3>
                <p className="text-gray-700 mb-8">
                  РР РјРѕРґСѓР»СЊ DataTrace Р°РЅР°Р»РёР·РёСЂСѓРµС‚ СЂРµРїСѓС‚Р°С†РёСЋ РІ РёРЅС‚РµСЂРЅРµС‚Рµ РЅР° РѕСЃРЅРѕРІРµ Р±РѕР»СЊС€РёС… РґР°РЅРЅС‹С…, РїСЂРµРґРѕСЃС‚Р°РІР»СЏСЏ
                  РєРѕРјРїР»РµРєСЃРЅСѓСЋ РѕС†РµРЅРєСѓ С†РёС„СЂРѕРІРѕРіРѕ СЃР»РµРґР° Рё СЂРµРїСѓС‚Р°С†РёРѕРЅРЅС‹С… СЂРёСЃРєРѕРІ.
                </p>
                <Button variant="ghost" className="text-black hover:bg-black hover:text-white p-0">
                  РЈР—РќРђРўР¬ Р‘РћР›Р¬РЁР• <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <DataFlowShowcase />

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="inline-block bg-black text-white px-4 py-2 text-sm font-medium">РўРђР РР¤Р«</div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">Р‘РђР—РћР’Р«Р™</h3>
                  <div className="text-4xl font-bold text-black mb-2">350в‚Ѕ</div>
                  <p className="text-gray-600">Р·Р° Р·Р°РїСЂРѕСЃ</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">1 РїСЂРѕРІРµСЂРєР° РІРєР»СЋС‡РµРЅР°</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РџРѕРёСЃРє РїРѕ РІСЃРµРј РёСЃС‚РѕС‡РЅРёРєР°Рј</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Р”РµС‚Р°Р»СЊРЅС‹Р№ РѕС‚С‡РµС‚ Рѕ РЅР°Р№РґРµРЅРЅС‹С… РґР°РЅРЅС‹С…</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РђРЅР°Р»РёР· СѓСЂРѕРІРЅСЏ РєРѕРјРїСЂРѕРјРµС‚Р°С†РёРё</p>
                  </div>
                </div>
                <Button
                  onClick={() => handlePlanSelect('basic')}
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black hover:text-white bg-transparent"
                >
                  Р’Р«Р‘Р РђРўР¬ РўРђР РР¤
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-black bg-gray-50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-black text-white px-4 py-1 text-sm font-medium rounded">РџРћРџРЈР›РЇР РќР«Р™</div>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">РџР РћР¤Р•РЎРЎРРћРќРђР›Р¬РќР«Р™</h3>
                  <p className="text-lg text-gray-700 mb-2">6 РјРµСЃСЏС†РµРІ</p>
                  <div className="text-4xl font-bold text-black mb-2">5 000в‚Ѕ</div>
                  <p className="text-gray-600">РµРґРёРЅРѕРІСЂРµРјРµРЅРЅРѕ</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">2 РїСЂРѕРІРµСЂРєРё РІРєР»СЋС‡РµРЅС‹</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РџРѕРёСЃРє РїРѕ РІСЃРµРј РёСЃС‚РѕС‡РЅРёРєР°Рј</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РЈРґР°Р»РµРЅРёРµ РёР· РІСЃРµС… РёСЃС‚РѕС‡РЅРёРєРѕРІ</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РњРѕРЅРёС‚РѕСЂРёРЅРі СѓС‚РµС‡РµРє 6 РјРµСЃСЏС†РµРІ</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РЈРІРµРґРѕРјР»РµРЅРёСЏ Рѕ РЅРѕРІС‹С… СѓС‚РµС‡РєР°С…</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Р”РµС‚Р°Р»СЊРЅС‹Рµ РѕС‚С‡РµС‚С‹</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handlePlanSelect('professional-6m')}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  Р’Р«Р‘Р РђРўР¬ РўРђР РР¤
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-black transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">РџР РћР¤Р•РЎРЎРРћРќРђР›Р¬РќР«Р™</h3>
                  <p className="text-lg text-gray-700 mb-2">12 РјРµСЃСЏС†РµРІ</p>
                  <div className="text-4xl font-bold text-black mb-2">8 500в‚Ѕ</div>
                  <p className="text-gray-600">РµРґРёРЅРѕРІСЂРµРјРµРЅРЅРѕ</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">2 РїСЂРѕРІРµСЂРєРё РІРєР»СЋС‡РµРЅС‹</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РџРѕРёСЃРє РїРѕ РІСЃРµРј РёСЃС‚РѕС‡РЅРёРєР°Рј</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РЈРґР°Р»РµРЅРёРµ РёР· РІСЃРµС… РёСЃС‚РѕС‡РЅРёРєРѕРІ</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РњРѕРЅРёС‚РѕСЂРёРЅРі СѓС‚РµС‡РµРє 12 РјРµСЃСЏС†РµРІ</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РЈРІРµРґРѕРјР»РµРЅРёСЏ Рѕ РЅРѕРІС‹С… СѓС‚РµС‡РєР°С…</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-black mt-1 flex-shrink-0" />
                    <p className="text-gray-700">РџСЂРёРѕСЂРёС‚РµС‚РЅР°СЏ РїРѕРґРґРµСЂР¶РєР°</p>
                  </div>
                </div>
                <Button
                  onClick={() => handlePlanSelect('professional-12m')}
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black hover:text-white bg-transparent"
                >
                  Р’Р«Р‘Р РђРўР¬ РўРђР РР¤
                </Button>
              </CardContent>
            </Card>


          </div>
        </div>
      </section>

      {/* Contacts Section */}
      <section id="contacts" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">РћСЃС‚Р°Р»РёСЃСЊ РІРѕРїСЂРѕСЃС‹?</h2>
          <p className="text-xl text-gray-600 mb-12">
            РњС‹ РіРѕС‚РѕРІС‹ РїРѕРјРѕС‡СЊ! РЎРІСЏР¶РёС‚РµСЃСЊ СЃ РЅР°РјРё Р»СЋР±С‹Рј СѓРґРѕР±РЅС‹Рј СЃРїРѕСЃРѕР±РѕРј
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-black text-white p-4 rounded-full">
                  <Mail className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">РќР°РїРёС€РёС‚Рµ РЅР°Рј</h3>
              <p className="text-gray-600 mb-6">
                РћС‚РїСЂР°РІСЊС‚Рµ РІР°С€ РІРѕРїСЂРѕСЃ РЅР° РїРѕС‡С‚Сѓ РїРѕРґРґРµСЂР¶РєРё, Рё РјС‹ РѕС‚РІРµС‚РёРј РІ С‚РµС‡РµРЅРёРµ 24 С‡Р°СЃРѕРІ
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Telegram РїРѕРґРґРµСЂР¶РєР°</h3>
              <p className="text-gray-600 mb-6">
                РЎРІСЏР¶РёС‚РµСЃСЊ СЃ РЅР°РјРё РІ Telegram РґР»СЏ Р±С‹СЃС‚СЂРѕРіРѕ РїРѕР»СѓС‡РµРЅРёСЏ РѕС‚РІРµС‚Р° РЅР° РІР°С€Рё РІРѕРїСЂРѕСЃС‹
              </p>
              <a
                href="https://t.me/datatrace_support_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                РќР°РїРёСЃР°С‚СЊ РІ Telegram
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
                РџРѕРґРїРёС€РёСЃСЊ РЅР° РЅР°С€ Р±Р»РѕРі
              </p>
              <div className="flex space-x-4">
                <input
                  type="email"
                  placeholder="Р’Р°С€ email Р·РґРµСЃСЊ"
                  className="bg-gray-800 text-white px-4 py-2 rounded flex-1"
                />
                <Button className="bg-white text-black hover:bg-gray-200">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">РљРћРњРџРђРќРРЇ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Р‘Р»РѕРі
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    РљРѕРЅС‚Р°РєС‚С‹
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Р Р•РЁР•РќРРЇ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    РћР±РЅР°СЂСѓР¶РµРЅРёРµ Рё СѓРґР°Р»РµРЅРёРµ СЃРєРѕРјРїСЂРѕРјРµС‚РёСЂРѕРІР°РЅРЅРѕР№ Р»РёС‡РЅРѕР№ РёРЅС„РѕСЂРјР°С†РёРё
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    РњРѕРЅРёС‚РѕСЂРёРЅРі РіР»СѓР±РёРЅРЅРѕРіРѕ РёРЅС‚РµСЂРЅРµС‚Р° Рё РґР°СЂРєРЅРµС‚Р°
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">РљРћРќРўРђРљРўР«</h4>
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
              <p className="text-gray-400 text-sm">DataTrace 2025 В© Р’СЃРµ РїСЂР°РІР° Р·Р°С‰РёС‰РµРЅС‹</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="#" className="text-gray-400 hover:text-white text-sm">
                  РџРѕР»РёС‚РёРєР° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white text-sm">
                  РЎРѕРіР»Р°С€РµРЅРёРµ РѕР± РѕР±СЂР°Р±РѕС‚РєРµ РґР°РЅРЅС‹С…
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* РњРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ Р°РІС‚РѕСЂРёР·Р°С†РёРё */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-center">РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ</h3>
            <p className="text-gray-600 mb-6 text-center">
              Р”Р»СЏ РїРѕРєСѓРїРєРё С‚Р°СЂРёС„Р° РЅРµРѕР±С…РѕРґРёРјРѕ РІРѕР№С‚Рё РІ Р°РєРєР°СѓРЅС‚ РёР»Рё Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ.
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={() => {
                  setShowAuthModal(false)
                  router.push('/login')
                }}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Р’РѕР№С‚Рё
              </Button>
              <Button 
                onClick={() => {
                  setShowAuthModal(false)
                  router.push('/register')
                }}
                variant="outline"
                className="flex-1 border-black text-black hover:bg-black hover:text-white"
              >
                Р РµРіРёСЃС‚СЂР°С†РёСЏ
              </Button>
            </div>
            <Button 
              onClick={() => setShowAuthModal(false)}
              variant="ghost"
              className="w-full mt-3 text-gray-500 hover:text-gray-700"
            >
              РћС‚РјРµРЅР°
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

