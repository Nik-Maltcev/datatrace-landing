"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { TrendingUp, AlertTriangle, Lock, Banknote } from "lucide-react"

export function CyberStatsSlider() {
  const stats = [
    {
      id: 1,
      icon: <TrendingUp className="w-8 h-8 text-emerald-600" />,
      title: "Рост киберпреступности",
      value: "+14.7%",
      description: "Рост числа киберпреступлений в РФ за 2024 год по данным МВД.",
      source: "МВД РФ"
    },
    {
      id: 2,
      icon: <Banknote className="w-8 h-8 text-red-600" />,
      title: "Финансовые потери",
      value: "156 млрд ₽",
      description: "Объем операций без согласия клиентов в 2023 году.",
      source: "ЦБ РФ"
    },
    {
      id: 3,
      icon: <Lock className="w-8 h-8 text-blue-600" />,
      title: "Утечки данных",
      value: "1.1 млрд",
      description: "Количество утекших записей персональных данных россиян в 2023 году.",
      source: "InfoWatch"
    },
    {
      id: 4,
      icon: <AlertTriangle className="w-8 h-8 text-orange-600" />,
      title: "Фишинговые ресурсы",
      value: "58 тыс.",
      description: "Заблокировано фишинговых сайтов за I полугодие 2024 года.",
      source: "Роскомнадзор"
    }
  ]

  return (
    <section className="py-12 bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-1 w-12 bg-black rounded-full"></div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">
            Статистика угроз
          </h2>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {stats.map((stat) => (
              <CarouselItem key={stat.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="border-none shadow-md bg-white h-full">
                    <CardContent className="p-6 flex flex-col items-start h-full">
                      <div className="mb-4 p-3 bg-gray-50 rounded-full">
                        {stat.icon}
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {stat.value}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {stat.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 flex-grow">
                        {stat.description}
                      </p>
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Источник: {stat.source}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </div>
        </Carousel>
      </div>
    </section>
  )
}
