"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Search, 
  LogOut,
  Home,
  Menu,
  X
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

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

  const SidebarContent = () => (
    <div className="p-4 sm:p-6">
      {/* User Profile Section */}
      <div className="text-center mb-6">
        <Avatar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3">
          <AvatarImage src={user.avatar || ""} />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm sm:text-lg">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">
          {user.email}
        </h3>
        
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
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
            className={`w-full justify-start text-sm ${isActive('/dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Home className="h-4 w-4 mr-3" />
            Личный кабинет
          </Button>
        </Link>

        <Link href="/dashboard/checks">
          <Button
            variant={isActive('/dashboard/checks') ? "default" : "ghost"}
            className={`w-full justify-start text-sm ${isActive('/dashboard/checks') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Search className="h-4 w-4 mr-3" />
            Мои проверки
          </Button>
        </Link>
      </nav>

      <Separator className="my-6" />

      {/* User Stats */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-6">
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
        onClick={() => {
          handleLogout()
          setIsMobileMenuOpen(false)
        }}
        variant="outline"
        className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 text-sm"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Выйти
      </Button>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          variant="outline"
          size="sm"
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 bg-white shadow-lg border-r border-gray-200">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  )
}