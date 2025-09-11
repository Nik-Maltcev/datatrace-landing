"use client"

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  isAuthenticated: boolean
  plan?: 'free' | 'basic' | 'professional' | 'corporate'
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
      plan: userData.plan || 'free',
      checksUsed: userData.checksUsed || 0,
      checksLimit: userData.checksLimit || (userData.plan === 'professional' ? 2 : userData.plan === 'basic' ? 1 : 0)
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

  const updateUserPlan = (plan: 'free' | 'basic' | 'professional') => {
    if (user) {
      const planLimits = {
        free: 0,
        basic: 1,
        professional: 2
      }
      const updatedUser = { 
        ...user, 
        plan, 
        checksLimit: planLimits[plan],
        checksUsed: 0 // Сбрасываем счетчик при покупке нового тарифа
      }
      console.log('Updating user plan locally:', updatedUser)
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const refreshUserData = async () => {
    // Получаем актуальные данные из localStorage
    const userData = localStorage.getItem("user")
    const currentUser = userData ? JSON.parse(userData) : user
    
    if (!currentUser?.id) {
      console.log('No user ID for refresh')
      return
    }
    
    try {
      console.log('Refreshing user data for ID:', currentUser.id)
      
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })
      
      const result = await response.json()
      console.log('Refresh API response:', result)
      
      if (response.ok && result.ok && result.profile) {
        const updatedUser = {
          ...currentUser,
          plan: result.profile.plan || 'free',
          checksLimit: result.profile.checks_limit || 0,
          checksUsed: result.profile.checks_used || 0
        }
        
        console.log('Updating user with fresh data:', updatedUser)
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
      } else {
        console.error('Failed to refresh user data:', result)
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
    updateUserChecks,
    updateUserPlan,
    refreshUserData
  }
}