"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  LogOut,
  Home,
  Brain,
  Menu,
  X
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (!user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      {/* Left Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-white shadow-xl border-r border-gray-200 transition-transform duration-300 ease-in-out lg:static lg:w-80 lg:translate-x-0 lg:shadow-lg ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
          {/* User Profile Section */}
          <div className="text-center mb-6">
            <Avatar className="w-16 h-16 mx-auto mb-3">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <h3 className="font-semibold text-gray-900 mb-1">
              {user.email}
            </h3>
            
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              {user.plan === 'free' ? 'Бесплатный' : 
               user.plan === 'basic' ? 'Базовый' : 
               user.plan === 'professional' ? 'Профессиональный' : 
               user.plan === 'expert' ? 'Эксперт' : 'Бесплатный'}
            </Badge>
          </div>

          <Separator className="mb-6" />

          {/* Navigation Menu */}
          <nav className="space-y-2">
            <Link href="/dashboard">
              <Button
                variant={isActive('/dashboard') ? "default" : "ghost"}
                className={`w-full justify-start ${isActive('/dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <Home className="h-4 w-4 mr-3" />
                Личный кабинет
              </Button>
            </Link>

            <Link href="/dashboard/checks">
              <Button
                variant={isActive('/dashboard/checks') ? "default" : "ghost"}
                className={`w-full justify-start ${isActive('/dashboard/checks') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <Search className="h-4 w-4 mr-3" />
                Мои проверки
              </Button>
            </Link>

            <Link href="/dashboard/ai-analysis">
              <Button
                variant={isActive('/dashboard/ai-analysis') ? "default" : "ghost"}
                className={`w-full justify-start ${isActive('/dashboard/ai-analysis') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <Brain className="h-4 w-4 mr-3" />
                ИИ анализ
              </Button>
            </Link>
          </nav>

          <Separator className="my-6" />

          {/* User Stats */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Статистика</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Проверки:</span>
                <span className="font-medium">{user.checksUsed || 0} / {user.checksLimit || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Тариф:</span>
                <Badge variant="outline" className="text-xs">
                  {user.plan === 'free' ? 'FREE' : user.plan?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-sm lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-500">Личный кабинет</p>
            </div>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar || ""} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
