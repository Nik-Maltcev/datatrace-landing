'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PhoneVerificationProps {
  onVerified: (token: string) => void;
  isVerified: boolean;
}

export default function PhoneVerification({ onVerified, isVerified }: PhoneVerificationProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugCode, setDebugCode] = useState(''); // Для режима разработки
  const [botUsername, setBotUsername] = useState(''); // Имя бота для инструкций
  const [otpSent, setOtpSent] = useState(false); // Был ли код отправлен в Telegram

  const sendCode = async () => {
    if (!phone.trim()) {
      setError('Введите номер телефона');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/telegram-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setBotUsername(data.botUsername || '');
        setOtpSent(data.otpSent || false);
        
        if (data.otpSent) {
          setStep('code');
          setSuccess('Код отправлен в Telegram!');
        } else if (data.botUsername) {
          setStep('code'); // Переходим к коду даже если не отправлен
          setSuccess(`Привяжите номер к боту @${data.botUsername}, затем нажмите "Отправить код еще раз"`);
        } else {
          setStep('code');
          setSuccess('Код сгенерирован');
        }
        
        // В режиме разработки показываем код
        if (data.debug_code) {
          setDebugCode(data.debug_code);
        }
      } else {
        setError(data.error || 'Ошибка отправки кода');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      setError('Введите код подтверждения');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/telegram-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phone.trim(), 
          code: code.trim(), 
          sessionId 
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Номер успешно подтвержден!');
        // Сохраняем токен в localStorage
        localStorage.setItem('phone_verification_token', data.token);
        localStorage.setItem('verified_phone', phone.trim());
        onVerified(data.token);
      } else {
        setError(data.error || 'Неверный код');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setPhone('');
    setCode('');
    setSessionId('');
    setStep('phone');
    setError('');
    setSuccess('');
    setDebugCode('');
    setBotUsername('');
    setOtpSent(false);
    localStorage.removeItem('phone_verification_token');
    localStorage.removeItem('verified_phone');
  };

  const resendCode = async () => {
    if (!phone.trim()) {
      setError('Номер телефона не указан');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/telegram-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setOtpSent(data.otpSent || false);
        
        if (data.otpSent) {
          setSuccess('Новый код отправлен в Telegram!');
        } else {
          setSuccess('Код сгенерирован. Привяжите номер к боту для получения в Telegram.');
        }
        
        if (data.debug_code) {
          setDebugCode(data.debug_code);
        }
      } else {
        setError(data.error || 'Ошибка повторной отправки');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Номер подтвержден
          </CardTitle>
          <CardDescription>
            Ваш номер {localStorage.getItem('verified_phone')} успешно подтвержден
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-green-600">
              <Shield className="h-4 w-4 mr-1" />
              Верифицирован
            </Badge>
            <Button variant="outline" size="sm" onClick={resetVerification}>
              Сменить номер
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Подтверждение номера телефона
        </CardTitle>
        <CardDescription>
          Для защиты от злоупотреблений необходимо подтвердить ваш номер телефона через Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Ваш номер телефона
              </label>
              <Input
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mb-4"
              />
            </div>
            <Button onClick={sendCode} disabled={loading} className="w-full">
              {loading ? 'Отправка...' : 'Отправить код в Telegram'}
            </Button>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Код подтверждения из Telegram
              </label>
              <Input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="mb-4"
              />
              {debugCode && (
                <div className="text-sm text-blue-600 p-2 bg-blue-50 rounded-md mb-2">
                  <strong>Режим разработки:</strong> Код для тестирования: {debugCode}
                </div>
              )}
              
              {botUsername && !otpSent && (
                <div className="text-sm text-orange-600 p-3 bg-orange-50 rounded-md mb-2">
                  <div className="font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Настройте Telegram бота:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-xs mb-3">
                    <li>Откройте Telegram и найдите: <strong>@{botUsername}</strong></li>
                    <li>Нажмите "Start" или отправьте <strong>/start</strong></li>
                    <li>Отправьте боту ваш номер: <strong>{phone}</strong></li>
                    <li>После привязки нажмите кнопку "Отправить код еще раз"</li>
                  </ol>
                  <Button 
                    onClick={resendCode} 
                    disabled={loading}
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    {loading ? 'Отправка...' : 'Отправить код еще раз'}
                  </Button>
                </div>
              )}
              
              {otpSent && (
                <div className="text-sm text-green-600 p-2 bg-green-50 rounded-md mb-2">
                  ✅ Код отправлен в Telegram! Проверьте чат с ботом.
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={verifyCode} disabled={loading} className="flex-1">
                {loading ? 'Проверка...' : 'Подтвердить'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setDebugCode('');
                }}
                disabled={loading}
              >
                Назад
              </Button>
            </div>
          </>
        )}

        {error && (
          <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm p-3 bg-green-50 rounded-md flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {success}
          </div>
        )}
      </CardContent>
    </Card>
  );
}