"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Clock,
  Play,
  CheckCircle2,
  Phone,
  Mail,
  Bookmark,
  Sparkles,
  Copy,
  Check
} from "lucide-react"

type Lesson = {
  id: number
  title: string
  duration: string
  description: string
  videoUrl: string
  keyPoints: string[]
}

const lessons: Lesson[] = [
  {
    id: 1,
    title: "Почему появляются утечки и как их заметить вовремя",
    duration: "12:40",
    videoUrl: "https://drive.google.com/file/d/YOUR_FILE_ID_1/preview",
    description:
      "Разбираем, какие базы чаще всего попадают в открытый доступ, почему звонят «из банка» и где искать подтверждение утечки.",
    keyPoints: [
      "Основные источники утечек и чаты, где продают данные",
      "Как проверить, фигурирует ли ваш номер или паспорт в открытых базах",
      "Что делать в первые 24 часа после подозрительного звонка"
    ]
  },
  {
    id: 2,
    title: "Защищаем паспорт, СНИЛС и ИНН от повторных сливов",
    duration: "15:05",
    videoUrl: "https://drive.google.com/file/d/YOUR_FILE_ID_2/preview",
    description:
      "Объясняем, как ограничить распространение документов и какие заявления можно подать дистанционно, чтобы мошенники не успели взять кредит.",
    keyPoints: [
      "Где появляются копии документов и как их удалить",
      "Как заявить о компрометации паспорта и СНИЛС",
      "В каком случае стоит перевыпустить документы"
    ]
  },
  {
    id: 3,
    title: "Телефон под прицелом: учимся фильтровать звонки",
    duration: "11:32",
    videoUrl: "https://drive.google.com/file/d/YOUR_FILE_ID_3/preview",
    description:
      "Настраиваем фильтры и записные книжки, чтобы подозрительные номера блокировались автоматически, а важные вызовы не терялись.",
    keyPoints: [
      "Какие приложения помогают отсеивать мошенников",
      "Шаблоны ответов, которые быстро пресекают навязчивый разговор",
      "Как фиксировать звонки, чтобы при необходимости обратиться в банк или полицию"
    ]
  },
  {
    id: 4,
    title: "План действий, если навязали кредит или перевод",
    duration: "14:48",
    videoUrl: "https://drive.google.com/file/d/YOUR_FILE_ID_4/preview",
    description:
      "Пошагово разбираем, как отменить перевод, оспорить операцию в банке и подготовить заявление, если мошенники уже успели навредить.",
    keyPoints: [
      "Как разговаривать с банком и на что ссылаться",
      "Какие документы понадобятся для заявления",
      "Сроки, в которые важно успеть подать обращение"
    ]
  },
  {
    id: 5,
    title: "Настраиваем долгосрочную защиту данных",
    duration: "09:27",
    videoUrl: "https://drive.google.com/file/d/YOUR_FILE_ID_5/preview",
    description:
      "Формируем привычки кибергигиены: мониторинг утечек, безопасное хранение документов, контроль доступа к персональной информации.",
    keyPoints: [
      "Какие сервисы уведомят о новой утечке первыми",
      "Где безопасно хранить копии документов и пароли",
      "Как объяснить семье базовые правила цифровой безопасности"
    ]
  }
]

const promocode = "DATASAFE50"

