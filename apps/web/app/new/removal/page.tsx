"use client"

import { ChangeEvent, FormEvent, ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  Phone,
  CheckCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Lock,
  Fingerprint,
  Mail
} from "lucide-react"

type FormState = {
  name: string
  phone: string
  email: string
  message: string
}

const initialFormState: FormState = {
  name: "",
  phone: "",
  email: "",
  message: ""
}

const dataPoints: Array<{ icon: ReactNode; title: string; detail: string }> = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Паспортные данные",
    detail: "Серия и номер паспорта позволяют мошенникам оформлять кредиты и микрозаймы."
  },
  {
    icon: <Fingerprint className="h-6 w-6" />,
    title: "ИНН и СНИЛС",
    detail: "Комбинация этих номеров открывает доступ к государственным сервисам и личным кабинетам."
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Номер телефона",
    detail: "Через постоянные звонки злоумышленники втираются в доверие и выманивают деньги."
  }
]

const threatScenarios = [
  "Звонят от имени «службы безопасности банка», пугают фиктивными операциями и убеждают взять кредит.",
  "Общаются неделями, узнают семейные обстоятельства и используют их, чтобы получить доверие.",
  "Оформляют займы или подписки на ваше имя, после чего долг начинают требовать с вас.",
  "Создают копии профилей в соцсетях, чтобы запросить деньги у ваших родственников."
]

const serviceSteps = [
  {
    number: "1",
    title: "Анализ утечек",
    description: "Проверяем открытые источники, базы и соцсети, где могли оказаться ваши данные."
  },
  {
    number: "2",
    title: "Удаление и блокировка",
    description: "Удаляем найденные сведения, подаём обращения в сервисы и ограничиваем доступ."
  },
  {
    number: "3",
    title: "Отчёт и рекомендации",
    description: "Присылаем подробный отчёт и объясняем, как защититься от новых утечек и звонков."
  }
]

const supportHighlights = [
  "Помогаем оформить заявление в банк или полицию, если уже успели навязать кредит.",
  "Подключаем мониторинг: мгновенно сообщаем, если ваши данные снова появятся в сети.",
  "Обучаем распознавать типичные сценарии общения мошенников, чтобы звонки больше не пугали."
]

