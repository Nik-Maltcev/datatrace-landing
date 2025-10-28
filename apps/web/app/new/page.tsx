"use client"

import { ChangeEvent, FormEvent, ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Phone, CheckCircle, User, FileText, Lock, Mail } from "lucide-react"

const initialFormState = {
  name: "",
  phone: "",
  email: "",
  message: ""
}

export default function NewLandingPage() {
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const highlights = [
    "Выявляем скрытые риски по компаниям и индивидуальным предпринимателям",
    "Объясняем результаты без сложных терминов и профессионального жаргона",
    "Подсказываем, какие шаги предпринять после проверки, чтобы защитить сделку"
  ]

  const advantages: Array<{ title: string; description: string; icon: ReactNode }> = [
    {
      title: "Официальные источники",
      description: "Собираем данные из ФНС, арбитражных дел, ФСПП и других государственных реестров.",
      icon: <Shield className="h-6 w-6" />
    },
    {
      title: "Понятный язык",
      description: "Аналитик поясняет, что означают цифры в отчётах и какие решения подходят именно вашей ситуации.",
      icon: <User className="h-6 w-6" />
    },
    {
      title: "Актуальная картина",
      description: "Информация обновляется ежедневно, поэтому вы видите свежие сведения по контрагентам.",
      icon: <FileText className="h-6 w-6" />
    },
    {
      title: "Конфиденциальность",
      description: "Бережно храним ваши документы и соблюдаем требования 152-ФЗ о персональных данных.",
      icon: <Lock className="h-6 w-6" />
    }
  ]

  const steps = [
    {
      number: "1",
      title: "Расскажите о контрагенте",
      description: "Уточним сферу деятельности, условия сделки и договоримся о сроках проверки."
    },
    {
      number: "2",
      title: "Получите отчёт и пояснения",
      description: "Через 1–2 рабочих дня вы получите структурированный отчёт и разбор от аналитика."
    },
    {
      number: "3",
      title: "Примите уверенное решение",
      description: "Вы поймёте, стоит ли продолжать сделку, и получите рекомендации по следующему шагу."
    }
  ]

  const useCases = [
    "Вы заключаете долгосрочный контракт и хотите убедиться в надёжности партнёра.",
    "Планируете инвестицию и сомневаетесь, нет ли у компании скрытых долгов и судебных споров.",
    "Нужно объяснить совладельцам или совету директоров, почему сделку можно одобрить.",
    "Требуется быстро разобраться в отчётах, чтобы не тратить вечера на самостоятельный анализ."
  ]

  const consultationPoints = [
    "Разберём вашу ситуацию и подскажем, какие документы и данные стоит подготовить заранее.",
    "Покажем, как пользоваться отчётами самостоятельно и на что смотреть в первую очередь."
  ]

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
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-gray-900">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-10 w-10 text-emerald-600" />
            <div>
              <p className="text-2xl font-semibold text-gray-900">DataTrace</p>
              <p className="text-sm text-gray-500">Проверка контрагентов и сделок</p>
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
            Проверка партнёров и сделок с понятными выводами для вас
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-gray-700">
            DataTrace помогает собственникам, директорам и финансистам вовремя замечать риски контрагентов,
            чтобы сделки проходили спокойно и без неожиданных сюрпризов.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={handleScrollToForm}
              className="rounded-full bg-emerald-600 px-8 py-6 text-lg font-medium text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"
            >
              Получить консультацию
            </Button>
            <div className="flex items-center gap-3 rounded-full border border-emerald-200 bg-white px-5 py-3 shadow-sm">
              <Phone className="h-5 w-5 text-emerald-600" />
              <span className="text-lg font-medium text-emerald-700">8 (800) 555-0123</span>
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Объясним простыми словами, какие риски обнаружила система и что стоит предпринять дальше.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {highlights.map(item => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/80 px-5 py-4 text-left shadow-sm"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <span className="text-base leading-relaxed text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold text-gray-900">Почему DataTrace доверяют</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-lg leading-relaxed text-gray-600">
            Мы объединяем автоматический сбор данных и работу экспертов. Вы получаете понятную картину рисков
            и уверенность, что учли важные детали.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map(item => (
              <Card key={item.title} className="border-emerald-100 bg-emerald-50/70 shadow-none">
                <CardHeader className="items-center gap-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600 shadow">
                    {item.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold text-gray-900">Как проходит работа</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-lg leading-relaxed text-gray-600">
            Всё выстроено так, чтобы вам было комфортно: без сложных формулировок и лишних визитов в офис.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {steps.map(step => (
              <Card key={step.number} className="border-emerald-100 bg-white/80 shadow-sm">
                <CardHeader className="flex-row items-center gap-4">
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
        </div>
      </section>

      <section className="bg-emerald-50/80 px-4 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-semibold text-gray-900">Когда особенно полезен DataTrace</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">
            Наши клиенты — владельцы и руководители компаний, которые ценят спокойствие и уверенность в сделках.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {useCases.map(point => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-left shadow-sm"
              >
                <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <span className="text-base leading-relaxed text-gray-700">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="consultation" className="px-4 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">Получите бесплатную консультацию</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Оставьте контакты — специалист DataTrace свяжется в течение рабочего дня, задаст пару уточняющих
              вопросов и подскажет оптимальный формат проверки.
            </p>
            <div className="mt-6 space-y-4">
              {consultationPoints.map(point => (
                <div key={point} className="flex items-start gap-3 rounded-2xl bg-white/80 px-4 py-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-emerald-600" />
                  <p className="text-base leading-relaxed text-gray-600">{point}</p>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                <Mail className="h-5 w-5 text-emerald-600" />
                <div className="text-left">
                  <p className="text-sm text-gray-500">Пишите, если удобнее на почту</p>
                  <a href="mailto:info@datatrace.ru" className="text-lg font-medium text-emerald-700">
                    info@datatrace.ru
                  </a>
                </div>
              </div>
            </div>
          </div>
          <Card className="border-emerald-200 bg-white/90 shadow-lg shadow-emerald-100">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900">Оставьте заявку</CardTitle>
              <p className="text-base text-gray-600">
                Мы перезвоним или напишем в удобное время, чтобы обсудить вашу задачу.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {isSubmitted && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <CheckCircle className="h-5 w-5" />
                  <AlertDescription>
                    Спасибо! Мы получили вашу заявку и свяжемся с вами в ближайшее рабочее время.
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
                    placeholder="Например, Ольга Сергеевна"
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
                    placeholder="Если удобнее получить ответ письмом"
                    className="py-3 text-base"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Комментарий</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Расскажите, с какой задачей обращаетесь"
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
            Мы помогаем предпринимателям и руководителям принимать взвешенные решения. Наши специалисты всегда
            рядом, чтобы подсказать и поддержать.
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
