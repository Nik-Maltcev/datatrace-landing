"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Brain,
  Home,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react"

export function DashboardShell({
  children,
}: {
  children: ReactNode
}) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (!user) {
    return null
  }

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:static lg:w-80 lg:translate-x-0 lg:shadow-lg ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
          <div className="mb-6 text-center">
            <Avatar className="mx-auto mb-3 h-16 w-16">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="bg-blue-100 text-lg text-blue-600">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <h3 className="mb-1 font-semibold text-gray-900">{user.email}</h3>

            <Badge
              variant="secondary"
              className="border-blue-200 bg-blue-100 text-blue-700"
            >
              {user.plan === "free"
                ? "Бесплатный"
                : user.plan === "basic"
                  ? "Базовый"
                  : user.plan === "professional"
                    ? "Профессиональный"
                    : user.plan === "expert"
                      ? "Эксперт"
                      : "Бесплатный"}
            </Badge>
          </div>

          <Separator className="mb-6" />

          <nav className="space-y-2">
            <Link href="/dashboard">
              <Button
                variant={isActive("/dashboard") ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive("/dashboard")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <Home className="mr-3 h-4 w-4" />
                Личный кабинет
              </Button>
            </Link>

            <Link href="/dashboard/checks">
              <Button
                variant={isActive("/dashboard/checks") ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive("/dashboard/checks")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <Search className="mr-3 h-4 w-4" />
                Мои проверки
              </Button>
            </Link>

            <Link href="/dashboard/ai-analysis">
              <Button
                variant={
                  isActive("/dashboard/ai-analysis") ? "default" : "ghost"
                }
                className={`w-full justify-start ${
                  isActive("/dashboard/ai-analysis")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <Brain className="mr-3 h-4 w-4" />
                ИИ анализ
              </Button>
            </Link>
          </nav>

          <Separator className="my-6" />

          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-medium text-gray-700">
              Статистика
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Проверки:</span>
                <span className="font-medium">
                  {user.checksUsed || 0} / {user.checksLimit || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Тариф:</span>
                <Badge variant="outline" className="text-xs">
                  {user.plan === "free" ? "FREE" : user.plan?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </div>

      <div className="flex-1 lg:ml-0">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-sm lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
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
            <AvatarFallback className="bg-blue-100 text-sm text-blue-600">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </header>
        <div className="flex-1">{children}</div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
