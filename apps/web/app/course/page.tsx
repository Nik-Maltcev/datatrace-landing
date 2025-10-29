"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Lock, 
  Shield, 
  Clock,
  Gift,
  Copy,
  Check
} from "lucide-react"

interface VideoLesson {
  id: number
  title: string
  duration: number // в секундах
  videoUrl: string
  description: string
}

const lessons: VideoLesson[] = [
  {
    id: 1,
    title: "Что такое утечки данных и почему это опасно",
    duration: 180, // 3 минуты
    videoUrl: "/course-videos/lesson1.mp4",
    description: "Узнайте, как ваши данные попадают в руки мошенников"
  },
  {
    id: 2,
    title: "Как мошенники используют ваши данные",
    duration: 240, // 4 минуты
    videoUrl: "/course-videos/lesson2.mp4",
    description: "Разбираем схемы обмана и способы защиты"
  },
  {
    id: 3,
    title: "Признаки звонков мошенников",
    duration: 300, // 5 минут
    videoUrl: "/course-videos/lesson3.mp4",
    description: "Учимся распознавать подозрительные звонки"
  },
  {
    id: 4,
    title: "Что делать, если вам звонят мошенники",
    duration: 360, // 6 минут
    videoUrl: "/course-videos/lesson4.mp4",
    description: "Пошаговый алгоритм действий при подозрительном звонке"
  },
  {
    id: 5,
    title: "Как защитить свои данные в интернете",
    duration: 420, // 7 минут
    videoUrl: "/course-videos/lesson5.mp4",
    description: "Практические советы по защите персональной информации"
  }
]

export default function CoursePage() {
  const [currentLesson, setCurrentLesson] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set())
  const [watchedTime, setWatchedTime] = useState<{ [key: number]: number }>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPromocode, setShowPromocode] = useState(false)
  const [promocodeCopied, setPromocodeCopied] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0)
  const totalWatchedTime = Object.values(watchedTime).reduce((sum, time) => sum + time, 0)
  const progress = Math.min((totalWatchedTime / totalDuration) * 100, 100)

  const promocode = "DATASAFE50"

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const currentTime = Math.floor(videoRef.current.currentTime)
        const lessonId = lessons[currentLesson].id
        
        setWatchedTime(prev => ({
          ...prev,
          [lessonId]: Math.max(prev[lessonId] || 0, currentTime)
        }))

        // Отмечаем урок как завершенный, если просмотрено 80% или больше
        const lessonDuration = lessons[currentLesson].duration
        if (currentTime >= lessonDuration * 0.8) {
          setCompletedLessons(prev => new Set([...prev, lessonId]))
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentLesson])

  useEffect(() => {
    // Показываем промокод, если прогресс больше 90%
    if (progress >= 90 && !showPromocode) {
      setShowPromocode(true)
    }
  }, [progress, showPromocode])

  const handleVideoPlay = () => {
    setIsPlaying(true)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  const handleLessonSelect = (index: number) => {
    // Можно выбрать только первый урок или уже завершенные + следующий
    if (index === 0 || completedLessons.has(lessons[index - 1].id)) {
      setCurrentLesson(index)
      setIsPlaying(false)
    }
  }

  const copyPromocode = async () => {
    try {
      await navigator.clipboard.writeText(promocode)
      setPromocodeCopied(true)
      setTimeout(() => setPromocodeCopied(false), 2000)
    } catch (err) {
      console.error('Не удалось скопировать промокод:', err)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Курс по защите от мошенников</h1>
                <p className="text-sm text-gray-600">Научитесь защищать свои данные</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  Прогресс: {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="w-32" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Список уроков */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Уроки курса
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.has(lesson.id)
                  const isLocked = index > 0 && !completedLessons.has(lessons[index - 1].id)
                  const isCurrent = index === currentLesson
                  const watchedSeconds = watchedTime[lesson.id] || 0
                  const lessonProgress = Math.min((watchedSeconds / lesson.duration) * 100, 100)

                  return (
                    <div
                      key={lesson.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isCurrent 
                          ? 'border-blue-500 bg-blue-50' 
                          : isLocked 
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      onClick={() => handleLessonSelect(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : isLocked ? (
                            <Lock className="h-5 w-5 text-gray-400" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-blue-600" />
                          )}
                          <span className="text-sm font-medium">Урок {lesson.id}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatTime(lesson.duration)}
                        </Badge>
                      </div>
                      <h3 className={`text-sm font-medium mb-1 ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                        {lesson.title}
                      </h3>
                      <p className={`text-xs ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lesson.description}
                      </p>
                      {!isLocked && lessonProgress > 0 && (
                        <div className="mt-2">
                          <Progress value={lessonProgress} className="h-1" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Промокод */}
            {showPromocode && (
              <Card className="mt-6 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <Gift className="h-5 w-5 mr-2" />
                    Поздравляем!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700 mb-4">
                    Вы прошли курс! Получите скидку 50% на наши услуги:
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-3 py-2 rounded border text-lg font-mono font-bold text-green-800">
                      {promocode}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyPromocode}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      {promocodeCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {promocodeCopied && (
                    <p className="text-xs text-green-600 mt-2">Промокод скопирован!</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Видеоплеер */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Урок {lessons[currentLesson].id}: {lessons[currentLesson].title}</span>
                  <Badge variant="outline">
                    {formatTime(watchedTime[lessons[currentLesson].id] || 0)} / {formatTime(lessons[currentLesson].duration)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    poster="/course-videos/poster.jpg"
                  >
                    <source src={lessons[currentLesson].videoUrl} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      О чем этот урок
                    </h3>
                    <p className="text-gray-700">
                      {lessons[currentLesson].description}
                    </p>
                  </div>

                  {currentLesson === 0 && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Добро пожаловать на курс!</strong> Просматривайте уроки последовательно. 
                        Следующий урок откроется после завершения текущего.
                      </AlertDescription>
                    </Alert>
                  )}

                  {completedLessons.has(lessons[currentLesson].id) && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Урок завершен!</strong> Вы можете перейти к следующему уроку.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Навигация */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                disabled={currentLesson === 0}
                onClick={() => handleLessonSelect(currentLesson - 1)}
              >
                Предыдущий урок
              </Button>
              
              <Button
                disabled={
                  currentLesson === lessons.length - 1 || 
                  !completedLessons.has(lessons[currentLesson].id)
                }
                onClick={() => handleLessonSelect(currentLesson + 1)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Следующий урок
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}