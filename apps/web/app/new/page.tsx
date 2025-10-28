"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Phone, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  User,
  FileText,
  Lock,
  Mail
} from "lucide-react"

export default function NewLandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Здесь будет отправка заявки
      await new Promise(resolve => setTimeout(resolve, 2000)) // Имитация отправки
      setIsSubmitted(true)
    } catch (error) {
      console.error('Ошибка отправки заявки:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">DataTrace</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-blue-600">8 (800) 555-0123</p>
              <p className="text-sm text-gray-600">Бесплатная консультация</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Защитите себя от мошенников
          </h1>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Ваши персональные данные могут быть в открытом доступе. 
            Мошенники используют их для обмана и кражи денег.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-red-800">Внимание!</h2>
            </div>
            <p className="text-lg text-red-700">
              Если вам звонят незнакомцы и знают ваши данные — это мошенники!
            </p>
          </div>
        </div>
      </section>

      {/* Dangers Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Какие данные утекают и чем это опасно
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="text-center">
                <Phone className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <CardTitle className="text-lg text-red-800">Номер телефона</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">
                  Мошенники звонят и представляются банком, знают ваше имя и данные
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                <CardTitle className="text-lg text-orange-800">Паспортные данные</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700">
                  Оформляют кредиты и займы на ваше имя без вашего ведома
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="text-center">
                <User className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <CardTitle className="text-lg text-purple-800">ИНН и СНИЛС</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-700">
                  Получают доступ к госуслугам, налоговой, пенсионному фонду
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="text-center">
                <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <CardTitle className="text-lg text-blue-800">Банковские данные</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">
                  Списывают деньги, оформляют карты и кредиты
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How Scammers Work */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Как действуют мошенники
          </h2>
          
          <div className="space-y-6">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 rounded-full p-2">
                    <span className="text-red-600 font-bold text-lg">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Звонок "из банка"</h3>
                    <p className="text-gray-700">
                      Звонят и говорят: "Здравствуйте, [ваше имя], это банк [название]. 
                      На вашу карту пытаются списать деньги, нужно срочно заблокировать!"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 rounded-full p-2">
                    <span className="text-orange-600 font-bold text-lg">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Создают панику</h3>
                    <p className="text-gray-700">
                      "У вас осталось 5 минут! Мошенники уже списывают деньги! 
                      Быстро назовите код из СМС для защиты!"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 rounded-full p-2">
                    <span className="text-purple-600 font-bold text-lg">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Получают доступ</h3>
                    <p className="text-gray-700">
                      Получив код из СМС, они получают полный доступ к вашим деньгам 
                      и могут оформить кредиты на ваше имя.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">
            Мы поможем защитить ваши данные
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Найдем утечки</h3>
              <p className="text-blue-100">
                Проверим все базы данных и найдем ваши персональные данные
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Удалим данные</h3>
              <p className="text-blue-100">
                Подадим заявки на удаление ваших данных из всех найденных источников
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Защитим навсегда</h3>
              <p className="text-blue-100">
                Настроим постоянный мониторинг и будем удалять новые утечки
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Оставьте заявку на защиту
          </h2>
          
          {isSubmitted ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-2">Заявка отправлена!</h3>
                <p className="text-green-700 text-lg">
                  Наш специалист свяжется с вами в течение 30 минут
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Бесплатная консультация</CardTitle>
                <p className="text-center text-gray-600">
                  Заполните форму и мы проверим ваши данные бесплатно
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ваше имя *
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Введите ваше имя"
                      required
                      className="text-lg py-3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Номер телефона *
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+7 (999) 123-45-67"
                      required
                      className="text-lg py-3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (необязательно)
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="text-lg py-3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Опишите вашу ситуацию
                    </label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Например: Мне звонят мошенники и знают мои данные..."
                      rows={4}
                      className="text-lg"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4"
                  >
                    {isSubmitting ? "Отправляем..." : "Получить бесплатную консультацию"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Warning Section */}
      <section className="py-12 px-4 bg-red-50">
        <div className="max-w-4xl mx-auto">
          <Alert className="border-red-200 bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 text-lg">
              <strong>Помните:</strong> Настоящие банки НИКОГДА не просят назвать коды из СМС по телефону! 
              Если вам звонят и просят код — это мошенники!
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Shield className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">DataTrace</span>
          </div>
          <p className="text-gray-400 mb-4">
            Защита персональных данных от мошенников
          </p>
          <div className="text-xl font-semibold text-blue-400 mb-2">
            8 (800) 555-0123
          </div>
          <p className="text-gray-400">
            Звонок бесплатный, работаем круглосуточно
          </p>
        </div>
      </footer>
    </div>
  )
}