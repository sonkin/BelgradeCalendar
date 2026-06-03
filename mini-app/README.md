# Belgrade Calendar — Mini App

React + Vite Telegram Mini App. Обзор проекта: [корневой README](../README.md).

## Экраны

- **/** — ближайшие события + RSVP
- **/events/:id** — карточка события
- **/events/new** — создание события
- **/settings** — имя в календаре, ссылка на подписку iCal
- **/calendar/subscribe** — Apple / Google Calendar

## Локальный запуск (без Telegram)

```bash
cd mini-app
npm install
npm run dev
```

Откроется `http://localhost:5173` — без Telegram будет ошибка auth (это нормально).

API проксируется: `/api` → `http://127.0.0.1:3000` (нужен запущенный `backend-api`).

---

## Тест через Telegram + ngrok

### 1. Запусти три сервиса

```bash
# терминал 1 — MongoDB уже должен работать на :27017
cd backend-api && npm run dev

# терминал 2 — бот
cd telegram-bot && npm run dev

# терминал 3 — Mini App
cd mini-app && npm run dev
```

### 2. Подними ngrok на Mini App

```bash
ngrok http 5173
```

Скопируй HTTPS URL, например: `https://abc123.ngrok-free.app`

### 3. Обнови `.env` в корне проекта

```env
WEBAPP_URL=https://abc123.ngrok-free.app
API_PUBLIC_URL=https://abc123.ngrok-free.app/api
```

Перезапусти **backend-api** и **telegram-bot**.

> API ходит через Vite proxy (`/api` → localhost:3000), поэтому отдельный ngrok для API **не нужен**.

### 4. Настрой бота в BotFather

1. Открой [@BotFather](https://t.me/BotFather)
2. `/mybots` → `@BelgradeCalendarBot`
3. **Bot Settings → Menu Button → Configure menu button**
4. URL: `https://abc123.ngrok-free.app`
5. Текст: `Календарь`

### 5. Проверь

1. Напиши боту `/start` → кнопка «Открыть календарь»
2. Или Menu → «Календарь»
3. Создай событие → пост в группу **с кнопкой**

---

## Production

```bash
npm run build
# dist/ → nginx root на belca.jtutor.app
```

`.env`:

```env
WEBAPP_URL=https://belca.jtutor.app
API_PUBLIC_URL=https://belca.jtutor.app/api
```

Nginx:

```nginx
location / {
    root /var/www/belca-mini-app;
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:3000/;
}
```

## Переменные Mini App

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `VITE_API_BASE` | `/api` | Base URL API (не менять при ngrok) |
