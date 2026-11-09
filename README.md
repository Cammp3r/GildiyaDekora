# Гільдія Декора

## Что уже сделано

- Фронтенд на Vite/React.
## Локальный запуск

1. Установи зависимости фронта в корне проекта.
2. Запусти фронтенд в корне:

```bash
npm run dev
```

## Что настроить на хостинге


### Frontend

На Netlify задай:

- `VITE_API_URL=https://<backend-domain>/api`

Если домен backend-а изменится, обнови и redirect `/api/*` в `netlify.toml`.

### Моніторинг Render (UptimeRobot)

Сервер має публічний маршрут `GET /ping`: повертає HTTP 200 і текст `OK`,
не звертається до бази даних і не надсилає повідомлень. Існуючий `/api/health`
також підходить для перевірки доступності.

1. Опублікуй зміни backend на Render (якщо автоматичний деплой вимкнений,
   вибери **Manual Deploy → Deploy latest commit** після push у підключену гілку).
2. Відкрий `https://gildiyadekora-v8ul.onrender.com/ping` — очікувана відповідь `OK`.
3. В UptimeRobot створи **HTTP(s)** монітор:
   - Назва: `Gildiya Dekora API`.
   - URL: `https://gildiyadekora-v8ul.onrender.com/ping`.
   - Інтервал: **5 хвилин** (доступний у безкоштовному плані).
   - Метод: **GET**, очікуваний статус: **200**.
4. Збережи монітор і перевір, що він показує **UP**.

Потрібно перевіряти саме backend на Render. Перевірка головної сторінки
фронтенду на Netlify не підтримує активність backend.

Render Free засинає після 15 хвилин без вхідних запитів; зовнішні перевірки
кожні 5 хвилин підтримують його активність, поки сервіс і монітор працюють.
Це не виключає перезапусків, збоїв та обмежень тарифу. Ліміт 750 безкоштовних
годин на місяць спільний для всіх Free web services у workspace.

Email замовлення надсилається через FormSubmit, а Telegram — окремим запитом
із браузера до `/api/notify/telegram`. Успіх email не підтверджує доставку
в Telegram. Зараз клієнт не перевіряє відповідь Telegram і не повторює запит.
Якщо повідомлення знову не надійде, перевір логи Render за час замовлення
(зокрема `Telegram notify failed:`), налаштування `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID` та `CORS_ORIGIN`. Моніторинг `/ping` перевіряє доступність
сервера, а не доставку повідомлень.

Документація: [Render Free](https://render.com/docs/free),
[інтервали UptimeRobot](https://help.uptimerobot.com/en/articles/11360876-what-is-a-monitoring-interval-in-uptimerobot).



