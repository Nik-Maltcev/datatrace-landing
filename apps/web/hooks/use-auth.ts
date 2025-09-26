"use client"

import { useState, useEffect, useCallback } from 'react'
import { resolvePlanFromParam } from '@/lib/plans'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  isAuthenticated: boolean
  plan?: 'free' | 'basic' | 'professional' | 'corporate'
  rawPlan?: string
  checksUsed?: number
  checksLimit?: number
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUserData = useCallback(async () => {
    // Получаем актуальные данные из localStorage
    const userData = localStorage.getItem("user")
    const currentUser = userData ? JSON.parse(userData) : user
    
    if (!currentUser?.email) {
      console.log('No user email for refresh')
      return
    }
    
    try {
      console.log('Refreshing user data for email:', currentUser.email)
      
      // Используем GET метод с email параметром
      const response = await fetch(`/api/user-profile?email=${encodeURIComponent(currentUser.email)}`, {
        method: 'GET'
      })
      
      const result = await response.json()
      console.log('Refresh API response:', result)
      console.log('Profile data from API:', {
        plan: result.profile?.plan,
        checks_limit: result.profile?.checks_limit,
        checks_used: result.profile?.checks_used,
        checksLimit: result.profile?.checksLimit,
        checksUsed: result.profile?.checksUsed
      })

      if (response.ok && result.ok && result.profile) {
        const { plan: normalizedPlan, limit: defaultLimit, rawPlan } = resolvePlanFromParam(result.profile.rawPlan ?? result.profile.plan)
        const resolvedChecksLimit = result.profile.checksLimit ?? result.profile.checks_limit ?? defaultLimit
        const resolvedChecksUsed = result.profile.checksUsed ?? result.profile.checks_used ?? 0
        const updatedUser = {
          ...currentUser,
          name: result.profile.name || currentUser.name,
          phone: result.profile.phone || currentUser.phone,
          plan: normalizedPlan,
          rawPlan,
          checksLimit: resolvedChecksLimit,
          checksUsed: resolvedChecksUsed
        }
        
        console.log('Updating user with fresh data:', updatedUser)
        console.log('Final user state:', {
          plan: updatedUser.plan,
          checksLimit: updatedUser.checksLimit,
          checksUsed: updatedUser.checksUsed
        })
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
      } else {
        console.error('Failed to refresh user data:', result)
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }, [])

  useEffect(() => {
    const maybeRefreshPendingPayment = async () => {
      try {
        const pendingRaw = localStorage.getItem('pending_payment')
        if (!pendingRaw) {
          return
        }

        const pending = JSON.parse(pendingRaw)
        const startedAt = typeof pending?.startedAt === 'number' ? pending.startedAt : null
        if (startedAt && Date.now() - startedAt > 1000 * 60 * 30) {
          localStorage.removeItem('pending_payment')
          return
        }

        await refreshUserData()

        try {
          const storedUserRaw = localStorage.getItem('user')
          if (storedUserRaw) {
            const storedUser = JSON.parse(storedUserRaw)
            if (pending?.plan) {
              const { plan: normalizedPlan } = resolvePlanFromParam(pending.plan)
              if (storedUser?.plan === normalizedPlan) {
                localStorage.removeItem('pending_payment')
              }
            } else {
              localStorage.removeItem('pending_payment')
            }
          }
        } catch (error) {
          console.error('Unable to reconcile pending payment state:', error)
        }
      } catch (error) {
        console.error('Failed to process pending payment refresh:', error)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        maybeRefreshPendingPayment()
      }
    }

    const handleWindowFocus = () => {
      maybeRefreshPendingPayment()
    }

    maybeRefreshPendingPayment()

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    checkAuthStatus()
    
    // Добавляем слушатель для обновлений данных пользователя из других вкладок
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue)
          console.log('User data updated from another tab:', updatedUser)
          setUser(updatedUser)
          setIsAuthenticated(updatedUser.isAuthenticated)
        } catch (error) {
          console.error('Error parsing updated user data:', error)
        }
      }
      
      // Обрабатываем команду обновления данных
      if (e.key === 'refresh_user_data' && e.newValue === 'true') {
        console.log('Refresh command received from another tab')
        // Передадим обработку в другой useEffect, где refreshUserData уже доступна
        setUser(prevUser => {
          if (prevUser?.id) {
            // Используем setTimeout чтобы вызвать refreshUserData асинхронно
            setTimeout(() => {
              const userData = localStorage.getItem("user")
              if (userData) {
                const currentUser = JSON.parse(userData)
                if (currentUser?.id) {
                  // Здесь вызовем refreshUserData через отдельный механизм
                  window.dispatchEvent(new CustomEvent('refreshUserData'))
                }
              }
            }, 500)
          }
          return prevUser
        })
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
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
    const { plan: normalizedPlan, limit: defaultLimit, rawPlan } = resolvePlanFromParam(userData.rawPlan ?? userData.plan)
    const plan = normalizedPlan
    const userWithDefaults = {
      ...userData,
      plan,
      rawPlan,
      checksUsed: userData.checksUsed ?? 0,
      checksLimit: userData.checksLimit ?? defaultLimit
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
      const { plan: normalizedPlan, limit } = resolvePlanFromParam(plan)
      const updatedUser = {
        ...user,
        plan: normalizedPlan,
        rawPlan: plan,
        checksLimit: limit,
        checksUsed: 0 // Сбрасываем счетчик при покупке нового тарифа
      }
      console.log('Updating user plan locally:', updatedUser)
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }



  // Отдельный useEffect для обработки событий обновления данных
  useEffect(() => {
    const handleRefreshEvent = () => {
      console.log('Custom refresh event received')
      refreshUserData()
    }
    
    window.addEventListener('refreshUserData', handleRefreshEvent)
    return () => window.removeEventListener('refreshUserData', handleRefreshEvent)
  }, [refreshUserData])

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
