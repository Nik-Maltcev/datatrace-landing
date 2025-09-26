"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, ArrowLeft, Zap, Settings, BarChart3, TrendingUp, AlertTriangle, Shield, Calendar, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

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
    items?: any
  }[]
}

interface AIAnalysis {
  riskLevel: 'low' | 'medium' | 'high'
  totalLeaks: number
  compromisedSources: string[]
  recommendations: string[]
  trends: { month: string; leaks: number }[]
  sourceBreakdown: { name: string; value: number; color: string }[]
  analysis: string
  lastUpdated: string
  priorityActions?: string[]
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

export default function AIAnalysisPage() {
  const { user } = useAuth()
  const [checks, setChecks] = useState<CheckHistory[]>([])
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (user?.email) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const response = await fetch(`/api/save-check-result?userId=${encodeURIComponent(user!.email)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.ok) {
          setChecks(data.checks || [])
          generateAnalysis(data.checks || [])
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAnalysis = async (checksData: CheckHistory[]) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checks: checksData })
      })
      
      if (response.ok) {
        const analysis = await response.json()
        setAiAnalysis(analysis)
      } else {
        // Fallback analysis
        setAiAnalysis(createFallbackAnalysis(checksData))
      }
    } catch (error) {
      console.error('AI analysis failed:', error)
      setAiAnalysis(createFallbackAnalysis(checksData))
    } finally {
      setIsGenerating(false)
    }
  }

  const createFallbackAnalysis = (checksData: CheckHistory[]): AIAnalysis => {
    const totalLeaks = checksData.reduce((sum, check) => 
      sum + check.results.reduce((s, r) => s + (r.count || 0), 0), 0
    )
    
    const compromisedSources = Array.from(new Set(
      checksData.flatMap(check => 
        check.results.filter(r => r.found).map(r => r.source || r.name)
      )
    ))

    const sourceBreakdown = compromisedSources.map((source, idx) => ({
      name: source,
      value: checksData.reduce((sum, check) => {
        const sourceResult = check.results.find(r => (r.source || r.name) === source)
        return sum + (sourceResult?.count || 0)
      }, 0),
      color: COLORS[idx % COLORS.length]
    }))

    const trends = generateTrendData(checksData)

    return {
      riskLevel: totalLeaks > 50 ? 'high' : totalLeaks > 10 ? 'medium' : 'low',
      totalLeaks,
      compromisedSources,
      recommendations: generateRecommendations(totalLeaks, compromisedSources.length),
      trends,
      sourceBreakdown,
      analysis: generateAnalysisText(totalLeaks, compromisedSources.length),
      lastUpdated: new Date().toISOString()
    }
  }

  const generateTrendData = (checksData: CheckHistory[]) => {
    const monthlyData: { [key: string]: number } = {}
    
    checksData.forEach(check => {
      const month = new Date(check.date).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' })
      const leaks = check.results.reduce((sum, r) => sum + (r.count || 0), 0)
      monthlyData[month] = (monthlyData[month] || 0) + leaks
    })

    return Object.entries(monthlyData).map(([month, leaks]) => ({ month, leaks }))
  }

  const generateRecommendations = (totalLeaks: number, sourcesCount: number): string[] => {
    const recommendations = []
    
    if (totalLeaks > 0) {
      recommendations.push('Немедленно смените пароли на всех важных аккаунтах')
      recommendations.push('Включите двухфакторную аутентификацию везде, где это возможно')
    }
    
    if (sourcesCount > 3) {
      recommendations.push('Рассмотрите возможность смены номера телефона или email')
    }
    
    if (totalLeaks > 50) {
      recommendations.push('Обратитесь к специалисту по кибербезопасности')
      recommendations.push('Рассмотрите использование VPN и анонимных платежных методов')
    }
    
    recommendations.push('Регулярно мониторьте свои данные на предмет новых утечек')
    
    return recommendations
  }

  const generateAnalysisText = (totalLeaks: number, sourcesCount: number): string => {
    if (totalLeaks === 0) {
      return 'Отличные новости! Ваши данные не найдены в известных утечках. Продолжайте следовать рекомендациям по кибербезопасности.'
    }
    
    if (totalLeaks < 10) {
      return `Найдено ${totalLeaks} записей в ${sourcesCount} источниках. Уровень риска низкий, но рекомендуется принять базовые меры защиты.`
    }
    
    if (totalLeaks < 50) {
      return `Обнаружено ${totalLeaks} записей в ${sourcesCount} источниках. Средний уровень риска. Необходимо принять меры по защите данных.`
    }
    
    return `Критический уровень: найдено ${totalLeaks} записей в ${sourcesCount} источниках. Требуются немедленные действия по защите.`
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Высокий риск'
      case 'medium': return 'Средний риск'
      default: return 'Низкий риск'
    }
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
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ИИ анализ безопасности
            </h1>
            <p className="text-gray-600">
              Персональный анализ утечек данных и рекомендации
            </p>
          </div>
        </div>
        <Button 
          onClick={() => generateAnalysis(checks)}
          disabled={isGenerating}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Анализируем...' : 'Обновить анализ'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных для анализа...</p>
        </div>
      ) : !aiAnalysis ? (
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-2 border-dashed border-purple-200 bg-purple-50">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="h-12 w-12 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-purple-900 mb-2">
                Нет данных для анализа
              </CardTitle>
              <p className="text-purple-700">
                Выполните несколько проверок, чтобы получить персональный ИИ анализ
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/dashboard">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Начать проверки
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Risk Level Alert */}
          <Alert className={`border-2 ${getRiskColor(aiAnalysis.riskLevel)}`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              <strong>{getRiskLabel(aiAnalysis.riskLevel)}:</strong> {aiAnalysis.analysis}
            </AlertDescription>
          </Alert>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Всего утечек
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{aiAnalysis.totalLeaks}</div>
                <p className="text-sm text-red-600">записей скомпрометировано</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Источников утечек
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">{aiAnalysis.compromisedSources.length}</div>
                <p className="text-sm text-orange-600">требует внимания</p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${aiAnalysis.riskLevel === 'high' ? 'from-red-50 to-red-100 border-red-200' : aiAnalysis.riskLevel === 'medium' ? 'from-orange-50 to-orange-100 border-orange-200' : 'from-green-50 to-green-100 border-green-200'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center ${aiAnalysis.riskLevel === 'high' ? 'text-red-700' : aiAnalysis.riskLevel === 'medium' ? 'text-orange-700' : 'text-green-700'}`}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Уровень риска
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${aiAnalysis.riskLevel === 'high' ? 'text-red-900' : aiAnalysis.riskLevel === 'medium' ? 'text-orange-900' : 'text-green-900'}`}>
                  {getRiskLabel(aiAnalysis.riskLevel)}
                </div>
                <p className={`text-sm ${aiAnalysis.riskLevel === 'high' ? 'text-red-600' : aiAnalysis.riskLevel === 'medium' ? 'text-orange-600' : 'text-green-600'}`}>
                  на основе ИИ анализа
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trends Chart */}
            {aiAnalysis.trends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    Динамика утечек по месяцам
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={aiAnalysis.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="leaks" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Source Breakdown */}
            {aiAnalysis.sourceBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-purple-600" />
                    Распределение по источникам
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={aiAnalysis.sourceBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {aiAnalysis.sourceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Priority Actions */}
          {aiAnalysis.priorityActions && aiAnalysis.priorityActions.length > 0 && (
            <Card className="border-2 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Приоритетные действия
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiAnalysis.priorityActions.map((action, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-red-100 rounded-lg border border-red-300">
                      <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        !
                      </div>
                      <p className="text-red-800 font-medium">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-green-600" />
                Детальные рекомендации по безопасности
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiAnalysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-green-800 font-medium">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compromised Sources */}
          {aiAnalysis.compromisedSources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Скомпрометированные источники
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiAnalysis.compromisedSources.map((source, index) => (
                    <Badge key={index} variant="destructive" className="p-2 justify-center">
                      {source}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 inline mr-1" />
            Последнее обновление: {new Date(aiAnalysis.lastUpdated).toLocaleString('ru-RU')}
          </div>
        </div>
      )}
    </div>
  )
}