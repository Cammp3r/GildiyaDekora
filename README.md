# Гільдія Декора

## Что уже сделано

- Фронтенд на Vite/React.
- Новый backend на Node.js + Express + Prisma.
- База данных под заказы: PostgreSQL.
- Платёжный поток LiqPay через `/api/payment/init` и `/api/payment/callback`.
- Админский просмотр заказов через `/admin/orders`.

## Локальный запуск

1. Установи зависимости фронта в корне проекта.
2. Установи зависимости backend-а:

```bash
cd server
npm install
```

3. Создай `server/.env` по примеру `server/.env.example`.
4. Подними PostgreSQL и заполни `DATABASE_URL`.
5. Прогони миграции Prisma:

```bash
cd server
npx prisma migrate dev --name init
```

6. Запусти backend:

```bash
cd server
npm run dev
```

7. Запусти фронтенд в корне:

```bash
npm run dev
```

## Что настроить на хостинге

### Backend

Размести `server/` на Node-хостинге, который умеет работать с PostgreSQL, например Render, Railway, Fly.io или VPS.

Нужные переменные окружения:

- `DATABASE_URL`
- `FRONTEND_URL`
- `PUBLIC_API_URL`
- `LIQPAY_PUBLIC_KEY`
- `LIQPAY_PRIVATE_KEY`
- `LIQPAY_SANDBOX`
- `LIQPAY_WEBHOOK_URL`
- `ADMIN_API_TOKEN`

После деплоя backend-а:

1. Выполни `npx prisma migrate deploy`.
2. Укажи в LiqPay callback/webhook URL вида `https://<backend-domain>/api/payment/callback`.
3. Проверь `https://<backend-domain>/api/health`.

### Frontend

На Netlify задай:

- `VITE_API_URL=https://<backend-domain>/api`

Если домен backend-а изменится, обнови и redirect `/api/*` в `netlify.toml`.

## Как смотреть заказы

Есть два способа:

1. Открыть админку сайта: `/admin/orders`, ввести `ADMIN_API_TOKEN`.
2. Смотреть таблицы напрямую в PostgreSQL через Supabase/Render/Neon dashboard или Prisma Studio.

## Поток оплаты

1. Пользователь нажимает «Перейти до оплати».
2. Фронт отправляет корзину и контакты на backend.
3. Backend проверяет товары по каталогу, создаёт заказ в Postgres и возвращает `data` + `signature`.
4. Фронт открывает LiqPay checkout во встроенном окне.
5. LiqPay шлёт callback на backend.
6. Backend проверяет подпись и меняет статус заказа на `paid` или `failed`.
