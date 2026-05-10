# 📋 Детальный План Интеграции LiqPay

## ✅ Этап 1: Подготовка Backend (10-15 мин)

### 1.1 Установить зависимости
```bash
cd server
npm install
```

### 1.2 Создать `.env` файл
```bash
cp .env.example .env
```

**Заполнить `.env`:**
```env
SERVER_PORT=5000
NODE_ENV=development

# Получить отсюда: https://www.liqpay.ua/uk/admin (раздел API)
LIQPAY_PUBLIC_KEY=pk_xxxxxxxxxxxxxxxxx
LIQPAY_PRIVATE_KEY=sk_xxxxxxxxxxxxxxxxx
LIQPAY_SANDBOX=1

DATABASE_URL=file:./dev.db

FRONTEND_URL=http://localhost:5173

LIQPAY_WEBHOOK_URL=http://localhost:5000/api/payment/webhook
```

### 1.3 Инициализировать Prisma и БД
```bash
npm run prisma:generate
npm run prisma:migrate
```

Это создаст:
- `dev.db` (SQLite база)
- Папку `prisma/migrations`

### 1.4 Запустить backend
```bash
npm run dev
```

Должно вывести: `🚀 Server running on http://localhost:5000`

**Проверить что работает:**
```bash
curl http://localhost:5000/health
# Ответ: {"status":"ok"}
```

---

## ✅ Этап 2: Frontend Setup (10 мин)

### 2.1 Обновить `vite.config.js` (если нужно)

Убедитесь что `vite.config.js` содержит:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

Это перенаправляет все запросы `/api` на backend.

### 2.2 Создать переменные окружения фронтенда

