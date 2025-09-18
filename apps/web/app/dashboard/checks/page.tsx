"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  type: 'phone' | 'email' | 'password'
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
              {checks.map((check) => (
                <Card key={check.id} className={`border-l-4 ${
                  check.type === 'phone' ? 'border-l-blue-400' : 'border-l-green-400'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          check.type === 'phone' 
                            ? 'bg-blue-100' 
                            : 'bg-green-100'
                        }`}>
                          {check.type === 'phone' ? (
                            <Phone className={`h-5 w-5 ${check.type === 'phone' ? 'text-blue-600' : 'text-green-600'}`} />
                          ) : (
                            <Mail className="h-5 w-5 text-green-600" />
                          )}
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
                          {check.type === 'phone' ? 'Телефон' : 'Email'}
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
                                          {result.count || 0} записей
                                        </Badge>
                                        <Badge variant="outline" className="text-xs text-red-600">
                                          Утечка
                                        </Badge>
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
                                      <Badge variant="secondary" className="text-xs">
                                        Чисто
                                      </Badge>
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
                                      <p>• Количество записей: {result.count || 0}</p>
                                      
                                      <div className="mt-3 space-y-2">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Найденная информация:</p>
                                        {Array.isArray(result.items) ? (
                                          // Dyxless format: простой массив записей
                                          result.items.slice(0, 5).map((item: any, itemIdx: number) => (
                                            <div key={itemIdx} className="bg-gray-50 p-2 rounded text-xs">
                                              {Object.entries(item)
                                                .filter(([key, value]) => 
                                                  value && key !== 'id' && key !== 'user_id' && key !== '_original' &&
                                                  String(value).length > 0 && String(value) !== 'null'
                                                )
                                                .slice(0, 6)
                                                .map(([key, value]) => (
                                                  <div key={key} className="flex justify-between py-1">
                                                    <span className="font-medium text-gray-600">{key}:</span>
                                                    <span className="text-gray-800 break-all">{String(value)}</span>
                                                  </div>
                                                ))
                                              }
                                            </div>
                                          ))
                                        ) : result.data && typeof result.data === 'object' ? (
                                          // ITP format: группированные данные по базам
                                          Object.entries(result.data).slice(0, 4).map(([dbName, dbRecords]: [string, any], dbIdx: number) => (
                                            <div key={dbIdx} className="bg-gray-50 p-3 rounded text-xs border-l-4 border-blue-200">
                                              <div className="font-medium text-gray-700 mb-2 text-sm">📊 {dbName}</div>
                                              {Array.isArray(dbRecords) && dbRecords.slice(0, 2).map((record: any, recordIdx: number) => (
                                                <div key={recordIdx} className="ml-2 mb-2 p-2 bg-white rounded border-l-2 border-gray-200">
                                                  {Object.entries(record)
                                                    .filter(([key, value]) => 
                                                      value && key !== 'id' && key !== 'user_id' && key !== '_original' &&
                                                      key !== 'dbName' && key !== 'dataProvider' &&
                                                      String(value).length > 0 && String(value) !== 'null'
                                                    )
                                                    .slice(0, 5)
                                                    .map(([key, value]) => (
                                                      <div key={key} className="flex justify-between py-0.5">
                                                        <span className="font-medium text-gray-600 capitalize">{
                                                          key === 'name' ? 'Имя' :
                                                          key === 'phone' ? 'Телефон' :
                                                          key === 'email' ? 'Email' :
                                                          key === 'address' ? 'Адрес' :
                                                          key === 'login' ? 'Логин' :
                                                          key
                                                        }:</span>
                                                        <span className="text-gray-800 break-all text-right">{String(value)}</span>
                                                      </div>
                                                    ))
                                                  }
                                                </div>
                                              ))}
                                              {Array.isArray(dbRecords) && dbRecords.length > 2 && (
                                                <div className="text-xs text-blue-600 ml-2 italic">
                                                  ... ещё {dbRecords.length - 2} записей в этой базе
                                                </div>
                                              )}
                                            </div>
                                          ))
                                        ) : (
                                          typeof result.items === 'object' && result.items !== null ? (
                                            Object.entries(result.items).slice(0, 3).map(([db, items]: [string, any], itemIdx: number) => (
                                              <div key={itemIdx} className="bg-gray-50 p-2 rounded text-xs">
                                                <div className="font-medium text-gray-700 mb-1">База: {db}</div>
                                                {Array.isArray(items) && items.slice(0, 2).map((item: any, subIdx: number) => (
                                                  <div key={subIdx} className="ml-2 border-l-2 border-gray-300 pl-2 mb-1">
                                                    {Object.entries(item)
                                                      .filter(([key, value]) => 
                                                        value && key !== 'id' && key !== 'user_id' && 
                                                        String(value).length > 0 && String(value) !== 'null'
                                                      )
                                                      .slice(0, 3)
                                                      .map(([key, value]) => (
                                                        <div key={key} className="flex justify-between py-0.5">
                                                          <span className="font-medium text-gray-600">{key}:</span>
                                                          <span className="text-gray-800">{String(value)}</span>
                                                        </div>
                                                      ))
                                                    }
                                                  </div>
                                                ))}
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-xs text-gray-500">Детали недоступны</div>
                                          )
                                        )}
                                        {/* Показать общий счетчик */}
                                        {result.data && typeof result.data === 'object' && !Array.isArray(result.data) ? (
                                          <div className="text-xs text-gray-600 mt-2 p-2 bg-blue-50 rounded">
                                            📈 Общий итог: {Object.values(result.data).reduce((total: number, dbRecords: any) => 
                                              total + (Array.isArray(dbRecords) ? dbRecords.length : 0), 0
                                            )} записей в {Object.keys(result.data).length} базах данных
                                          </div>
                                        ) : Array.isArray(result.items) && result.items.length > 5 && (
                                          <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded">
                                            📊 Показано первых 5 из {result.items.length} записей
                                          </p>
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
              ))}
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
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                    Начать удаление
                  </Button>
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
    </div>
  )
}