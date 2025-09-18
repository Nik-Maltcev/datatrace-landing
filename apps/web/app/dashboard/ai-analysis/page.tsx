"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, ArrowLeft, Zap, Settings, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function AIAnalysisPage() {
  return (
    <div className="p-8">
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
              ИИ анализ
            </h1>
            <p className="text-gray-600">
              Анализ утечек данных и рекомендации по безопасности
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="max-w-2xl mx-auto text-center">
        <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <Brain className="h-12 w-12 text-indigo-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-indigo-900 mb-2">
              Функция в разработке
            </CardTitle>
            <p className="text-indigo-700">
              Мы работаем над созданием мощного ИИ-анализатора для ваших данных
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-indigo-700">
                <Zap className="h-5 w-5" />
                <span>Автоматический анализ рисков</span>
              </div>
              <div className="flex items-center space-x-3 text-indigo-700">
                <BarChart3 className="h-5 w-5" />
                <span>Персонализированные рекомендации</span>
              </div>
              <div className="flex items-center space-x-3 text-indigo-700">
                <Settings className="h-5 w-5" />
                <span>Настройка уровня безопасности</span>
              </div>
            </div>
            
            <p className="text-sm text-indigo-600 mb-6">
              Скоро вы сможете получать детальный анализ своих данных и персонализированные рекомендации по повышению кибербезопасности.
            </p>
            
            <Link href="/dashboard">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Вернуться в дашборд
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}