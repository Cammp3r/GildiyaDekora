# GildiyaDekora Backend

Минимальный backend для сайта GildiyaDekora.

## Переменные окружения

Локально используй `.env` по примеру `.env.example`:

```bash
SERVER_PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=file:./dev.db
LIQPAY_PUBLIC_KEY=...
LIQPAY_PRIVATE_KEY=...
LIQPAY_SANDBOX=1
LIQPAY_WEBHOOK_URL=http://localhost:5000/api/payment/webhook
```

Для деплоя:

- `Render` (backend): `SERVER_PORT`, `NODE_ENV=production`, `FRONTEND_URL`, `DATABASE_URL`, `LIQPAY_PUBLIC_KEY`, `LIQPAY_PRIVATE_KEY`, `LIQPAY_SANDBOX`, `LIQPAY_WEBHOOK_URL`
- `Netlify` (frontend): `VITE_API_URL=https://<your-render-service>.onrender.com/api`

Если фронтенд и бэкенд уже задеплоены, проверь, что `FRONTEND_URL` и `VITE_API_URL` указывают на реальные домены.

## Запуск

```bash
cd server
npm install
npm run dev
```

Сервер по умолчанию слушает `http://localhost:5000` и отдаёт `/health`.

## Проверка оплаты

1. Открой `/checkout` и создай тестовый заказ.
2. Убедись, что `POST /api/payment/create-order` возвращает `orderId`, `data` и `signature`.
3. После редиректа в LiqPay проверь серверные логи: должен прийти `POST /api/payment/webhook`.
4. Проверь запись в БД: статус заказа должен стать `paid` или `failed`, а в `PaymentLog` появится запись.

Локально можно смотреть БД через Prisma Studio:

```bash
cd server
npx prisma studio
```
