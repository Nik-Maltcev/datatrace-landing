"use client";

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, AlertTriangle, CheckCircle, Clock, Settings, Plus, Brain, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface CheckHistory {
  id: string
  type: 'phone' | 'email'
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
    items?: any
    error?: string
  }[]
}

// Компонент для отображения источника утечек с выпадающим списком
function LeakSourceCard({ result }: { result: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasLeaks = result.found && (result.count > 0 || (result.items && getItemsCount(result.items) > 0))
  
  function getItemsCount(items: any): number {
    if (Array.isArray(items)) return items.length
    if (typeof items === 'object' && items !== null) {
      return Object.values(items).reduce((sum: number, value: any) => {
        return sum + (Array.isArray(value) ? value.length : 0)
      }, 0)
    }
    return 0
  }
  
  function renderLeakDetails(items: any) {
    if (Array.isArray(items)) {
      return items.slice(0, 5).map((item, idx) => (
        <div key={idx} className="bg-white p-3 rounded border border-red-100 text-xs">
          <div className="space-y-1">
            {renderItemFields(item)}
          </div>
        </div>
      ))
    }
    
    if (typeof items === 'object' && items !== null) {
      return Object.entries(items).map(([dbName, dbItems]) => (
        <div key={dbName} className="mb-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            {dbName}
          </h5>
          <div className="space-y-2">
            {Array.isArray(dbItems) && dbItems.slice(0, 3).map((item, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-red-100 text-xs">
                <div className="space-y-1">
                  {renderItemFields(item)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))
    }
    
    return <div className="text-gray-500 text-sm">Нет данных для отображения</div>
  }
  
  function renderItemFields(item: any) {
    const priorityFields = ['name', 'phone', 'email', 'address', 'login', 'password', 'fullName', 'dbName']
    const allFields = Object.entries(item).filter(([key, value]) => 
      key !== '_original' && value !== null && value !== undefined && value !== ''
    )
    
    // Сначала показываем приоритетные поля
    const priority = allFields.filter(([key]) => priorityFields.includes(key))
    const others = allFields.filter(([key]) => !priorityFields.includes(key)).slice(0, 3)
    
    return [...priority, ...others].map(([key, value]) => (
      <div key={key} className="flex justify-between items-start">
        <span className="text-gray-500 capitalize text-xs">{getFieldLabel(key)}:</span>
        <span className="text-gray-900 font-mono text-xs text-right max-w-[200px] truncate">
          {formatFieldValue(key, value)}
        </span>
      </div>
    ))
  }
  
  function getFieldLabel(key: string): string {
    const labels: { [key: string]: string } = {
      name: 'Имя',
      phone: 'Телефон', 
      email: 'Email',
      address: 'Адрес',
      login: 'Логин',
      password: 'Пароль',
      fullName: 'ФИО',
      dbName: 'База данных',
      birthDate: 'Дата рождения',
      gender: 'Пол',
      database: 'База',
      records: 'Записи'
    }
    return labels[key] || key
  }
  
  function formatFieldValue(key: string, value: any): string {
    if (key === 'password' && value) {
      return '***скрыто***'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).slice(0, 30) + '...'
    }
    return String(value).slice(0, 30)
  }
  
  return (
    <div className={`border rounded-lg ${hasLeaks ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => hasLeaks && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${hasLeaks ? 'bg-red-500' : 'bg-green-500'}`} />
          <div>
            <p className="font-medium text-gray-900">{result.source || result.name}</p>
            <p className="text-sm text-gray-500">
              {hasLeaks ? `${result.count || getItemsCount(result.items)} записей найдено` : 'Чисто'}
            </p>
          </div>
        </div>
        {hasLeaks && (
          <div className="flex items-center space-x-2">
            <Badge variant={hasLeaks ? "destructive" : "secondary"}>
              {hasLeaks ? 'Утечка' : 'Безопасно'}
            </Badge>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        )}
      </div>
      
      {isExpanded && hasLeaks && result.items && (
        <div className="px-4 pb-4 border-t border-red-200">
          <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
            {renderLeakDetails(result.items)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChecksPage() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState<'found'|'deleted'>('found')
  const [checks, setChecks] = useState<CheckHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const router = useRouter()
  const [activePanel, setActivePanel] = useState<'general' | 'phone' | 'email' | 'password' | 'ai'>('general')

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      loadCheckHistory()
    } else {
      router.push("/login")
    }
  }, [router])

  const loadCheckHistory = async () => {
    try {
      const response = await fetch('/api/save-check-result?userId=current-user')
      if (!response.ok) {
        throw new Error('Failed to load check history')
      }
      const data = await response.json()
      if (data.ok) {
        setChecks(data.checks || [])
      } else {
        console.error('Failed to load checks:', data.error)
        const mockChecks: CheckHistory[] = [
          {
            id: '1',
            type: 'phone',
            query: '+79991234567',
            date: '2024-01-15T10:30:00Z',
            status: 'completed',
            results: [
              { source: 'ITP', found: true, count: 2 },
              { source: 'Dyxless', found: false },
              { source: 'LeakOsint', found: true, count: 1 }
            ]
          },
          {
            id: '2',
            type: 'email',
            query: 'user@example.com',
            date: '2024-01-14T15:45:00Z',
            status: 'completed',
            results: [
              { source: 'ITP', found: false },
              { source: 'Dyxless', found: true, count: 3 },
              { source: 'Usersbox', found: false }
            ]
          }
        ]
        setChecks(mockChecks)
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

  const computeStats = (panel: 'general'|'phone'|'email'|'password'|'ai') => {
    const phoneChecks = checks.filter(c => c.type === 'phone')
    const emailChecks = checks.filter(c => c.type === 'email')
    const sumFindings = (arr: CheckHistory[]) => arr.reduce((t, c) => t + getTotalFindings(c.results), 0)
    const sumSourcesFound = (arr: CheckHistory[]) => arr.reduce((t, c) => t + c.results.filter(r => r.found).length, 0)

    if (panel === 'phone') {
      return {
        title: 'Номер телефона',
        leaks: sumFindings(phoneChecks),
        totalSources: phoneChecks.reduce((t, c) => t + c.results.length, 0),
        foundSources: sumSourcesFound(phoneChecks),
        errors: 0,
      }
    }
    if (panel === 'email') {
      return {
        title: 'Email',
        leaks: sumFindings(emailChecks),
        totalSources: emailChecks.reduce((t, c) => t + c.results.length, 0),
        foundSources: sumSourcesFound(emailChecks),
        errors: 0,
      }
    }
    if (panel === 'password') {
      return { title: 'Пароль', leaks: 0, totalSources: 0, foundSources: 0, errors: 0 }
    }
    if (panel === 'ai') {
      return { title: 'ИИ анализ', leaks: sumFindings(checks), totalSources: checks.reduce((t, c) => t + c.results.length, 0), foundSources: sumSourcesFound(checks), errors: 0 }
    }
    // general
    const all = checks
    return {
      title: 'Общее',
      leaks: sumFindings(all),
      totalSources: all.reduce((t, c) => t + c.results.length, 0),
      foundSources: sumSourcesFound(all),
      errors: 0,
    }
  }

  const stats = computeStats(activePanel)
  const donutData = [
    { name: 'С утечками', value: stats.foundSources },
    { name: 'Чистые', value: Math.max(stats.totalSources - stats.foundSources, 0) }
  ]

  if (!user) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">А</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <div className="col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <nav className="space-y-2">
                <button 
                  onClick={() => setActivePanel('general')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activePanel === 'general' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  <span>Панель управления</span>
                </button>
                <button 
                  onClick={() => setActivePanel('phone')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activePanel === 'phone' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Phone className="h-5 w-5" />
                  <span>Номер телефона</span>
                </button>
                <button 
                  onClick={() => setActivePanel('email')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activePanel === 'email' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Mail className="h-5 w-5" />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => setActivePanel('password')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activePanel === 'password' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span>Пароль</span>
                </button>
                <button
                  onClick={() => setActivePanel('ai')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activePanel === 'ai' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Brain className="h-5 w-5" />
                  <span>ИИ анализ</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {/* Main Panel */}
            <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
              <div className="grid grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Сделаем ваши данные безопаснее
                  </h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {activePanel === 'ai'
                      ? 'Запустите ИИ анализ для глубокого исследования ваших данных и получения персональных рекомендаций по безопасности.'
                      : 'Обнаружены утечки ваших персональных данных в Telegram-ботах. Мы поможем удалить данные Telegram'
                    }
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl">
                    {activePanel === 'ai' ? 'Запустить ИИ анализ' : 'Удалить информацию обо мне'}
                  </Button>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie 
                          data={donutData} 
                          innerRadius={70} 
                          outerRadius={100} 
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#7C3AED' : '#C4B5FD'} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">{stats.leaks}</div>
                        <div className="text-sm text-gray-500">утечек</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {activePanel === 'ai' ? 'ИИ анализ' : 'История проверок'}
              </h3>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{checks.length}</div>
                  <div className="text-gray-500">Всего проверок</div>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {checks.reduce((total, check) => total + getTotalFindings(check.results), 0)}
                    </div>
                    <div className="text-gray-500">Найдено утечек</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {checks.filter(check => check.status === 'completed').length}
                    </div>
                    <div className="text-gray-500">Успешных проверок</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6">
                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                  <TabsList className="bg-gray-100">
                    <TabsTrigger value="found" className="data-[state=active]:bg-white">
                      Найденные утечки
                    </TabsTrigger>
                    <TabsTrigger value="deleted" className="data-[state=active]:bg-white">
                      Удаленные утечки
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-gray-500">Загрузка...</div>
              ) : checks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>История проверок пуста</p>
                  <Link href="/dashboard">
                    <Button className="mt-4" variant="outline">Начать проверку</Button>
                  </Link>
                </div>
              ) : tab === 'deleted' ? (
                <div className="text-center py-12 text-gray-500">Пока нет удаленных утечек</div>
              ) : (
                <div className="space-y-4">
                  {checks.map((check) => (
                    <div key={check.id} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {check.type === 'phone' ? (
                            <Phone className="h-5 w-5 text-gray-500" />
                          ) : (
                            <Mail className="h-5 w-5 text-gray-500" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{check.query}</p>
                            <p className="text-sm text-gray-500">{formatDate(check.date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {check.status === 'completed' ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200">Завершено</Badge>
                          ) : (
                            <Badge variant="destructive">Ошибка</Badge>
                          )}
                        </div>
                      </div>

                      {check.status === 'completed' && (
                        <div className="space-y-3">
                          {check.results.map((result, index) => (
                            <LeakSourceCard key={index} result={result} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