export default function PersonalRemovalLanding() {
  const [formData, setFormData] = useState<FormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setIsSubmitted(false)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSubmitted(true)
      setFormData(() => ({ ...initialFormState }))
    } catch (error) {
      console.error("Ошибка при отправке формы", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setIsSubmitted(false)
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleScrollToForm = () => {
    if (typeof window === "undefined") {
      return
    }
    document.getElementById("removal-request")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-gray-900">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-10 w-10 text-emerald-600" />
            <div>
              <p className="text-2xl font-semibold text-gray-900">DataTrace</p>
              <p className="text-sm text-gray-500">Персональное удаление данных из сети</p>
            </div>
          </div>
          <div className="text-sm sm:text-right">
            <p className="text-lg font-semibold text-emerald-700">8 (800) 555-0123</p>
            <p className="text-gray-500">Ежедневно с 9:00 до 21:00 (мск)</p>
          </div>
        </div>
      </header>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-semibold leading-tight text-gray-900 md:text-5xl">
            Защитите себя от навязчивых звонков и мошенников
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-gray-700">
            DataTrace помогает в спокойной обстановке удалить ваши данные из открытых источников и объясняет,
            как не поддаться на уговоры «службы безопасности» и других злоумышленников.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={handleScrollToForm}
              className="rounded-full bg-emerald-600 px-8 py-6 text-lg font-medium text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"
            >
              Оставить заявку на удаление
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Расскажем, где именно нашли ваши сведения, и свяжемся только в удобное для вас время.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900">Какие данные утекают чаще всего</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Даже единичная утечка документов может стоить дорого: достаточно нескольких цифр, чтобы
                злоумышленник представился сотрудником банка или оформил кредит.
              </p>
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-6 w-6 text-emerald-600" />
                  <p className="text-base leading-relaxed text-emerald-900">
                    Если вам уже звонят, значит данные попали в слитые базы и продаются десяткам колл-центров.
                    Мы находим источник и добиваемся удаления.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {dataPoints.map(item => (
                <Card key={item.title} className="border-emerald-100 bg-white shadow-sm">
                  <CardHeader className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      {item.icon}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-gray-600">{item.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold text-gray-900">Что делают мошенники</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-lg leading-relaxed text-gray-600">
            Основная цель звонящих — вывести вас из равновесия, заставить торопиться и принять решение на эмоциях.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {threatScenarios.map(scenario => (
              <Card key={scenario} className="border-emerald-100 bg-white shadow-sm">
                <CardContent className="flex gap-4 py-6">
                  <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-emerald-600" />
                  <p className="text-base leading-relaxed text-gray-600">{scenario}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-50/80 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold text-gray-900">Как работает DataTrace</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-lg leading-relaxed text-gray-600">
            Сочетаем поиск по автоматическим системам и работу экспертов. Все результаты объясняем простым языком,
            без технического жаргона и лишней тревоги.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {serviceSteps.map(step => (
              <Card key={step.number} className="border-emerald-100 bg-white/90 shadow-sm">
                <CardHeader className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-xl font-semibold text-white">
                    {step.number}
                  </span>
                  <CardTitle className="text-xl font-semibold text-gray-900">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {supportHighlights.map(point => (
              <div key={point} className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
                <CheckCircle className="mt-1 h-5 w-5 text-emerald-600" />
                <p className="text-base leading-relaxed text-gray-600">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20" id="removal-request">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">Получите персональную консультацию</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Мы подробно расскажем, где нашли ваши данные, и предложим конкретный план действий. Объясним, как
              реагировать на звонки, и при необходимости подключим юриста.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                <Shield className="mt-1 h-5 w-5 text-emerald-600" />
                <p className="text-base leading-relaxed text-gray-600">
                  Работаем строго конфиденциально и соблюдаем требования 152-ФЗ о персональных данных.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                <UserCheck className="mt-1 h-5 w-5 text-emerald-600" />
                <p className="text-base leading-relaxed text-gray-600">
                  Назначим ответственного специалиста, который будет сопровождать вас до полного удаления.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                <Mail className="h-5 w-5 text-emerald-600" />
                <div className="text-left">
                  <p className="text-sm text-gray-500">Если удобнее переписка</p>
                  <a href="mailto:info@datatrace.ru" className="text-lg font-medium text-emerald-700">
                    info@datatrace.ru
                  </a>
                </div>
              </div>
            </div>
          </div>
          <Card className="border-emerald-200 bg-white/90 shadow-lg shadow-emerald-100">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900">Заявка на удаление</CardTitle>
              <p className="text-base text-gray-600">
                Оставьте контакты — мы свяжемся в течение рабочего дня и согласуем удобное время разговора.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {isSubmitted && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <CheckCircle className="h-5 w-5" />
                  <AlertDescription>
                    Спасибо! Мы получили заявку и свяжемся с вами, чтобы уточнить детали и запланировать удаление.
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Ваше имя *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Например, Светлана Викторовна"
                    required
                    className="py-3 text-base"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Телефон *</label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+7 (900) 000-00-00"
                    required
                    className="py-3 text-base"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Электронная почта</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Если удобнее получить план действий письмом"
                    className="py-3 text-base"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Комментарий</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Расскажите, какие звонки или утечки беспокоят больше всего"
                    rows={4}
                    className="text-base"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-emerald-600 py-4 text-lg font-medium text-white transition hover:bg-emerald-700 disabled:bg-emerald-300"
                >
                  {isSubmitting ? "Отправляем..." : "Отправить заявку"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="bg-emerald-900 px-4 py-12 text-emerald-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-200" />
            <span className="text-2xl font-semibold">DataTrace</span>
          </div>
          <p className="max-w-3xl text-base text-emerald-100">
            Мы заботимся о безопасности ваших данных и остаёмся на связи на каждом этапе удаления. Задайте любой
            вопрос — объясним спокойно и без спешки.
          </p>
          <div className="flex flex-col items-center gap-2 text-lg font-medium sm:flex-row sm:gap-3">
            <Phone className="h-5 w-5 text-emerald-200" />
            <span>8 (800) 555-0123</span>
          </div>
          <p className="text-sm text-emerald-200">Работаем по всей России, отвечаем каждый день с 9:00 до 21:00</p>
        </div>
      </footer>
    </div>
  )
}