Создайте `.env` (в корне проекта, рядом с `package.json`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 2.3 Обновить `src/App.jsx` - добавить маршрут

Найдите где определяются routes и добавьте:
```jsx
import CheckoutPage from './pages/CheckoutPage'

// В компоненте routes (например, в BrowserRouter):
<Route path="/checkout" element={<CheckoutPage />} />
```

Если используете структуру типа:
```jsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Существующие routes */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        
        {/* Добавить ↓ */}
        <Route path="/checkout" element={<CheckoutPage />} />
        
        {/* Остальные */}
      </Routes>
    </BrowserRouter>
  )
}
```

### 2.4 Обновить `src/pages/CartPage.jsx` - кнопка оплаты

Найдите финальную кнопку "Оформить заказ" и замените на:
```jsx
import { Link } from 'react-router-dom'

// В компоненте CartPage:
<Link to="/checkout" className="checkout-button">
  Перейти до оплати
</Link>
```

---

## ✅ Этап 3: Интеграция Checkout (5 мин)

CheckoutPage уже готова и использует:
- `usePayment()` hook для API запросов
- `useCart()` для данных корзины
- Форму для данных покупателя

**Что должно происходить:**

1. Пользователь попадает на `/checkout`
2. Видит форму и зведення замовлення
3. Заполняет ім'я, email, телефон
4. Нажимает "Перейти до оплати"
5. Фронтенд запрашивает `POST /api/payment/create-order`
6. Backend возвращает `data` и `signature`
7. Фронтенд отправляет форму на `https://www.liqpay.ua/api/3/checkout`
8. LiqPay открывает окно оплаты
9. После оплаты пользователь видит результат

---

## ✅ Этап 4: Тестирование (15-20 мин)

### 4.1 Запустить оба сервера
Terminal 1:
```bash
cd server
npm run dev
```

Terminal 2:
```bash
npm run dev  # Фронтенд
```

### 4.2 Тест 1: Проверить API endpoints

**Тест create-order:**
```bash
curl -X POST http://localhost:5000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "1",
        "title": "Тестовый товар",
        "quantity": 1,
        "price": 100
      }
    ],
    "customerName": "Тест",
    "customerEmail": "test@test.com",
    "customerPhone": "+38 (099) 123-45-67"
  }'
```

Должен вернуть:
```json
{
  "success": true,
  "data": "base64_encoded_data_here",
  "signature": "signature_hash_here",
  "orderId": "ORD-1234567890-ABC123"
}
```

### 4.3 Тест 2: Пройти полный flow в браузере

1. Откройте `http://localhost:5173`
2. Добавьте товар в корзину
3. Перейдите на `/checkout` (или нажмите кнопку "Перейти до оплати")
4. Заполните форму
5. Нажмите "Перейти до оплати"
6. Должны перенаправить на LiqPay checkout

**В SANDBOX режиме тестовые карты:**
- Успешно: `4242 4242 4242 4242` (любая дата в будущем, любой CVC)
- Отклонено: `4111 1111 1111 1111`

### 4.4 Проверить БД

```bash
npm run prisma:studio
# Откроется web interface на http://localhost:5555
# Там видите таблицы Order и PaymentLog
```

---

## ✅ Этап 5: Обработка Webhook (ВАЖНО!)

Webhook — это уведомление от LiqPay после платежа.

### 5.1 Локальное тестирование webhook

Используйте **ngrok** чтобы expose локальный сервер:

```bash
# Установить ngrok: https://ngrok.com/download
# Или через Chocolatey (Windows):
choco install ngrok

# Запустить ngrok
ngrok http 5000
```

Выведет что-то типа:
```
Forwarding                    https://xxxxx-xx-xxx-xxxx.ngrok.io -> http://localhost:5000
```

### 5.2 Обновить LiqPay Webhook URL

1. Откройте LiqPay админ: https://www.liqpay.ua/uk/admin
2. Перейдите в API → Webhooks
3. Установите URL:
   ```
   https://xxxxx-xx-xxx-xxxx.ngrok.io/api/payment/webhook
   ```
4. Сохраните

### 5.3 Тестировать webhook вручную

```bash
# Сгенерируйте test данные
# Используйте Postman или curl:

curl -X POST http://localhost:5000/api/payment/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "data=<base64_data>&signature=<signature>"
```

Проверьте что в `PaymentLog` появилась запись.

---

## ✅ Этап 6: Дополнительные Интеграции (опционально)

### 6.1 Email уведомления после платежа

**Обновить `server/src/routes/payment.js` - добавить после обновления статуса:**

```javascript
// После строки: await prisma.order.update(...)

if (newStatus === 'paid') {
  // Отправить email
  await sendOrderConfirmationEmail(order.customerEmail, {
    orderId: order_id,
    amount: order.amount,
    customerName: order.customerName,
  })
}
```

Используйте nodemailer или Mailgun API.

### 6.2 Страница успешного платежа

Создайте `src/pages/PaymentSuccessPage.jsx`:
```jsx
export default function PaymentSuccessPage() {
  const { orderId } = useParams()
  
  return (
    <section className="payment-success">
      <h2>✅ Платіж успішний!</h2>
      <p>Номер замовлення: {orderId}</p>
      <p>Ми надішлемо деталі на ваш email</p>
      <Link to="/products">Продовжити покупки</Link>
    </section>
  )
}
```

Добавьте в `App.jsx`:
```jsx
<Route path="/payment/success/:orderId" element={<PaymentSuccessPage />} />
```

### 6.3 Сторінка помилки платежа

```jsx
export default function PaymentFailedPage() {
  return (
    <section className="payment-failed">
      <h2>❌ Платіж не пройшов</h2>
      <p>Будь ласка, спробуйте ще раз</p>
      <Link to="/checkout">Повернутися до оформлення</Link>
    </section>
  )
}
```

---

## ✅ Этап 7: Production (Перед запуском на сервер)

### 7.1 Обновить переменні для production

`.env.production`:
```env
SERVER_PORT=5000
NODE_ENV=production

LIQPAY_PUBLIC_KEY=pk_xxxxxxxxx  # реальные ключи
LIQPAY_PRIVATE_KEY=sk_xxxxxxxxx  # реальные ключи
LIQPAY_SANDBOX=0  # ВАЖНО: 0 для production!

DATABASE_URL=postgresql://user:password@host:port/dbname

FRONTEND_URL=https://yourdomain.com

LIQPAY_WEBHOOK_URL=https://yourdomain.com/api/payment/webhook
```

### 7.2 Переходить на PostgreSQL

**Обновить `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"  # было "sqlite"
  url      = env("DATABASE_URL")
}
```

**Примеры DATABASE_URL:**
```
postgresql://user:password@localhost:5432/gildiya_dekora
postgresql://user:password@db.host.com:5432/gildiya_dekora
```

**Мигрировать:**
```bash
npm run prisma:migrate
```

### 7.3 Отримати реальні ключи LiqPay

1. Зареєструйтесь на https://www.liqpay.ua
2. Перейдіть в Кабінет → API
3. Скопіюйте Public Key и Private Key
4. Добавьте в `.env.production`

### 7.4 Обновить webhook URL на сервер

В LiqPay админ:
```
https://yourdomain.com/api/payment/webhook
```

### 7.5 Додати rate limiting

В `server/src/index.js`:
```javascript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit 100 requests per windowMs
})

app.use('/api/', limiter)

// Більш строгий для webhook
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 50,
})

app.use('/api/payment/webhook', webhookLimiter)
```

Потім встановити пакет:
```bash
npm install express-rate-limit
```

### 7.6 HTTPS only

В `server/src/index.js`:
```javascript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`)
  }
  next()
})
```

### 7.7 Security headers

```javascript
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})
```

---

## 📊 Чек-лист

### Development
- [ ] npm install (backend)
- [ ] Копія .env з правильними ключами
- [ ] prisma:migrate
- [ ] Backend запущено (npm run dev)
- [ ] Frontend запущено (npm run dev)
- [ ] Маршрут /checkout добавлено в App.jsx
- [ ] Кнопка на CartPage → /checkout
- [ ] Тест 1: create-order API
- [ ] Тест 2: Full checkout flow
- [ ] Тест 3: Webhook (через ngrok)
- [ ] PaymentSuccessPage (опционально)
- [ ] PaymentFailedPage (опционально)

### Production
- [ ] Переходить на PostgreSQL
- [ ] Реальні ключи LiqPay в .env
- [ ] LIQPAY_SANDBOX=0
- [ ] Webhook URL на реальний домен
- [ ] Rate limiting
- [ ] HTTPS
- [ ] Security headers
- [ ] Email notifications (опционально)
- [ ] Backup БД налаштована
- [ ] Логирование платежей
- [ ] Monitoring (Sentry, New Relic, тощо)

---

## 🆘 Типові Помилки

| Помилка | Рішення |
|---------|--------|
| "Invalid signature" | Перевірте `LIQPAY_PRIVATE_KEY` в `.env` |
| "Order not found" in webhook | Впевніться `prisma:migrate` був виконаний |
| CORS error | Обновіть `FRONTEND_URL` в `.env` |
| Webhook не приходить | URL повинен бути публічний (HTTPS). Використайте ngrok для dev |
| "Cannot find module 'express'" | Запустіть `npm install` в папці `server/` |
| Database locked (SQLite) | Перезапустіть процес. Для production використайте PostgreSQL |
| 502 Bad Gateway | Backend не запущено або не слухає на правильному порту |

---

## 📞 Корисні посилання

- [LiqPay API Docs](https://www.liqpay.ua/uk/documentation)
- [LiqPay Admin](https://www.liqpay.ua/uk/admin)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Express Docs](https://expressjs.com/)
- [ngrok](https://ngrok.com/)

---

## 🎯 Дальші Кроки

Після успішної інтеграції:

1. **Додати аналітику платежів** — графіки доходу, кількість замовлень
2. **Систему управління замовленнями** — админ панель для перегляду і статусу
3. **Автоматичні email** — підтвердження, напомини, счеты
4. **Повернення грошей** — обробка рефундів
5. **多-валютна оплата** — якщо потрібно експортувати
6. **Subscription payments** — періодичні платежі
7. **Аналітика конверсії** — відстежувати де користувачі залишаються

Вдалих платежів! 🚀