export default function CoursePage() {
  const [currentLessonId, setCurrentLessonId] = useState(lessons[0]?.id ?? 1)
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set())
  const [isPromocodeCopied, setIsPromocodeCopied] = useState(false)

  const currentLesson = useMemo(
    () => lessons.find(lesson => lesson.id === currentLessonId) ?? lessons[0],
    [currentLessonId]
  )

  const totalLessons = lessons.length
  const completedCount = completedLessons.size
  const progress = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100)

  const toggleLessonCompletion = (lessonId: number) => {
    setCompletedLessons(prev => {
      const updated = new Set(prev)
      if (updated.has(lessonId)) {
        updated.delete(lessonId)
      } else {
        updated.add(lessonId)
      }
      return updated
    })
  }

  const handleSelectLesson = (lessonId: number) => {
    setCurrentLessonId(lessonId)
  }

  const handleCopyPromocode = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(promocode)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = promocode
        textarea.setAttribute("readonly", "")
        textarea.style.position = "absolute"
        textarea.style.left = "-9999px"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }

      setIsPromocodeCopied(true)
      setTimeout(() => setIsPromocodeCopied(false), 2500)
    } catch (error) {
      console.error("Не удалось скопировать промокод", error)
    }
  }

  const handleNextLesson = () => {
    const currentIndex = lessons.findIndex(lesson => lesson.id === currentLessonId)
    if (currentIndex < lessons.length - 1) {
      setCurrentLessonId(lessons[currentIndex + 1].id)
    }
  }

  const handlePreviousLesson = () => {
    const currentIndex = lessons.findIndex(lesson => lesson.id === currentLessonId)
    if (currentIndex > 0) {
      setCurrentLessonId(lessons[currentIndex - 1].id)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-gray-900">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
              <Shield className="h-4 w-4 text-emerald-600" />
              Практический курс DataTrace
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-gray-900 md:text-5xl">
              Как защититься от утечек и навязчивых звонков
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
              Пошаговая программа для предпринимателей и руководителей 45+, которая помогает вернуть контроль над
              персональными данными и уверенно реагировать на попытки мошенников.
            </p>
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-600">Прогресс курса</p>
            <p className="mt-3 text-4xl font-semibold text-gray-900">
              {progress}
              <span className="text-xl font-normal text-gray-500">%</span>
            </p>
            <Progress value={progress} className="mt-4 h-3 bg-emerald-100" />
            <p className="mt-3 text-sm text-gray-500">
              {completedCount} из {totalLessons} уроков отмечены как просмотренные.
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Скачайте чек-лист, чтобы отмечать прогресс в офлайн-формате.
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="grid gap-8 pt-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-8">
            <Card className="border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-2xl font-semibold text-gray-900">
                    Урок {currentLesson?.id}. {currentLesson?.title}
                  </CardTitle>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    <Clock className="mr-2 h-3.5 w-3.5" />
                    {currentLesson?.duration}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  Отметьте урок после просмотра, чтобы зафиксировать прогресс и открыть дополнительные материалы.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-video overflow-hidden rounded-xl border border-emerald-100 bg-gray-900">
                  <iframe
                    src={currentLesson?.videoUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentLesson?.title}
                  />
                </div>

                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                  <Bookmark className="h-4 w-4" />
                  <AlertDescription>
                    Замените ссылки вида <code>YOUR_FILE_ID_X</code> на ваши материалы Google Drive или YouTube.
                    После обновления страница автоматически подхватит новые уроки.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Что разберём</h2>
                    <p className="mt-2 text-base leading-relaxed text-gray-600">{currentLesson?.description}</p>
                  </div>
                  <ul className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm leading-relaxed text-gray-700 sm:grid-cols-2">
                    {currentLesson?.keyPoints.map(point => (
                      <li key={point} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Play className="h-4 w-4 text-emerald-600" />
                    Просмотрите видео до конца, затем отметьте урок.
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handlePreviousLesson} disabled={currentLessonId === lessons[0]?.id}>
                      Предыдущий урок
                    </Button>
                    <Button
                      onClick={() => toggleLessonCompletion(currentLessonId)}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {completedLessons.has(currentLessonId) ? "Снять отметку" : "Отметить просмотренным"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleNextLesson}
                      disabled={currentLessonId === lessons[lessons.length - 1]?.id}
                    >
                      Следующий урок
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-white/90">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Содержание курса</CardTitle>
                <p className="text-sm text-gray-500">
                  Выберите урок, чтобы посмотреть видео и ключевые рекомендации.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {lessons.map(lesson => {
                  const isActive = lesson.id === currentLessonId
                  const isCompleted = completedLessons.has(lesson.id)
                  return (
                    <button
                      type="button"
                      key={lesson.id}
                      onClick={() => handleSelectLesson(lesson.id)}
                      className={`w-full rounded-xl border px-5 py-4 text-left transition ${
                        isActive
                          ? "border-emerald-300 bg-emerald-50 shadow-sm"
                          : "border-emerald-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold text-gray-900">
                          Урок {lesson.id}. {lesson.title}
                        </p>
                        <span className="flex items-center gap-2 text-sm text-emerald-700">
                          <Clock className="h-3.5 w-3.5" />
                          {lesson.duration}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{lesson.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <CheckCircle2
                          className={`h-4 w-4 ${isCompleted ? "text-emerald-600" : "text-gray-300"}`}
                        />
                        {isCompleted ? "Отмечен как просмотренный" : "Ожидает просмотра"}
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-emerald-100 bg-white/90">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Поддержка эксперта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600">
                <p>
                  Если во время прохождения вам уже звонят мошенники, запишитесь на консультацию — обсудим план действий
                  и поможем подготовить обращения в банк.
                </p>
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    DataTrace работает конфиденциально: данные не передаются третьим лицам и защищены требованиями
                    152‑ФЗ.
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col gap-3 text-sm font-medium text-emerald-700">
                  <a href="tel:88005550123" className="flex items-center gap-2 hover:underline">
                    <Phone className="h-4 w-4" />
                    8 (800) 555-0123
                  </a>
                  <a href="mailto:info@datatrace.ru" className="flex items-center gap-2 hover:underline">
                    <Mail className="h-4 w-4" />
                    info@datatrace.ru
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/80">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Промокод слушателя</CardTitle>
                <p className="text-sm text-emerald-700">
                  Скидка 50% на персональное удаление данных при обращении в течение месяца после прохождения курса.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3">
                  <code className="text-lg font-semibold tracking-widest text-emerald-700">{promocode}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPromocode}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  >
                    {isPromocodeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {isPromocodeCopied && (
                  <p className="text-sm text-emerald-700">Промокод скопирован. Расскажите менеджеру, что прошли курс.</p>
                )}
                <p className="text-xs text-emerald-700">
                  Промокод действителен для новых обращений и не суммируется с другими акциями.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-white/90">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Что вы получите после курса</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  Понимание, какие данные могли утечь, и где проверить их появление.
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  Готовые шаблоны разговоров с «службой безопасности» и инструкции для банка.
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  Чек-лист по цифровой гигиене для вас и вашей команды.
                </p>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>

      <footer className="border-t border-emerald-100 bg-white/80 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-sm text-gray-600 sm:flex-row sm:justify-between sm:text-left">
          <p>
            DataTrace · Персональная защита данных. Мы рядом, чтобы поддержать вас и команду в любой ситуации с
            утечками.
          </p>
          <p className="text-gray-500">Работаем ежедневно с 9:00 до 21:00 (мск)</p>
        </div>
      </footer>
    </div>
  )
}
