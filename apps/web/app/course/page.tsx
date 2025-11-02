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
  Check,
  ArrowRight
} from "lucide-react"

type Question = {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

type Lesson = {
  id: number
  title: string
  duration: string
  description: string
  videoUrl: string
  keyPoints: string[]
  quiz?: Question[]
}

const lessons: Lesson[] = [
  {
    id: 1,
    title: "Почему утечки — не случайность и как защитить свои данные",
    duration: "12:40",
    videoUrl: "https://fs.getcourse.ru/fileservice/file/download/a/877480/sc/266/h/5c96e7c47eb2df8f59a8f334055a88bd.mp4",
    description:
      "Разбираем, почему утечки происходят не лично против вас, а массово, и с чего начать защиту. Узнаете, как проверить свои данные и быстро повысить уровень цифровой безопасности.",
    keyPoints: [
      "Как проверить, утекли ли ваши данные",
      "Зачем нужны уникальные пароли и 2FA",
      "Простые привычки цифровой гигиены"
    ],
    quiz: [
      {
        id: 1,
        question: "Почему злоумышленники совершают атаки?",
        options: [
          "Чтобы навредить лично вам",
          "Чтобы собрать данные как можно большего числа людей",
          "Чтобы протестировать системы безопасности"
        ],
        correctAnswer: 1
      },
      {
        id: 2,
        question: "Что первым делом стоит сделать, чтобы понять, есть ли риск утечек?",
        options: [
          "Сменить все пароли",
          "Проверить, какие данные уже могли попасть в сеть",
          "Удалить старые аккаунты"
        ],
        correctAnswer: 1
      },
      {
        id: 3,
        question: "Почему нельзя использовать один и тот же пароль для разных сайтов?",
        options: [
          "Потому что это неудобно",
          "Потому что пароли должны быть короткими",
          "Потому что утечка с одного сайта ставит под угрозу все аккаунты"
        ],
        correctAnswer: 2
      },
      {
        id: 4,
        question: "Что делает двухфакторная аутентификация?",
        options: [
          "Автоматически обновляет пароли",
          "Требует дополнительное подтверждение входа, даже если пароль известен злоумышленнику",
          "Отправляет уведомления о каждом входе"
        ],
        correctAnswer: 1
      },
      {
        id: 5,
        question: "Какой принцип цифровой гигиены помогает снизить риски утечек?",
        options: [
          "Оставлять как можно меньше личных данных там, где это не обязательно",
          "Использовать один аккаунт для всего",
          "Никогда не обновлять пароли"
        ],
        correctAnswer: 0
      }
    ]
  },
  {
    id: 2,
    title: "Защищаем паспорт, СНИЛС и ИНН от повторных сливов",
    duration: "15:05",
    videoUrl: "https://fs.getcourse.ru/fileservice/file/download/a/877480/sc/81/h/0d215b03e2f3807d34f4d33fd56212a7.mp4",
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
    videoUrl: "https://fs.getcourse.ru/fileservice/file/download/a/877480/sc/448/h/c58ae2c5cbde886fea54ed1ec74d493f.mp4",
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
    videoUrl: "https://fs.getcourse.ru/fileservice/file/download/a/877480/sc/364/h/0a81a5b0accf2eebd45e47c20183a9af.mp4",
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
    videoUrl: "https://fs.getcourse.ru/fileservice/file/download/a/877480/sc/142/h/2281b06f56e84eba3d850f1da23c9419.mp4",
    description:
      "Формируем привычки кибергигиены: мониторинг утечек, безопасное хранение документов, контроль доступа к персональной информации.",
    keyPoints: [
      "Какие сервисы уведомят о новой утечке первыми",
      "Где безопасно хранить копии документов и пароли",
      "Как объяснить семье базовые правила цифровой безопасности"
    ]
  },
  {
    id: 6,
    title: "Дополнительные материалы и практика",
    duration: "10:15",
    videoUrl: "https://fs.getcourse.ru/fileservice/file/download/a/877480/sc/387/h/e2c9a38ac5a4377ce4fdf6ba40d13f8f.mp4",
    description:
      "Закрепляем полученные знания на практических примерах и разбираем дополнительные кейсы защиты данных.",
    keyPoints: [
      "Разбор реальных случаев утечек и способов их предотвращения",
      "Практические упражнения по защите данных",
      "Ответы на частые вопросы слушателей курса"
    ]
  }
]

const promocode = "DATASAFE50"
const completionPromocode = "DATATR50"

export default function CoursePage() {
  const [currentLessonId, setCurrentLessonId] = useState(lessons[0]?.id ?? 1)
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set())
  const [passedQuizzes, setPassedQuizzes] = useState<Set<number>>(new Set())
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<{[key: number]: number}>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [isPromocodeCopied, setIsPromocodeCopied] = useState(false)
  const [isCompletionPromocodeCopied, setIsCompletionPromocodeCopied] = useState(false)

  const currentLesson = useMemo(
    () => lessons.find(lesson => lesson.id === currentLessonId) ?? lessons[0],
    [currentLessonId]
  )

  const totalLessons = lessons.length
  const completedCount = completedLessons.size
  const progress = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100)

  const toggleLessonCompletion = (lessonId: number) => {
    const lesson = lessons.find(l => l.id === lessonId)
    if (lesson?.quiz && !passedQuizzes.has(lessonId)) {
      setShowQuiz(true)
    } else {
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
  }

  const handleQuizAnswer = (questionId: number, answerIndex: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleQuizSubmit = () => {
    const lesson = lessons.find(l => l.id === currentLessonId)
    if (!lesson?.quiz) return

    setQuizSubmitted(true)
    setPassedQuizzes(prev => new Set([...prev, currentLessonId]))
    setCompletedLessons(prev => new Set([...prev, currentLessonId]))
  }

  const handleCloseQuiz = () => {
    setShowQuiz(false)
    setQuizAnswers({})
    setQuizSubmitted(false)
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

  const handleCopyCompletionPromocode = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(completionPromocode)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = completionPromocode
        textarea.setAttribute("readonly", "")
        textarea.style.position = "absolute"
        textarea.style.left = "-9999px"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }

      setIsCompletionPromocodeCopied(true)
      setTimeout(() => setIsCompletionPromocodeCopied(false), 2500)
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
              Практический курс для тех, кто хочет понять, какие данные могли утечь, где проверить их появление и как защитить себя от мошеннических звонков и действий.
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="grid gap-8 pt-12 lg:gap-6 xl:gap-8 lg:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)]">
          <div className="order-2 space-y-6 self-start lg:order-1">
            <Card className="border-emerald-100 bg-white/90 lg:sticky lg:top-24">
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

          <div className="order-1 space-y-8 lg:order-2">
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                      disabled={currentLessonId === lessons[lessons.length - 1]?.id || (currentLesson?.quiz && !quizSubmitted)}
                    >
                      Следующий урок
                    </Button>
                  </div>
                </div>

                {showQuiz && currentLesson?.quiz && (
                  <Card className="border-2 border-emerald-200 bg-emerald-50/30 mt-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl text-emerald-900">Тест по уроку {currentLessonId}</CardTitle>
                          <p className="text-gray-600 mt-2">Ответьте на все вопросы, чтобы завершить урок</p>
                        </div>
                        {quizSubmitted && (() => {
                          const correctCount = currentLesson.quiz!.filter(q => quizAnswers[q.id] === q.correctAnswer).length
                          const totalCount = currentLesson.quiz!.length
                          return (
                            <Badge 
                              variant="outline" 
                              className={`text-lg px-4 py-2 ${
                                correctCount === totalCount 
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-orange-500 bg-orange-50 text-orange-700'
                              }`}
                            >
                              {correctCount}/{totalCount}
                            </Badge>
                          )
                        })()}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {currentLesson.quiz.map((question, qIndex) => (
                        <div key={question.id} className="space-y-3">
                          <p className="font-semibold text-gray-900">
                            {qIndex + 1}. {question.question}
                          </p>
                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => {
                              const isSelected = quizAnswers[question.id] === oIndex
                              const isCorrect = question.correctAnswer === oIndex
                              const showResult = quizSubmitted
                              
                              return (
                                <label
                                  key={oIndex}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                                    showResult && isCorrect
                                      ? 'border-green-500 bg-green-50'
                                      : showResult && isSelected && !isCorrect
                                      ? 'border-red-500 bg-red-50'
                                      : isSelected
                                      ? 'border-emerald-500 bg-emerald-50'
                                      : 'border-gray-200 hover:border-emerald-300'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    checked={isSelected}
                                    onChange={() => !quizSubmitted && handleQuizAnswer(question.id, oIndex)}
                                    disabled={quizSubmitted}
                                    className="text-emerald-600"
                                  />
                                  <span className="flex-1">{option}</span>
                                  {showResult && isCorrect && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  )}
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {!quizSubmitted ? (
                        <Button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length !== currentLesson.quiz.length}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          Проверить ответы
                        </Button>
                      ) : (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => {
                              setQuizAnswers({})
                              setQuizSubmitted(false)
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Попробовать еще раз
                          </Button>
                          <Button
                            onClick={handleNextLesson}
                            disabled={currentLessonId === lessons[lessons.length - 1]?.id}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            Следующий урок
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>


        </section>

        {/* Congratulations Block */}
        {progress === 100 && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 shadow-2xl">
              <CardContent className="p-8 md:p-12">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
                    <Sparkles className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Поздравляем с прохождением курса!
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Вы успешно завершили все уроки и теперь знаете, как защитить свои данные от утечек и мошенников.
                  </p>
                  
                  <div className="bg-white rounded-2xl border-2 border-emerald-300 p-6 md:p-8 max-w-xl mx-auto shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Shield className="h-6 w-6 text-emerald-600" />
                      <h3 className="text-xl font-bold text-gray-900">Ваш подарок</h3>
                    </div>
                    <p className="text-gray-700 mb-6">
                      Получите <span className="font-bold text-emerald-600">скидку 50%</span> на профессиональный тариф DataTrace
                    </p>
                    <div className="flex items-center justify-center gap-3 bg-emerald-50 rounded-xl border border-emerald-200 px-6 py-4 mb-6">
                      <code className="text-2xl font-bold tracking-widest text-emerald-700">{completionPromocode}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCompletionPromocode}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      >
                        {isCompletionPromocodeCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </Button>
                    </div>
                    {isCompletionPromocodeCopied && (
                      <p className="text-sm text-emerald-700 mb-4">✅ Промокод скопирован!</p>
                    )}
                    <a 
                      href="https://datatrace.tech/payment" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block w-full"
                    >
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6">
                        Перейти к выбору тарифа
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </a>
                    <p className="text-xs text-gray-500 mt-4">
                      Промокод действителен в течение 30 дней с момента завершения курса
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
