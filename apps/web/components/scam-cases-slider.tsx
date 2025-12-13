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
import { Button } from "@/components/ui/button"
import { ArrowRight, ExternalLink, ShieldAlert } from "lucide-react"

type ScamCase = {
  id: number
  category: string
  title: string
  description: string
  link: string
}

const scamCases: ScamCase[] = [
  {
    id: 1,
    category: "Частные лица",
    title: "Пенсионерка и 26 тысяч звонков",
    description: "Злоумышленники несколько месяцев звонили 65‑летней жительнице Дагестана десятки тысяч раз, чередуя номера и легенды, рассчитывая «продавить» её на перевод денег под видом защиты счета. Похожим образом абоненту из Пензы за день прилетело 22 850 звонков, а москвичке — 3 539 звонков за два часа.",
    link: "https://ura.news/news/1053005902"
  },
  {
    id: 2,
    category: "Частные лица",
    title: "Потеря денег и лавина договоров",
    description: "Жительница Москвы поверила «сотруднику оператора связи», перевела деньги на «продление договора», а потом была вынуждена продавать имущество; суммарно потеряла свыше 200 тыс. руб. В другом кейсе женщина через МФЦ восстановила профиль, но мошенники успели оформить от её имени три договора с операторами связи и подать десять заявок на микрозаймы.",
    link: "https://www.garant.ru/article/1814213/"
  },
  {
    id: 3,
    category: "Бизнес и предприниматели",
    title: "Предприниматель лишился 7,2 млн рублей",
    description: "Мошенники представились сотрудниками банка, убедили предпринимателя, что его счёта пытаются взломать, и предложили перевести деньги на «безопасный» счёт. Он выполнил все инструкции, после чего увидел серию списаний; прямые потери превысили 6 млн руб., а с комиссиями — около 7,2 млн.",
    link: "https://mspmo.ru/public/ulovki-moshennikov-dlya-obmana-predprinimateley/"
  },
  {
    id: 4,
    category: "Бизнес и предприниматели",
    title: "8 млн по фейковому счёту партнёра",
    description: "Компания получила счёт, который был очень похож на обычный счёт постоянного контрагента, но реквизиты принадлежали другому ИП, а почта отправителя отличалась всего несколькими символами. Перевод сделали без дополнительной проверки — только потом заметили подмену, общая сумма убытков составила 8 млн рублей.",
    link: "https://mspmo.ru/public/ulovki-moshennikov-dlya-obmana-predprinimateley/"
  },
  {
    id: 5,
    category: "Кейсы на стыке утечек и мошенничества",
    title: "Массовые последствия утечек для обычных людей",
    description: "Опросы 2025 года показывают: 81% респондентов после утечки своих данных сталкивались с звонками мошенников, 39% — со взломом соцсетей, а 5–6% — с взломом банковских приложений и прямыми финансовыми потерями. Утечка (телефон, e‑mail, ФИО) конвертируется в звонки, фишинг и попытки угнать деньги.",
    link: "https://lenta.ru/news/2025/10/16/nazvany-naibolee-chastye-posledstviya-utechek-dannyh-rossiyan/"
  },
  {
    id: 6,
    category: "Кейсы на стыке утечек и мошенничества",
    title: "Вредонос «Мамонт» из Telegram",
    description: "Группа из Саратовской области распространяла через Telegram «полезные приложения» и видеофайлы, которые на самом деле были вредоносом «Мамонт». После заражения устройства злоумышленники перехватывали СМС‑коды от банков и в автоматическом режиме очищали счета жертв.",
    link: "https://secpost.ru/vzyat-czifrovoj-sled-kak-raskryvayut-kiberprestupleniya-v-rossii-v-2025-godu/"
  }
]

export function ScamCasesSlider() {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-red-100 text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Реальные истории</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Краткая сводка инцидентов, показывающая последствия действий мошенников и утечек данных.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {scamCases.map((item) => (
                <CarouselItem key={item.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/2">
                  <div className="p-1 h-full">
                    <Card className="h-full border-2 border-gray-100 hover:border-red-200 transition-colors flex flex-col">
                      <CardHeader>
                        <div className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">
                          {item.category}
                        </div>
                        <CardTitle className="text-xl mb-2 line-clamp-2">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col justify-between">
                        <p className="text-gray-600 mb-6 line-clamp-6 text-sm leading-relaxed">
                          {item.description}
                        </p>
                        <Button variant="outline" className="w-full sm:w-auto self-start group" asChild>
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            Читать полностью
                            <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  )
}
