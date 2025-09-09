"use client"

import { useEffect } from "react"

export default function RedirectPage() {
  useEffect(() => {
    // Пытаемся открыть в родительском окне
    if (window.parent && window.parent !== window) {
      window.parent.location.href = '/dashboard'
    } else {
      // Если не в iframe, просто перенаправляем
      window.location.href = '/dashboard'
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Оплата успешна!</h1>
        <p className="text-gray-600 mb-4">Перенаправляем в личный кабинет...</p>
        <a 
          href="/dashboard" 
          className="text-blue-600 hover:underline"
          onClick={(e) => {
            e.preventDefault()
            if (window.parent && window.parent !== window) {
              window.parent.location.href = '/dashboard'
            } else {
              window.location.href = '/dashboard'
            }
          }}
        >
          Перейти в личный кабинет вручную
        </a>
      </div>
    </div>
  )
}