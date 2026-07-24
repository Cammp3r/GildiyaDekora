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



