"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TestPaymentPage() {
  const testUrls = [
    "/payment/success?plan=basic&email=test@example.com",
    "/payment/success?plan=professional-6m&email=test@example.com",
    "/payment/success?plan=professional-12m&email=test@example.com"
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Тест страницы успешной оплаты</h1>
        
        <div className="space-y-4">
          {testUrls.map((url, index) => (
            <Link key={index} href={url}>
              <Button className="w-full" variant="outline">
                Тест {index + 1}: {url.includes('basic') ? 'Базовый' : url.includes('6m') ? 'Проф 6м' : 'Проф 12м'}
              </Button>
            </Link>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t">
          <Link href="/">
            <Button variant="ghost" className="w-full">
              Назад на главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}