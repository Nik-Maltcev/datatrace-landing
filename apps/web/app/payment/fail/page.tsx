"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, Database } from "lucide-react"
import Link from "next/link"

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Database className="h-8 w-8 text-black" />
            <span className="text-xl font-bold text-black">DataTrace</span>
          </div>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Ошибка оплаты
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            К сожалению, произошла ошибка при обработке платежа. Попробуйте еще раз или обратитесь в поддержку.
          </p>
          <div className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full bg-black text-white hover:bg-gray-800">
                Попробовать снова
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                На главную
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}