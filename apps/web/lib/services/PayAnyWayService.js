const crypto = require('crypto');

class PayAnyWayService {
  constructor() {
    this.MNT_ID = process.env.PAYANYWAY_MNT_ID;
    this.MNT_INTEGRITY_CODE = process.env.PAYANYWAY_INTEGRITY_CODE;
    this.MNT_TEST_MODE = process.env.NODE_ENV === 'development' ? '1' : '0';
    this.PAYMENT_URL = 'https://payanyway.ru/assistant.htm';
  }

  isConfigured() {
    return !!(this.MNT_ID && this.MNT_INTEGRITY_CODE);
  }

  // Создание ссылки на оплату
  createPaymentUrl(params) {
    const {
      amount,
      transactionId,
      description,
      subscriberId,
      successUrl,
      failUrl
    } = params;

    const paymentParams = {
      MNT_ID: this.MNT_ID,
      MNT_AMOUNT: amount.toFixed(2),
      MNT_TRANSACTION_ID: transactionId,
      MNT_CURRENCY_CODE: 'RUB',
      MNT_TEST_MODE: this.MNT_TEST_MODE,
      MNT_DESCRIPTION: description,
      MNT_SUBSCRIBER_ID: subscriberId,
      MNT_SUCCESS_URL: successUrl,
      MNT_FAIL_URL: failUrl
    };

    // Создаем подпись
    const signature = this.createSignature([
      paymentParams.MNT_ID,
      paymentParams.MNT_TRANSACTION_ID,
      paymentParams.MNT_AMOUNT,
      paymentParams.MNT_CURRENCY_CODE,
      paymentParams.MNT_SUBSCRIBER_ID,
      paymentParams.MNT_TEST_MODE,
      this.MNT_INTEGRITY_CODE
    ]);

    paymentParams.MNT_SIGNATURE = signature;

    // Формируем URL
    const urlParams = new URLSearchParams(paymentParams);
    return `${this.PAYMENT_URL}?${urlParams.toString()}`;
  }

  // Проверка подписи Pay URL уведомления
  verifyPaymentNotification(params) {
    const {
      MNT_ID,
      MNT_TRANSACTION_ID,
      MNT_OPERATION_ID,
      MNT_AMOUNT,
      MNT_CURRENCY_CODE,
      MNT_SUBSCRIBER_ID,
      MNT_TEST_MODE,
      MNT_SIGNATURE
    } = params;

    const expectedSignature = this.createSignature([
      MNT_ID,
      MNT_TRANSACTION_ID,
      MNT_OPERATION_ID,
      MNT_AMOUNT,
      MNT_CURRENCY_CODE,
      MNT_SUBSCRIBER_ID,
      MNT_TEST_MODE,
      this.MNT_INTEGRITY_CODE
    ]);

    return expectedSignature === MNT_SIGNATURE;
  }

  // Создание подписи для Check URL ответа
  createCheckResponse(params) {
    const {
      transactionId,
      amount,
      resultCode = '402',
      description = 'Заказ готов к оплате'
    } = params;

    const response = {
      id: this.MNT_ID,
      transactionId,
      amount: amount.toFixed(2),
      resultCode,
      description
    };

    // Создаем подпись для ответа
    response.signature = this.createSignature([
      response.resultCode,
      response.id,
      response.transactionId,
      this.MNT_INTEGRITY_CODE
    ]);

    return response;
  }

  // Создание MD5 подписи
  createSignature(params) {
    const concatenated = params.join('');
    return crypto.createHash('md5').update(concatenated).digest('hex');
  }

  // Парсинг transaction ID (может содержать дополнительную информацию)
  parseTransactionId(transactionId) {
    const parts = transactionId.split('|');
    return {
      orderId: parts[0],
      timestamp: parts[1] || null,
      userId: parts[2] || null
    };
  }

  // Создание transaction ID
  createTransactionId(orderId, userId) {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    return `${orderId}|${timestamp}|${userId}`;
  }
}

module.exports = PayAnyWayService;