"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Database,
  User,
  Mail,
  Phone,
  Building
} from "lucide-react"
import Link from "next/link"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("email")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Введите данные для поиска")
      return
    }

    setIsSearching(true)
    setSearchResults(null)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          field: searchType
        })
      })

      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error("Search error:", error)
      alert("Ошибка при поиске")
    } finally {
      setIsSearching(false)
    }
  }

  const getSearchIcon = () => {
    switch(searchType) {
      case "email": return <Mail className="h-4 w-4" />
      case "phone": return <Phone className="h-4 w-4" />
      case "inn": return <Building className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">DataTrace</span>
              <Badge variant="secondary">Поиск утечек</Badge>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Личный кабинет
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Search Card */}
          <Card className="mb-8 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Поиск утечек данных
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Type Selector */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
                    { value: "phone", label: "Телефон", icon: <Phone className="h-4 w-4" /> },
                    { value: "inn", label: "ИНН", icon: <Building className="h-4 w-4" /> },
                    { value: "vk", label: "VK", icon: <User className="h-4 w-4" /> },
                    { value: "ok", label: "OK", icon: <User className="h-4 w-4" /> }
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={searchType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchType(type.value)}
                      className="flex items-center gap-1"
                    >
                      {type.icon}
                      {type.label}
                    </Button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder={`Введите ${searchType === 'email' ? 'email' : searchType === 'phone' ? 'телефон' : searchType === 'inn' ? 'ИНН компании' : 'username'}`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      {getSearchIcon()}
                    </div>
                  </div>
                  <Button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="min-w-[120px]"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Поиск...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Найти
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {searchResults && (
            <div className="space-y-4">
              {searchResults.results?.map((source: any, index: number) => (
                <Card key={index} className={source.ok ? "border-green-200" : "border-red-200"}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {source.ok ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                        {source.name}
                      </span>
                      {source.ok && source.items?.length > 0 && (
                        <Badge variant="destructive">
                          Найдено: {source.items.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  {source.ok && source.items?.length > 0 && (
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        <p>Обнаружены утечки в этом источнике</p>
                        {source.meta && (
                          <div className="mt-2">
                            <Badge variant="outline">
                              Записей: {source.meta.records || source.items.length}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Info Cards */}
          {!searchResults && !isSearching && (
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Защита данных</h3>
                  <p className="text-sm text-gray-600">
                    Проверяем более 100 источников утечек
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Search className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Глубокий поиск</h3>
                  <p className="text-sm text-gray-600">
                    Анализ всех доступных баз данных
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Мониторинг</h3>
                  <p className="text-sm text-gray-600">
                    Отслеживание новых утечек 24/7
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}