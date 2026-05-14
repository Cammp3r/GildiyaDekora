# Чек-лист деплою LiqPay

## Перед деплоєм
- [ ] Переконатися, що `server/.env` містить реальні LiqPay public/private keys
- [ ] Встановити `LIQPAY_SANDBOX=0` для production
- [ ] Встановити `NODE_ENV=production`
- [ ] Вказати `FRONTEND_URL` на реальний домен сайту
- [ ] Вказати `LIQPAY_WEBHOOK_URL` на реальний публічний webhook URL
- [ ] Переконатися, що `DATABASE_URL` вказує на production-базу
- [ ] Виконати `npm run prisma:generate` у `server/`
- [ ] Виконати `npm run prisma:migrate` у `server/`
- [ ] Перевірити, що `server` стартує без помилок
- [ ] Перевірити, що фронтенд збирається через `npm run build`

## LiqPay admin
- [ ] Додати production webhook URL у LiqPay admin
- [ ] Перевірити, що public key збігається з production-додатком
- [ ] Перевірити, що private key збігається з production-додатком
- [ ] Підтвердити, що sandbox mode вимкнено у налаштуваннях LiqPay admin

## Smoke tests
- [ ] Відкрити сайт і додати хоча б один товар у кошик
- [ ] Перейти на `/checkout`
- [ ] Надіслати тестове замовлення і підтвердити, що `/api/payment/create-order` повертає `success: true`
- [ ] Переконатися, що відкривається LiqPay checkout form
- [ ] Успішно завершити sandbox-платіж
- [ ] Переконатися, що статус замовлення оновлено на `paid`
- [ ] Переконатися, що webhook-логи записуються в `PaymentLog`
- [ ] Переконатися, що шлях помилки платежу працює і повертає на checkout

## Безпека і захист
- [ ] Залишити HTTPS увімкненим у production
- [ ] Переконатися, що rate limiting активний для `/api`
- [ ] Переконатися, що webhook endpoint обмежений окремо
- [ ] Переконатися, що security headers присутні у відповідях
- [ ] Переконатися, що reverse proxy або платформа передає правильні protocol headers

## Реліз
- [ ] Зробити резервну копію production-бази
- [ ] Задеплоїти зміни backend
- [ ] Задеплоїти зміни frontend
- [ ] Повторно прогнати smoke tests після деплою
- [ ] Стежити за логами сервера на предмет webhook або signature помилок
- [ ] Стежити за невдалими checkout-спробами для перших живих замовлень

## План відкату
- [ ] Зберігати попередній build artifact доступним
- [ ] Зберігати попередню резервну копію бази
- [ ] Знати, як тимчасово перемкнути `LIQPAY_SANDBOX=1`, якщо потрібно
