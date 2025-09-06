"use client";

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, AlertTriangle, CheckCircle, Clock, Settings, Plus, Brain, ChevronDown, ChevronRight, Loader2, ArrowLeft, Lock, Server, X, Trash2, ExternalLink } from "lucide-react"
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

function PasswordLeakCard({ result }: { result: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasLeaks = result.found && result.count > 0
  
  console.log('🔍 PasswordLeakCard received result:', result)
  console.log('📊 Has leaks:', hasLeaks)
  console.log('📊 Entries count:', result.entries?.length || 0)
  
  return (
    <div className={`border rounded-lg ${hasLeaks ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => hasLeaks && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${hasLeaks ? 'bg-red-500' : 'bg-green-500'}`} />
          <div>
            <p className="font-medium text-gray-900">DeHashed</p>
            <p className="text-sm text-gray-500">
              {hasLeaks ? (
                <span>
                  <span className="font-medium text-red-600">{result.count}</span> записей найдено
                  {result.databases?.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400">
                      в {result.databases.length} базах
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-green-600">Чисто</span>
              )}
            </p>
          </div>
        </div>
        {hasLeaks && (
          <div className="flex items-center space-x-2">
            <Badge variant={hasLeaks ? "destructive" : "secondary"}>
              {hasLeaks ? 'Скомпрометирован' : 'Безопасен'}
            </Badge>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        )}
      </div>
      
      {isExpanded && hasLeaks && result.entries && (
        <div className="px-4 pb-4 border-t border-red-200">
          <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
            <div className="bg-blue-50 p-3 rounded-lg mb-3 text-center">
              <span className="text-sm font-medium text-blue-800">
                Показано {result.entries.length} записей из {result.count}
              </span>
            </div>
            {result.entries.map((entry, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-red-200 mb-3">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="font-medium text-gray-900 text-sm">
                      {entry.database_name || 'Неизвестная база'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">Запись #{idx + 1}</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(entry)
                    .filter(([key, value]) => 
                      key !== 'password' && 
                      key !== 'hashed_password' && 
                      value !== null && 
                      value !== undefined && 
                      value !== '' &&
                      !Array.isArray(value) || (Array.isArray(value) && value.length > 0)
                    )
                    .slice(0, 8)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start py-1">
                        <span className="text-gray-600 font-medium text-sm min-w-[100px]">
                          {getPasswordFieldLabel(key)}:
                        </span>
                        <span className="text-gray-900 text-sm text-right max-w-[250px] break-words">
                          {formatPasswordFieldValue(key, value)}
                        </span>
                      </div>
                    ))
                  }
                  <div className="flex justify-between items-start py-1 bg-red-50 px-2 rounded">
                    <span className="text-gray-600 font-medium text-sm min-w-[100px]">
                      🔒 Пароль:
                    </span>
                    <span className="text-red-600 text-sm font-medium">
                      ***скомпрометирован***
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getPasswordFieldLabel(key: string): string {
  const labels: { [key: string]: string } = {
    database_name: '🗄️ База данных',
    email: '📧 Email',
    username: '👤 Логин',
    name: '👤 Имя',
    phone: '📱 Телефон',
    ip_address: '🌐 IP адрес',
    address: '🏠 Адрес',
    company: '🏢 Компания',
    url: '🔗 URL',
    social: '📱 Соцсети',
    dob: '🎂 Дата рождения',
    id: '🆔 ID'
  }
  return labels[key] || key
}

function formatPasswordFieldValue(key: string, value: any): string {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'object') {
    return JSON.stringify(value).slice(0, 50) + '...'
  }
  const strValue = String(value)
  return strValue.length > 50 ? strValue.slice(0, 50) + '...' : strValue
}

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
      const totalItems = items.length
      
      return (
        <>
          <div className="bg-blue-50 p-3 rounded-lg mb-3 text-center">
            <span className="text-sm font-medium text-blue-800">
              Показано все {totalItems} записей
            </span>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border border-red-200 mb-3">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="font-medium text-gray-900 text-sm">
                    {item.dbName || item.database || item.source || 'Неизвестный источник'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">Запись #{idx + 1}</span>
              </div>
              <div className="space-y-2">
                {renderItemFields(item)}
              </div>
            </div>
          ))}
        </>
      )
    }
    
    if (typeof items === 'object' && items !== null) {
      return Object.entries(items).map(([dbName, dbItems]) => (
        <div key={dbName} className="mb-4">
          <div className="bg-red-50 p-3 rounded-lg mb-3">
            <h5 className="text-base font-semibold text-red-800 flex items-center">
              <span className="w-3 h-3 bg-red-600 rounded-full mr-2"></span>
              База данных: {dbName}
            </h5>
            <p className="text-sm text-red-600 mt-1">
              Найдено записей: {Array.isArray(dbItems) ? dbItems.length : 0}
            </p>
          </div>
          <div className="space-y-3">
            {Array.isArray(dbItems) && dbItems.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Запись #{idx + 1}</span>
                  <span className="text-xs text-gray-500">{dbName}</span>
                </div>
                <div className="space-y-2">
                  {renderItemFields(item)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))
    }
    
    return <div className="text-gray-500 text-sm p-4">Нет данных для отображения</div>
  }
  
  function renderItemFields(item: any) {
    const priorityFields = ['dbName', 'database', 'source', 'name', 'fullName', 'phone', 'email', 'address', 'login', 'password']
    const allFields = Object.entries(item).filter(([key, value]) => 
      key !== '_original' && value !== null && value !== undefined && value !== '' && key !== '_id'
    )
    
    const priority = allFields.filter(([key]) => priorityFields.includes(key))
    const others = allFields.filter(([key]) => !priorityFields.includes(key)).slice(0, 5)
    
    return [...priority, ...others].map(([key, value]) => (
      <div key={key} className="flex justify-between items-start py-1">
        <span className="text-gray-600 font-medium text-sm min-w-[100px]">{getFieldLabel(key)}:</span>
        <span className="text-gray-900 text-sm text-right max-w-[250px] break-words">
          {formatFieldValue(key, value)}
        </span>
      </div>
    ))
  }
  
  function getFieldLabel(key: string): string {
    const labels: { [key: string]: string } = {
      dbName: '🗄️ База данных',
      database: '🗄️ База данных',
      source: '🔍 Источник',
      name: '👤 Имя',
      fullName: '👤 ФИО',
      phone: '📱 Телефон', 
      email: '📧 Email',
      address: '🏠 Адрес',
      login: '🔑 Логин',
      password: '🔒 Пароль',
      birthDate: '🎂 Дата рождения',
      gender: '⚧️ Пол',
      records: '📋 Записи',
      userId: '🆔 ID пользователя',
      dataProvider: '🏢 Провайдер',
      inn: '🏛️ ИНН',
      snils: '🏛️ СНИЛС',
      passport: '📄 Паспорт',
      firstName: '👤 Имя',
      lastName: '👤 Фамилия',
      nickName: '👤 Ник',
      city: '🏠 Город',
      birth_date: '🎂 Дата рождения',
      vkId: '🔗 VK ID',
      collection: '📁 Коллекция',
      accounts: '💳 Счета',
      cards: '💳 Карты',
      databaseInfo: 'ℹ️ Инфо о БД',
      _score: '🎯 Релевантность'
    }
    return labels[key] || key
  }
  
  function formatFieldValue(key: string, value: any): string {
    if (key === 'password' && value) {
      return '***скрыто***'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 1).slice(0, 100) + '...'
    }
    const strValue = String(value)
    if (['dbName', 'database', 'source', 'dataProvider', 'databaseInfo'].includes(key)) {
      return strValue
    }
    return strValue.length > 50 ? strValue.slice(0, 50) + '...' : strValue
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
              {hasLeaks ? (
                <span>
                  <span className="font-medium text-red-600">{result.count || getItemsCount(result.items)}</span> записей найдено
                  {typeof result.items === 'object' && !Array.isArray(result.items) && (
                    <span className="ml-2 text-xs text-gray-400">
                      в {Object.keys(result.items).length} базах
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-green-600">Чисто</span>
              )}
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
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)
  const router = useRouter()
  const [activePanel, setActivePanel] = useState<'general' | 'phone' | 'email' | 'password' | 'ai'>('general')
  const [passwordChecks, setPasswordChecks] = useState<any[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/login")
    }
  }, [router])

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
        console.log('📊 All checks loaded:', allChecks.length)
        
        const leakChecks = allChecks.filter(check => check.type !== 'password')
        const passwordHistory = allChecks.filter(check => check.type === 'password')
        
        console.log('🔍 Password checks found:', passwordHistory.length)
        console.log('🔍 Password checks data:', passwordHistory)
        
        setChecks(leakChecks)
        setPasswordChecks(passwordHistory)
      } else {
        console.error('Failed to load checks:', data.error)
        setChecks([])
        setPasswordChecks([])
      }
    } catch (error) {
      console.error('Failed to load check history:', error)
      setChecks([])
      setPasswordChecks([])
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
      const compromisedCount = passwordChecks.filter(check => check.results?.DeHashed?.found).length
      return { 
        title: 'Пароль', 
        leaks: passwordChecks.reduce((sum, check) => sum + (check.results?.DeHashed?.count || 0), 0),
        totalSources: passwordChecks.length,
        foundSources: compromisedCount,
        errors: 0 
      }
    }
    if (panel === 'ai') {
      return { title: 'ИИ анализ', leaks: sumFindings(checks), totalSources: checks.reduce((t, c) => t + c.results.length, 0), foundSources: sumSourcesFound(checks), errors: 0 }
    }
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

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checkHistory: checks
        })
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setAiAnalysis(data.analysis)
      } else {
        console.error('AI Analysis error:', data.error)
        alert('Ошибка ИИ анализа: ' + data.error)
      }
    } catch (error) {
      console.error('AI Analysis request error:', error)
      alert('Ошибка при запросе ИИ анализа')
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  const formatMarkdown = (text: string) => {
    return text
      .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-900">$1</h2>')
      .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/- (.*)/g, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^/, '<p class="mb-3">')
      .replace(/$/, '</p>')
  }

  const dataSources = [
    {
      name: 'Dyxless',
      botUrl: 'https://t.me/datatrace1_bot',
      instructions: [
        'Откройте telegram бот https://t.me/datatrace1_bot',
        'Нажмите /start',
        'Перейдите в раздел "мой профиль"',
        'Выберите пункт "Удалить информацию о себе"'
      ]
    },
    {
      name: 'ITP',
      botUrl: 'https://t.me/datatrace3_bot',
      instructions: [
        'Откройте telegram бот https://t.me/datatrace3_bot',
        'Нажмите /start',
        'Перейдите в раздел "мой профиль"',
        'Выберите пункт "Удалить информацию о себе"'
      ]
    },
    {
      name: 'Vektor',
      botUrl: 'https://t.me/datatrace2_bot',
      instructions: [
        'Откройте telegram бот https://t.me/datatrace2_bot',
        'Нажмите /start',
        'Перейдите в раздел "мой профиль"',
        'Выберите пункт "Удалить информацию о себе"'
      ]
    },
    {
      name: 'LeakOsint',
      botUrl: 'https://t.me/datatrace4_bot',
      instructions: [
        'Откройте telegram бот https://t.me/datatrace4_bot',
        'Нажмите /start',
        'Перейдите в раздел "мой профиль"',
        'Выберите пункт "Удалить информацию о себе"'
      ]
    },
    {
      name: 'Usersbox',
      botUrl: 'https://t.me/datatrace5_bot',
      instructions: [
        'Откройте telegram бот https://t.me/datatrace5_bot',
        'Нажмите /start',
        'Перейдите в раздел "мой профиль"',
        'Выберите пункт "Удалить информацию о себе"'
      ]
    }
  ]

  if (!user) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад в кабинет
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Мои проверки</h1>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">А</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
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
                  <Lock className="h-5 w-5" />
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

          <div className="col-span-9">
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
                  <Button 
                    onClick={() => activePanel === 'ai' ? handleAiAnalysis() : setShowDeleteModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl"
                  >
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

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {activePanel === 'ai' ? 'ИИ анализ' : 'История проверок'}
                </h3>
                {activePanel === 'ai' && checks.length > 0 && (
                  <Button
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Анализирую...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Запустить ИИ анализ
                      </>
                    )}
                  </Button>
                )}
              </div>

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

              {activePanel === 'password' ? (
                <div>
                  {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Загрузка...</div>
                  ) : passwordChecks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Lock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Нет проверок паролей</p>
                      <Link href="/dashboard">
                        <Button className="mt-4" variant="outline">Проверить пароль</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {passwordChecks.map((check, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                check.results?.DeHashed?.found ? 'bg-red-50' : 'bg-green-50'
                              }`}>
                                <Lock className={`h-5 w-5 ${
                                  check.results?.DeHashed?.found ? 'text-red-600' : 'text-green-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Проверка пароля</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(check.timestamp).toLocaleString('ru-RU')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge 
                                variant={check.results?.DeHashed?.found ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {check.results?.DeHashed?.found ? 'Скомпрометирован' : 'Безопасен'}
                              </Badge>
                            </div>
                          </div>
                          
                          {check.results?.DeHashed && (
                            <PasswordLeakCard result={check.results.DeHashed} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activePanel === 'ai' ? (
                <div>
                  {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Загрузка...</div>
                  ) : checks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Нет данных для ИИ анализа</p>
                      <p className="text-sm mt-2">Сначала выполните проверки утечек</p>
                      <Link href="/dashboard">
                        <Button className="mt-4" variant="outline">Начать проверку</Button>
                      </Link>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="prose max-w-none">
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Brain className="h-5 w-5 mr-2 text-purple-600" />
                            ИИ Анализ безопасности
                          </h4>
                          <Button
                            onClick={() => setAiAnalysis(null)}
                            variant="outline"
                            size="sm"
                          >
                            Новый анализ
                          </Button>
                        </div>
                        <div 
                          className="text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAnalysis) }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="h-16 w-16 mx-auto mb-4 text-purple-300" />
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">ИИ анализ безопасности</h4>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Получите персональные рекомендации по безопасности на основе истории ваших проверок
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                        <p className="text-sm text-gray-600">
                          📊 Проанализировано проверок: <span className="font-medium">{checks.length}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          🔍 Найдено утечек: <span className="font-medium">{checks.reduce((sum, check) => sum + (check.totalLeaks || 0), 0)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Data Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Удаление данных</h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedSource(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Выберите источник для удаления ваших персональных данных
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid gap-4">
                {dataSources.map((source) => (
                  <div key={source.name} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{source.name}</h3>
                          <p className="text-sm text-gray-500">Источник данных утечек</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedSource(source.name)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Инструкция по удалению - {selectedSource}
                </h2>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {(() => {
                const source = dataSources.find(s => s.name === selectedSource)
                if (!source) return null
                
                return (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium mb-2">
                        📱 Для удаления данных из {selectedSource} выполните следующие шаги:
                      </p>
                    </div>
                    
                    <ol className="space-y-3">
                      {source.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-purple-600">{index + 1}</span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{instruction}</p>
                        </li>
                      ))}
                    </ol>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => window.open(source.botUrl, '_blank')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Открыть Telegram бот
                      </Button>
                    </div>
                  </div>
                )
              })()
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}