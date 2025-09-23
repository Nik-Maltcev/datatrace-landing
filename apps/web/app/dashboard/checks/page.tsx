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
  ChevronRight
} from "lucide-react"
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
    }
  }, [user])

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
              Успешных проверок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{successfulChecks}</div>
            <p className="text-sm text-green-600">завершено успешно</p>
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
                        <h4 className="text-sm font-medium text-gray-900">Источники утечек:</h4>
                        <div className="space-y-2">
                          {check.results.map((result, idx) => {
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
                                        {Array.isArray(result.items) ? (
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
                          })}
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
                  <Brain className="h-4 w-4 mr-2 text-purple-500" />
                  ИИ анализ
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Получите персональные рекомендации по безопасности
                </p>
                <Button size="sm" variant="outline" className="text-purple-600 border-purple-200">
                  Запустить анализ
                </Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
