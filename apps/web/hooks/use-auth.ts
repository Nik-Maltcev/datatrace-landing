"use client"

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  isAuthenticated: boolean
  plan?: 'basic' | 'professional' | 'corporate'
  checksUsed?: number
  checksLimit?: number
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = () => {
    try {
      const userData = localStorage.getItem("user")
      const accessToken = localStorage.getItem("access_token")
      
      if (userData && accessToken) {
        const parsedUser = JSON.parse(userData)
        if (parsedUser.isAuthenticated === true) {
          setUser(parsedUser)
          setIsAuthenticated(true)
        } else {
          clearAuth()
        }
      } else {
        clearAuth()
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      clearAuth()
    } finally {
      setIsLoading(false)
    }
  }

  const clearAuth = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("user")
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  }

  const login = (userData: User, accessToken: string, refreshToken?: string) => {
    // Устанавливаем базовый план и лимиты по умолчанию
    const userWithDefaults = {
      ...userData,
      plan: userData.plan || 'basic',
      checksUsed: userData.checksUsed || 0,
      checksLimit: userData.checksLimit || (userData.plan === 'professional' ? 2 : 1)
    }
    
    setUser(userWithDefaults)
    setIsAuthenticated(true)
    localStorage.setItem("user", JSON.stringify(userWithDefaults))
    localStorage.setItem("access_token", accessToken)
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken)
    }
  }

  const logout = () => {
    clearAuth()
  }

  const updateUserChecks = (checksUsed: number) => {
    if (user) {
      const updatedUser = { ...user, checksUsed }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
    updateUserChecks
  }
}