# GildiyaDekora LiqPay Payment Integration

Реализация безопасной онлайн оплаты через платежный шлюз LiqPay.

## 📋 Структура проекта

```
backend/
├── server/
│   ├── src/
│   │   ├── index.js                 # Главный entry point
│   │   ├── routes/
│   │   │   └── payment.js           # Маршруты оплаты
│   │   └── utils/
│   │       └── liqpay.js            # Утилиты LiqPay (подпись, кодирование)
│   ├── prisma/
│   │   └── schema.prisma            # Схема БД (Orders, PaymentLogs)
│   ├── package.json
│   ├── .env.example                 # Пример переменных окружения
│   └── .gitignore
│
frontend/
├── src/
│   ├── pages/
│   │   ├── CheckoutPage.jsx         # Страница оформления заказа
│   │   └── checkout.css
│   ├── hooks/
│   │   └── usePayment.js            # Hook для работы с API оплаты
│   └── cart/
│       └── CartContext.jsx          # Обновлен для текстур и цветов
```

## 🔐 Безопасность

### Endpoints

1. **POST `/api/payment/create-order`**
   - Создаёт заказ в БД со статусом `pending`
   - Генерирует LiqPay подпись на сервере (приватный ключ НИКОГДА в клиенте)
   - Возвращает `data` и `signature` для отправки на LiqPay

2. **POST `/api/payment/webhook`**
   - Получает уведомления от LiqPay
   - Проверяет подпись (защита от подделок)
   - Проверяет соответствие суммы в БД
   - Обновляет статус заказа на `paid` или `failed`
   - Логирует события в таблицу `PaymentLog`

3. **GET `/api/payment/order/:orderId`**
   - Возвращает статус заказа

### Ключевые моменты

✅ **Приватные ключи LiqPay** хранятся в `.env`, не попадают в клиент  
✅ **Валидация цен** на сервере — фронтенд не может манипулировать суммой  
✅ **Проверка подписи** для каждого webhook — защита от подделок  
✅ **Проверка суммы** — убедимся что платёж соответствует заказу  
✅ **Идемпотентность** — можно обработать webhook несколько раз безопасно  
✅ **Логирование** — все события платежей записываются в БД  
✅ **HTTPS** — используйте только HTTPS в продакшене  
✅ **Rate-limiting** — ограничить частоту запросов (добавить позже)  

## 🚀 Установка и запуск

### Backend

1. **Установите зависимости:**
   ```bash
   cd server
   npm install
   ```

2. **Настройте `.env`:**
   ```bash
   cp .env.example .env
   ```
   Отредактируйте `.env` с вашими реальными ключами LiqPay.

3. **Инициализируйте БД:**
   ```bash
   npm run prisma:migrate
   ```

4. **Запустите сервер:**
   ```bash
   npm run dev
   ```
   Сервер слушает на `http://localhost:5000`

### Frontend

1. Обновите переменную окружения (если нужна кастомная API URL):
   ```bash
   # .env или .env.local
   VITE_API_URL=http://localhost:5000/api
   ```

2. Запустите фронтенд:
   ```bash
   npm run dev
   ```

## 📊 Схема БД

### Таблица `Order`
- `id` - Primary Key
- `orderId` - Уникальный ID заказа (для LiqPay)
- `items` - JSON array с товарами
- `amount` - Сумма заказа
- `currency` - Валюта (UAH по умолчанию)
- `status` - `pending | paid | failed | cancelled`
- `customerName`, `customerEmail`, `customerPhone` - Данные покупателя
- `liqpayOrderId` - ID транзакции от LiqPay
- `createdAt`, `updatedAt` - Временные метки

### Таблица `PaymentLog`
- `id` - Primary Key
- `orderId` - ID заказа
- `action` - Тип события (webhook_received, signature_verified, status_updated, etc)
- `payload` - JSON с деталями события
- `timestamp` - Когда произошло событие

## 🔄 Flow оплаты

```
1. Пользователь заполняет форму на CheckoutPage
2. Фронтенд запрашивает POST /api/payment/create-order
3. Сервер:
   - Проверяет товары и цены
   - Создаёт заказ в БД (pending)
   - Генерирует LiqPay данные + подпись
   - Возвращает их фронтенду
4. Фронтенд отправляет форму на https://www.liqpay.ua/api/3/checkout
5. LiqPay открывает окно оплаты
6. После оплаты LiqPay отправляет webhook на POST /api/payment/webhook
7. Сервер:
   - Проверяет подпись
   - Проверяет сумму
   - Обновляет статус заказа на `paid`
8. Готово! 🎉
```

## 🧪 Тестирование

### Sandbox режим LiqPay

Используйте тестовые ключи и установите `LIQPAY_SANDBOX=1` в `.env`:

```
LIQPAY_PUBLIC_KEY=test_public_key
LIQPAY_PRIVATE_KEY=test_private_key
LIQPAY_SANDBOX=1
```

Тестовые карты (в sandbox):
- Успешная: 4242 4242 4242 4242
- Отклонённая: 4111 1111 1111 1111

### Проверить webhook локально

Используйте ngrok или Postman:

```bash
curl -X POST http://localhost:5000/api/payment/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "data=YOUR_BASE64_DATA&signature=YOUR_SIGNATURE"
```

## 📝 Дополнительно

### Обновить CartContext

В `usePayment.js` хук передаёт товары с полями:
- `id` - ID продукта
- `title` - Название
- `quantity` - Кол-во
- `price` - Цена за единицу
- `volume` - Объём (если есть)
- `texture` - Выбранная текстура
- `color` - Выбранный цвет

### Развёртывание на production

1. Используйте реальные ключи LiqPay (не тестовые)
2. Установите `LIQPAY_SANDBOX=0`
3. Обновите webhook URL на URL вашего хоста: `https://yourdomain.com/api/payment/webhook`
4. Используйте PostgreSQL вместо SQLite: обновите `DATABASE_URL` в `.env`
5. Добавьте rate-limiting и CSRF protection
6. Включите HTTPS на всех endpoints
7. Регулярно проверяйте логи платежей в `PaymentLog`

## 🆘 Troubleshooting

**"Invalid signature"** — проверьте `LIQPAY_PRIVATE_KEY`  
**"Order not found"** — убедитесь что БД создана (`npm run prisma:migrate`)  
**Webhook не приходит** — проверьте что webhook URL публичен и доступен  
**"CORS error"** — убедитесь что `FRONTEND_URL` совпадает с вашим фронтенд URL  

## 📞 Контакты

При вопросах по интеграции обратитесь в LiqPay поддержку: https://www.liqpay.ua
