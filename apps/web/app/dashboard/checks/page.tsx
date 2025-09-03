"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Phone, Mail, Calendar, AlertTriangle, CheckCircle, Clock, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface CheckHistory {
  id: string
  type: 'phone' | 'email'
  query: string
  date: string
  status: 'completed' | 'failed'
  results: {
    source: string
    found: boolean
    count?: number
  }[]
}

export default function ChecksPage() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState<'found'|'deleted'>('found')
  const [checks, setChecks] = useState<CheckHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [activePanel, setActivePanel] = useState<'general' | 'phone' | 'email' | 'password'>('general')

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
      // Загружаем реальные данные из API
      const response = await fetch('/api/save-check-result?userId=current-user')

      if (!response.ok) {
        throw new Error('Failed to load check history')
      }

      const data = await response.json()

      if (data.ok) {
        setChecks(data.checks || [])
      } else {
        console.error('Failed to load checks:', data.error)
        // Fallback к mock данным при ошибке
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
  const computeStats = (panel: 'general'|'phone'|'email'|'password') => {
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
  const DONUT_COLORS = ['#7C3AED', '#E5E7EB']

  if (!user) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-gray-600" />
              <span className="text-xl font-light tracking-wide text-gray-900">Мои проверки</span>


            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Всего проверок</p>
                  <p className="text-2xl font-light text-gray-900">{checks.length}</p>
                </div>
                <Search className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Найдено утечек</p>
                  <p className="text-2xl font-light text-red-600">
                    {checks.reduce((total, check) => total + getTotalFindings(check.results), 0)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Успешных проверок</p>
                  <p className="text-2xl font-light text-green-600">
                    {checks.filter(check => check.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-900">История проверок</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Загрузка...</div>
            ) : checks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>История проверок пуста</p>
                <Link href="/dashboard">
                  <Button className="mt-4" variant="outline">Начать проверку</Button>
        {/* Control Panel + Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Left menu */}
          <div className="md:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-2">
              <button onClick={() => setActivePanel('general')} className={`w-full text-left px-4 py-3 rounded-xl transition ${activePanel==='general'?'bg-gray-100 text-gray-900':'text-gray-700 hover:bg-gray-50'}`}>Общее</button>
              <button onClick={() => setActivePanel('phone')} className={`w-full text-left px-4 py-3 rounded-xl transition ${activePanel==='phone'?'bg-gray-100 text-gray-900':'text-gray-700 hover:bg-gray-50'}`}>Номер телефона</button>
              <button onClick={() => setActivePanel('email')} className={`w-full text-left px-4 py-3 rounded-xl transition ${activePanel==='email'?'bg-gray-100 text-gray-900':'text-gray-700 hover:bg-gray-50'}`}>Email</button>
              <button onClick={() => setActivePanel('password')} className={`w-full text-left px-4 py-3 rounded-xl transition ${activePanel==='password'?'bg-gray-100 text-gray-900':'text-gray-700 hover:bg-gray-50'}`}>Пароль</button>
            </div>
          </div>
          {/* Right summary */}
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-light text-gray-900">{stats.title}</h3>
                  <p className="text-sm text-gray-500">Сводка по выбранному разделу</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Найдено утечек</p>
                  <p className="text-2xl font-light text-purple-600">{stats.leaks}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} innerRadius={55} outerRadius={75} dataKey="value">
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500">Источников</p>
                    <p className="text-xl font-light text-gray-900">{stats.totalSources}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-purple-600">С утечками</p>
                    <p className="text-xl font-light text-purple-600">{stats.foundSources}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-green-600">Чистых</p>
                    <p className="text-xl font-light text-green-600">{Math.max(stats.totalSources - stats.foundSources, 0)}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-yellow-600">Ошибок</p>
                    <p className="text-xl font-light text-yellow-600">{stats.errors}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                    <TabsList>
                      <TabsTrigger value="found">Найденные утечки</TabsTrigger>
                      <TabsTrigger value="deleted">Удаленные утечки</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {tab === 'deleted' ? (
                  <div className="text-center py-8 text-gray-500">Пока нет удаленных утечек</div>
                ) : (
                  <div className="space-y-4">
                    {checks.map((check) => (
                      <div key={check.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
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
                          <div className="flex items-center space-x-2">
                            {check.status === 'completed' ? (
                              <Badge variant="secondary" className="bg-green-50 text-green-700">Завершено</Badge>
                            ) : (
                              <Badge variant="destructive">Ошибка</Badge>
                            )}
                          </div>
                        </div>

                        {check.status === 'completed' && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {check.results.map((result, index) => (
                              <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs font-medium text-gray-600">{result.source}</p>
                                {result.found ? (
                                  <p className="text-sm text-red-600 font-medium">{result.count || 1} найдено</p>
                                ) : (
                                  <p className="text-sm text-green-600">Чисто</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

}