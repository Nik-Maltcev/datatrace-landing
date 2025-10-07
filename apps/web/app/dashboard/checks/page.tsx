"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Search, 
  Phone, 
  Mail, 
  Lock, 
  Brain,
  History,
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Calendar
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useEffect, useState } from "react"
import Link from "next/link"

interface CheckHistory {
  id: string
  type: 'phone' | 'email' | 'email_breach' | 'password'
  query: string
  date: string
  status: 'completed' | 'failed'
  totalLeaks?: number
  foundSources?: number
  results: {
    name: string
    source?: string
    found: boolean
    count?: number
    data?: any
    items?: any // Добавляем поддержку items
  }[]
}

export default function ChecksPage() {
  const { user } = useAuth()
  const [checks, setChecks] = useState<CheckHistory[]>([])
  const [passwordChecks, setPasswordChecks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteInstructionsOpen, setDeleteInstructionsOpen] = useState(false)
  const [selectedSourceForDeletion, setSelectedSourceForDeletion] = useState<string>('')
  const [analytics, setAnalytics] = useState<any>(null)
  const [deletedLeaks, setDeletedLeaks] = useState<Map<string, number>>(new Map())

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

  const getTypeMeta = (type: CheckHistory['type']) => {
    switch (type) {
      case 'phone':
        return {
          borderClass: 'border-l-blue-400',
          iconBgClass: 'bg-blue-100',
          icon: <Phone className="h-5 w-5 text-blue-600" />,
          label: 'Телефон'
        }
      case 'email_breach':
        return {
          borderClass: 'border-l-purple-400',
          iconBgClass: 'bg-purple-100',
          icon: <AlertTriangle className="h-5 w-5 text-purple-600" />,
          label: 'Email (взлом)'
        }
      case 'password':
        return {
          borderClass: 'border-l-amber-400',
          iconBgClass: 'bg-amber-100',
          icon: <Lock className="h-5 w-5 text-amber-600" />,
          label: 'Пароль'
        }
      default:
        return {
          borderClass: 'border-l-green-400',
          iconBgClass: 'bg-green-100',
          icon: <Mail className="h-5 w-5 text-green-600" />,
          label: 'Email'
        }
    }
  }

  const toggleSource = (checkId: string, sourceName: string) => {
    const key = `${checkId}-${sourceName}`
    setExpandedSources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleDeleteData = async () => {
    setIsDeleting(true)
    try {
      // Здесь будет API для удаления данных
      const response = await fetch('/api/delete-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user?.email,
          sources: Array.from(compromisedSources)
        }),
      })
      
      if (response.ok) {
        // Показать сообщение об успехе
        alert('Запрос на удаление данных отправлен. Мы свяжемся с вами для подтверждения.')
        setIsDeleteModalOpen(false)
      } else {
        alert('Ошибка при отправке запроса на удаление данных')
      }
    } catch (error) {
      console.error('Delete data error:', error)
      alert('Ошибка при отправке запроса на удаление данных')
    }
    setIsDeleting(false)
  }

  const openDeleteInstructions = (sourceName: string) => {
    setSelectedSourceForDeletion(sourceName)
    setDeleteInstructionsOpen(true)
  }

  useEffect(() => {
    if (user?.email) {
      loadCheckHistory()
      loadDeletedLeaks()
    }
  }, [user])

  useEffect(() => {
    if (checks.length > 0) {
      generateAnalytics()
    }
  }, [checks])

  const loadDeletedLeaks = () => {
    if (!user?.email) return
    const stored = localStorage.getItem(`deletedLeaks_${user.email}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      setDeletedLeaks(new Map(parsed))
    }
  }

  const markAsDeleted = (checkId: string, sourceName: string, count: number) => {
    const key = `${checkId}-${sourceName}`
    const newDeleted = new Map(deletedLeaks)
    newDeleted.set(key, count)
    setDeletedLeaks(newDeleted)
    if (user?.email) {
      localStorage.setItem(`deletedLeaks_${user.email}`, JSON.stringify(Array.from(newDeleted.entries())))
    }
  }

  const loadCheckHistory = async () => {
    if (!user?.email) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/save-check-result?userId=${encodeURIComponent(user.email)}`)
      if (!response.ok) {
        throw new Error('Failed to load check history')
      }
      const data = await response.json()
      if (data.ok) {
        const allChecks = data.checks || []
        
        const leakChecks = allChecks.filter((check: any) => check.type !== 'password')
        const passwordHistory = allChecks.filter((check: any) => check.type === 'password')
        
        setChecks(leakChecks)
        setPasswordChecks(passwordHistory)
      }
    } catch (error) {
      console.error('Failed to load check history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTotalFindings = (results: CheckHistory['results']) => {
    return results.reduce((total, result) => total + (result.count || 0), 0)
  }

  const getCompromisedSources = () => {
    const compromisedSources = new Set<string>()
    
    checks.forEach(check => {
      check.results.forEach(result => {
        if (result.found && (result.count || 0) > 0) {
          const sourceName = result.source || result.name
          if (sourceName) {
            compromisedSources.add(sourceName)
          }
        }
      })
    })
    
    return Array.from(compromisedSources)
  }

  // Подсчет статистики
  const totalChecks = checks.length + passwordChecks.length
  const totalLeaks = checks.reduce((sum, check) => sum + getTotalFindings(check.results), 0) + 
                    passwordChecks.reduce((sum, check) => sum + (check.results?.DeHashed?.count || 0), 0)
  const successfulChecks = checks.filter(check => check.status === 'completed').length + passwordChecks.length
  const compromisedSources = getCompromisedSources()

  const generateAnalytics = () => {
    const totalLeaks = checks.reduce((sum, check) => 
      sum + check.results.reduce((s, r) => s + (r.count || 0), 0), 0
    )
    
    const compromisedSources = Array.from(new Set(
      checks.flatMap(check => 
        check.results.filter(r => r.found).map(r => r.source || r.name)
      )
    ))

    const sourceBreakdown = compromisedSources.map((source, idx) => ({
      name: source,
      value: checks.reduce((sum, check) => {
        const sourceResult = check.results.find(r => (r.source || r.name) === source)
        return sum + (sourceResult?.count || 0)
      }, 0),
      color: COLORS[idx % COLORS.length]
    }))

    const companyBreakdown = generateCompanyBreakdown()
    const dataTypeBreakdown = generateDataTypeBreakdown()

    setAnalytics({
      totalLeaks,
      compromisedSources,
      sourceBreakdown,
      companyBreakdown,
      dataTypeBreakdown
    })
  }

  const generateDataTypeBreakdown = () => {
    const dataTypes: { [key: string]: number } = {
      'Email': 0,
      'Номер телефона': 0,
      'Номер банковской карты': 0,
      'Адрес проживания': 0,
      'Паспорт': 0,
      'ИНН': 0,
      'СНИЛС': 0
    }

    const analyzeRecord = (record: any) => {
      // Email - проверяем все возможные варианты
      const emailValue = record['Адрес электронной почты'] || record.email || record.Email || record.EMAIL
      if (emailValue && String(emailValue).includes('@')) {
        dataTypes['Email']++
      }
      
      // Телефон - проверяем все возможные варианты
      const phoneValue = record['Номер телефона'] || record.phone || record.telephone || record.Phone || record.PHONE
      if (phoneValue) {
        const cleanPhone = String(phoneValue).replace(/\D/g, '')
        if (cleanPhone.length >= 10) {
          dataTypes['Номер телефона']++
        }
      }
      
      // Банковская карта
      const cardValue = record['Номер банковской карты'] || record.card_number || record.bank_card || record.card || record.cardnumber || record.cards
      if (cardValue) {
        // Если это строка с несколькими картами, считаем каждую
        const cards = String(cardValue).split(',')
        cards.forEach(c => {
          const cleaned = c.trim().replace(/\s/g, '').replace(/\*/g, '')
          // Проверяем что это похоже на номер карты (от 13 до 19 цифр или замаскированный)
          if (cleaned && (/^\d{13,19}$/.test(cleaned) || /^\d{6}\*+\d{4}$/.test(cleaned))) {
            dataTypes['Номер банковской карты']++
          }
        })
      }
      
      // Адрес
      if (record['Адрес проживания/доставки'] || record.address || record.addr || record.street || record.city || record['Город']) {
        dataTypes['Адрес проживания']++
      }
      
      // Паспорт
      if (record.passport || record.passport_number || record.passport_series || 
          record.passport_date || record.passport_give || record.passport_subdivision) {
        dataTypes['Паспорт']++
      }
      
      // ИНН
      if (record['ИНН'] || record.inn) {
        dataTypes['ИНН']++
      }
      
      // СНИЛС
      if (record['СНИЛС'] || record.snils) {
        dataTypes['СНИЛС']++
      }
    }

    checks.forEach(check => {
      check.results.forEach(result => {
        if (!result.found) return

        // Анализируем содержимое items для определения типов данных
        if (result.items) {
          if (check.type === 'email_breach' && result.items.result) {
            // BreachDirectory format
            result.items.result.forEach((item: any) => analyzeRecord(item))
          } else if (Array.isArray(result.items)) {
            // Dyxless format - массив записей
            result.items.forEach((item: any) => analyzeRecord(item))
          }
        }
        
        // Проверяем result.data отдельно (ITP format)
        if (result.data && typeof result.data === 'object') {
          // ITP format - группированные данные по базам
          Object.values(result.data).forEach((dbRecords: any) => {
            if (Array.isArray(dbRecords)) {
              dbRecords.forEach((record: any) => analyzeRecord(record))
            }
          })
        }
      })
    })

    // Возвращаем результаты
    return Object.entries(dataTypes)
      .filter(([_, value]) => value > 0)
      .map(([name, value], idx) => ({
        name,
        value,
        color: COLORS[idx % COLORS.length]
      }))
  }

  const generateCompanyBreakdown = () => {
    // Статичные данные для всех пользователей
    return [
      { name: 'Яндекс', количество: 14 },
      { name: 'VK', количество: 6 },
      { name: 'Сбер', количество: 4 },
      { name: 'СДЭК', количество: 4 },
      { name: 'Альфабанк', количество: 3 },
      { name: 'Билайн', количество: 3 },
      { name: 'Росреестр', количество: 2 },
      { name: 'МТС', количество: 2 },
      { name: 'Теле2', количество: 1 },
      { name: 'Другие', количество: 8 }
    ]
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои проверки</h1>
          <p className="text-gray-600">История всех проверок безопасности</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            Назад к панели
          </Button>
        </Link>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <History className="h-4 w-4 mr-2" />
              Всего проверок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{totalChecks}</div>
            <p className="text-sm text-blue-600">выполнено проверок</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Найдено утечек
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{totalLeaks}</div>
            <p className="text-sm text-red-600">записей скомпрометировано</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Утечек удалено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{Array.from(deletedLeaks.values()).reduce((sum, count) => sum + count, 0)}</div>
            <p className="text-sm text-green-600">записей удалено</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Источников утечек
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{compromisedSources.length}</div>
            <p className="text-sm text-purple-600">требует внимания</p>
          </CardContent>
        </Card>
      </div>

      {/* Предупреждение о найденных утечках */}
      {compromisedSources.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Обнаружены утечки данных!</strong> Найдены ваши данные в {compromisedSources.length} источниках. 
            Рекомендуем принять меры для защиты вашей конфиденциальности.
          </AlertDescription>
        </Alert>
      )}

      {/* Кнопка очистки старых записей */}
      {checks.some(check => check.results.some(r => r.name && r.name.startsWith('Breach '))) && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 flex items-center justify-between">
            <span>
              <strong>Обнаружены старые некорректные записи!</strong> Рекомендуем очистить историю для корректного отображения.
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              onClick={() => {
                if (confirm('Очистить всю историю проверок?')) {
                  localStorage.removeItem(`checkHistory_${user?.email}`)
                  window.location.reload()
                }
              }}
            >
              Очистить историю
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Графики и аналитика */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Types Breakdown */}
          {analytics.dataTypeBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-red-600" />
                  Типы скомпрометированных данных
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.dataTypeBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.dataTypeBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Company Breakdown Chart */}
          {analytics.companyBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Компании с утечками
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.companyBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Bar dataKey="количество" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* История проверок */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            История проверок
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка истории проверок...</p>
            </div>
          ) : totalChecks === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">История проверок пуста</h3>
              <p className="text-gray-600 mb-6">Начните с проверки вашего номера телефона или email</p>
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Начать проверку
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Проверки паролей */}
              {passwordChecks.map((check, index) => (
                <Card key={`password-${index}`} className="border-l-4 border-l-orange-400">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Lock className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Проверка пароля</CardTitle>
                          <p className="text-sm text-gray-600">{formatDate(check.timestamp)}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={check.results?.DeHashed?.found ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {check.results?.DeHashed?.found ? 'Скомпрометирован' : 'Безопасен'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Статус</p>
                        <p className={`font-medium ${check.results?.DeHashed?.found ? 'text-red-600' : 'text-green-600'}`}>
                          {check.results?.DeHashed?.found ? 'Найден в утечках' : 'Безопасен'}
                        </p>
                      </div>
                      {check.results?.DeHashed?.count > 0 && (
                        <div>
                          <p className="text-gray-600">Найдено записей</p>
                          <p className="font-medium text-red-600">{check.results.DeHashed.count}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Проверки телефонов и email */}
              {checks.map((check) => {
                const typeMeta = getTypeMeta(check.type)
                return (
                  <Card key={check.id} className={`border-l-4 ${typeMeta.borderClass}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeMeta.iconBgClass}`}>
                          {typeMeta.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base">{check.query}</CardTitle>
                          <p className="text-sm text-gray-600">{formatDate(check.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={check.status === 'completed' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {check.status === 'completed' ? 'Завершено' : 'Ошибка'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {typeMeta.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {check.status === 'completed' && check.results.length > 0 && (
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-600">Найдено утечек</p>
                          <p className="font-medium text-red-600">{getTotalFindings(check.results)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Проверено источников</p>
                          <p className="font-medium">{check.results.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">С утечками</p>
                          <p className="font-medium text-orange-600">
                            {check.results.filter(r => r.found).length}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Результат проверки:</h4>
                        <div className="space-y-2">
                          {check.type === 'email_breach' && check.results.length > 0 && check.results[0].items && check.results[0].items.result ? (
                            // BreachDirectory: показываем все записи из одного результата
                            <div className="rounded-lg border bg-red-50 border-red-200">
                              <div className="p-3">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm font-medium">BreachDirectory</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="destructive" className="text-xs">
                                      {check.results[0].items.result.length} записей
                                    </Badge>
                                    <Badge variant="outline" className="text-xs text-red-600">
                                      Утечка
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {check.results[0].items.result.map((item: any, itemIdx: number) => {
                                    const sources = Array.isArray(item.sources) ? item.sources.join(', ') : (item.sources || 'Неизвестный источник')
                                    const hasPassword = item.hash_password || item.password
                                    const password = item.password || (item.hash_password ? '••••••••' : null)
                                    const email = item.email ? item.email.replace('mailto:', '') : check.query
                                    
                                    return (
                                      <div key={itemIdx} className="bg-white p-3 rounded text-xs border border-gray-200">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-600">Источник:</span>
                                            <span className="text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded">{sources}</span>
                                          </div>
                                          
                                          {hasPassword && (
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium text-red-600">Пароль скомпрометирован:</span>
                                              <div className="flex items-center space-x-2">
                                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                                <span className="text-red-600 font-mono bg-red-50 px-2 py-1 rounded">
                                                  {password || 'Да'}
                                                </span>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {item.sha1 && (
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium text-gray-600">SHA1 хеш:</span>
                                              <span className="text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded truncate max-w-32">
                                                {item.sha1.substring(0, 16)}...
                                              </span>
                                            </div>
                                          )}
                                          
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-600">Email:</span>
                                            <span className="text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded">{email}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Остальные типы проверок: показываем по источникам
                            check.results.map((result, idx) => {
                            const sourceName = result.source || result.name
                            const key = `${check.id}-${sourceName}`
                            const isExpanded = expandedSources.has(key)
                            const totalRecords = typeof result.count === 'number'
                              ? result.count
                              : Array.isArray(result.items)
                                ? result.items.length
                                : result.items && typeof result.items === 'object'
                                  ? Object.keys(result.items).length
                                  : 0
                            
                            return (
                              <div key={idx} className={`rounded-lg border ${
                                result.found ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                              }`}>
                                <div 
                                  className={`flex items-center justify-between p-3 ${
                                    result.found && result.items ? 'cursor-pointer hover:bg-red-100 transition-colors' : ''
                                  }`}
                                  onClick={() => {
                                    if (result.found && result.items) {
                                      toggleSource(check.id, sourceName)
                                    }
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                      result.found ? 'bg-red-500' : 'bg-gray-400'
                                    }`} />
                                    <span className="text-sm font-medium">
                                      {sourceName}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {result.found ? (
                                      <>
                                        <Badge variant="destructive" className="text-xs">
                                          {totalRecords} записей
                                        </Badge>
                                        <Badge variant="outline" className="text-xs text-red-600">
                                          Утечка
                                        </Badge>
                                        {user?.plan === 'professional' && (
                                          deletedLeaks.has(`${check.id}-${sourceName}`) ? (
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-300">
                                              ✓ Удалено
                                            </Badge>
                                          ) : (
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="text-xs px-3 py-1 h-7 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 ml-1"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                openDeleteInstructions(sourceName)
                                              }}
                                            >
                                              🗑️ Удалить
                                            </Button>
                                          )
                                        )}
                                        {result.items && (
                                          <>
                                            {isExpanded ? (
                                              <ChevronDown className="h-4 w-4 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-gray-500" />
                                            )}
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-md border border-green-200">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-green-700 font-medium text-sm">Чисто</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {isExpanded && result.found && result.items && (
                                  <div className="border-t border-red-200 p-3 bg-red-25">
                                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                                      Детали утечки:
                                    </h5>
                                    <div className="space-y-2 text-sm text-gray-600">
                                      <p>• Источник: {sourceName}</p>
                                      <p>• Количество записей: {totalRecords}</p>
                                      
                                      <div className="mt-3 space-y-2">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Найденная информация:</p>
                                        {check.type === 'email_breach' && result.items && result.items.result ? (
                                          // BreachDirectory format: result array
                                          <>
                                            {result.items.result.map((item: any, itemIdx: number) => {
                                              const sources = Array.isArray(item.sources) ? item.sources.join(', ') : (item.sources || 'Неизвестный источник')
                                              const hasPassword = item.hash_password || item.password
                                              const password = item.password || (item.hash_password ? '••••••••' : null)
                                              const email = item.email ? item.email.replace('mailto:', '') : check.query
                                              
                                              return (
                                                <div key={itemIdx} className="bg-gray-50 p-3 rounded text-xs border border-gray-200">
                                                  <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                      <span className="font-medium text-gray-600">Источник:</span>
                                                      <span className="text-gray-800 font-mono bg-white px-2 py-1 rounded">{sources}</span>
                                                    </div>
                                                    
                                                    {hasPassword && (
                                                      <div className="flex items-center justify-between">
                                                        <span className="font-medium text-red-600">Пароль скомпрометирован:</span>
                                                        <div className="flex items-center space-x-2">
                                                          <AlertTriangle className="h-3 w-3 text-red-500" />
                                                          <span className="text-red-600 font-mono bg-red-50 px-2 py-1 rounded">
                                                            {password || 'Да'}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    )}
                                                    
                                                    {item.sha1 && (
                                                      <div className="flex items-center justify-between">
                                                        <span className="font-medium text-gray-600">SHA1 хеш:</span>
                                                        <span className="text-gray-600 font-mono bg-white px-2 py-1 rounded truncate max-w-32">
                                                          {item.sha1.substring(0, 16)}...
                                                        </span>
                                                      </div>
                                                    )}
                                                    
                                                    <div className="flex items-center justify-between">
                                                      <span className="font-medium text-gray-600">Email:</span>
                                                      <span className="text-gray-800 font-mono bg-white px-2 py-1 rounded">{email}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              )
                                            })}
                                            <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
                                              📊 Всего показано: {result.items.result.length} записей
                                            </div>
                                          </>
                                        ) : Array.isArray(result.items) ? (
                                          // Dyxless format: простой массив записей
                                          <>
                                            {result.items.map((item: any, itemIdx: number) => (
                                              <div key={itemIdx} className="bg-gray-50 p-2 rounded text-xs">
                                                {Object.entries(item)
                                                  .filter(([key, value]) => 
                                                    value && key !== 'id' && key !== 'user_id' && key !== '_original' &&
                                                    String(value).length > 0 && String(value) !== 'null'
                                                  )
                                                  .map(([key, value]) => (
                                                    <div key={key} className="flex justify-between py-1">
                                                      <span className="font-medium text-gray-600">{
                                                        key === 'name' ? 'Имя' :
                                                        key === 'phone' ? 'Телефон' :
                                                        key === 'email' ? 'Email' :
                                                        key === 'address' ? 'Адрес' :
                                                        key === 'login' ? 'Логин' :
                                                        key === 'password' ? 'Пароль' :
                                                        key === 'source' ? 'Источник' :
                                                        key
                                                      }:</span>
                                                      <span className="text-gray-800 break-all">{String(value)}</span>
                                                    </div>
                                                  ))
                                                }
                                              </div>
                                            ))}
                                            <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
                                              📊 Всего показано: {totalRecords} записей
                                            </div>
                                          </>
                                        ) : result.data && typeof result.data === 'object' ? (
                                          // ITP format: группированные данные по базам
                                          <>
                                            {Object.entries(result.data).map(([dbName, dbRecords]: [string, any], dbIdx: number) => (
                                              <div key={dbIdx} className="bg-gray-50 p-3 rounded text-xs border-l-4 border-blue-200 mb-3">
                                                <div className="font-medium text-gray-700 mb-2 text-sm">📊 {dbName}</div>
                                                {Array.isArray(dbRecords) && dbRecords.map((record: any, recordIdx: number) => (
                                                  <div key={recordIdx} className="ml-2 mb-2 p-2 bg-white rounded border-l-2 border-gray-200">
                                                    {Object.entries(record)
                                                      .filter(([key, value]) => 
                                                        value && 
                                                        key !== 'id' && 
                                                        key !== 'user_id' && 
                                                        key !== '_original' &&
                                                        key !== 'dataProvider' &&
                                                        key !== 'source_database' &&
                                                        key !== 'userId' &&
                                                        String(value).length > 0 && 
                                                        String(value) !== 'null' &&
                                                        String(value) !== 'undefined'
                                                      )
                                                      .map(([key, value]) => (
                                                        <div key={key} className="flex justify-between py-0.5">
                                                          <span className="font-medium text-gray-600 capitalize">{
                                                            key === 'name' ? 'Имя' :
                                                            key === 'phone' ? 'Телефон' :
                                                            key === 'email' ? 'Email' :
                                                            key === 'address' ? 'Адрес' :
                                                            key === 'login' ? 'Логин' :
                                                            key === 'password' ? 'Пароль' :
                                                            key === 'dbName' ? 'База данных' :
                                                            key
                                                          }:</span>
                                                          <span className="text-gray-800 break-all text-right max-w-xs">{String(value)}</span>
                                                        </div>
                                                      ))
                                                    }
                                                  </div>
                                                ))}
                                                <div className="text-xs text-blue-600 ml-2 italic">
                                                  Записей в этой базе: {Array.isArray(dbRecords) ? dbRecords.length : 0}
                                                </div>
                                              </div>
                                            ))}
                                            <div className="text-xs text-gray-600 mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                                              📈 Общий итог: {Object.values(result.data).reduce((total: number, dbRecords: any) => 
                                                total + (Array.isArray(dbRecords) ? dbRecords.length : 0), 0
                                              )} записей в {Object.keys(result.data).length} базах данных
                                            </div>
                                          </>
                                        ) : (
                                          <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                                            ❌ Детали недоступны или неизвестный формат данных
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Быстрые действия */}
      {totalChecks > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Рекомендуемые действия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compromisedSources.length > 0 && (
                <div className="p-4 bg-white rounded-lg border border-red-200">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Удалить данные
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Найдены утечки в {compromisedSources.length} источниках
                  </p>
                  <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        Начать удаление
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center text-red-600">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          Удалить персональные данные
                        </DialogTitle>
                        <DialogDescription className="text-left">
                          Вы собираетесь отправить запрос на удаление ваших персональных данных из следующих источников:
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4">
                        <div className="space-y-2">
                          {Array.from(compromisedSources).map((source, idx) => (
                            <div key={idx} className="flex items-center p-2 bg-red-50 rounded-lg border border-red-200">
                              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                              <span className="text-sm font-medium text-red-700">{source}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>⚠️ Важно:</strong> Процесс удаления данных может занять от 7 до 30 дней. 
                            Мы свяжемся с вами для подтверждения личности и дальнейших инструкций.
                          </p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDeleteModalOpen(false)}
                          disabled={isDeleting}
                        >
                          Отмена
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDeleteData}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Отправляем...
                            </>
                          ) : (
                            'Подтвердить удаление'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-purple-500" />
                  Консультация специалиста
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Получить консультацию специалиста по кибербезопасности
                </p>
                <a href="https://t.me/nik_maltcev" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-purple-600 border-purple-200">
                    Связаться со специалистом
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Instructions Modal */}
      <Dialog open={deleteInstructionsOpen} onOpenChange={setDeleteInstructionsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white border-2 border-gray-300 shadow-2xl">
          <DialogHeader className="bg-red-50 p-4 -mt-6 -mx-6 mb-4 border-b border-red-200">
            <DialogTitle className="flex items-center text-red-600 text-lg font-bold">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Инструкция по удалению данных из {selectedSourceForDeletion}
            </DialogTitle>
            <DialogDescription className="text-red-700 font-medium">
              Следуйте этим шагам для удаления ваших персональных данных из источника {selectedSourceForDeletion}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 bg-white">
            <div className="space-y-4">
              {selectedSourceForDeletion === 'ITP' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-bold text-gray-900 text-lg">Инструкция для ITP:</h4>
                  <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                    <p><strong>1.</strong> Откройте бота <a href="https://t.me/datatrace3_bot" target="_blank" className="text-blue-600 underline">t.me/datatrace3_bot</a> и запустите командой /start</p>
                    <p><strong>2.</strong> Затем выберите "профиль"</p>
                    <p><strong>3.</strong> Выберите раздел "Удалить информацию о себе" и выбираем что нужно удалить</p>
                    <p><strong>4.</strong> Оформляем запрос</p>
                  </div>
                </div>
              )}
              
              {selectedSourceForDeletion === 'Dyxless' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-bold text-gray-900 text-lg">Инструкция для Dyxless:</h4>
                  <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                    <p><strong>1.</strong> Откройте бота <a href="https://t.me/datatrace1_bot" target="_blank" className="text-blue-600 underline">t.me/datatrace1_bot</a> и запустите командой /start</p>
                    <p><strong>2.</strong> Затем выберите "мой профиль"</p>
                    <p><strong>3.</strong> Выберите раздел "Удалить информацию о себе"</p>
                    <p><strong>4.</strong> Далее заполните форму которая будет указана в сообщении</p>
                  </div>
                </div>
              )}
              
              {selectedSourceForDeletion === 'LeakOsint' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-bold text-gray-900 text-lg">Инструкция для LeakOsint:</h4>
                  <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                    <p><strong>1.</strong> Откройте бота <a href="https://t.me/vfsrfrb_bot" target="_blank" className="text-blue-600 underline">t.me/vfsrfrb_bot</a> и запустите командой /start</p>
                    <p><strong>2.</strong> Затем выберите "меню"</p>
                    <p><strong>3.</strong> Выберите раздел "Удалить себя" и выбираем что нужно удалить</p>
                  </div>
                </div>
              )}
              
              {selectedSourceForDeletion === 'Userbox' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-bold text-gray-900 text-lg">Инструкция для Userbox:</h4>
                  <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                    <p><strong>1.</strong> Откройте бота <a href="https://t.me/datatrace5_bot" target="_blank" className="text-blue-600 underline">t.me/datatrace5_bot</a> и запустите командой /start</p>
                    <p><strong>2.</strong> Затем напишите команду /me</p>
                    <p><strong>3.</strong> Выберите раздел "Скрытие информации"</p>
                  </div>
                </div>
              )}
              
              {selectedSourceForDeletion === 'Vektor' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-bold text-gray-900 text-lg">Инструкция для Vektor:</h4>
                  <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                    <p><strong>1.</strong> Откройте бота <a href="https://t.me/datatrace2_bot" target="_blank" className="text-blue-600 underline">t.me/datatrace2_bot</a> и запустите командой /start</p>
                    <p><strong>2.</strong> Затем выберите "мой профиль"</p>
                    <p><strong>3.</strong> Выберите раздел "Скрытие информации"</p>
                  </div>
                </div>
              )}
              
              {/* Fallback для неизвестных источников */}
              {!['ITP', 'Dyxless', 'LeakOsint', 'Userbox', 'Vektor'].includes(selectedSourceForDeletion) && (
                <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-bold text-gray-900 text-lg">Общая инструкция:</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">Свяжитесь с нашей службой поддержки для получения инструкций по удалению данных из источника {selectedSourceForDeletion}.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="bg-gray-50 p-4 -mb-6 -mx-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteInstructionsOpen(false)}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 px-6"
            >
              Закрыть
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                const check = checks.find(c => 
                  c.results.some(r => (r.source || r.name) === selectedSourceForDeletion)
                )
                if (check) {
                  const result = check.results.find(r => (r.source || r.name) === selectedSourceForDeletion)
                  const count = result?.count || 0
                  markAsDeleted(check.id, selectedSourceForDeletion, count)
                }
                setDeleteInstructionsOpen(false)
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              Я удалил
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
