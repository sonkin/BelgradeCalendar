# Belgrade Friends Calendar — API

REST API для [Belgrade Friends Calendar](../README.md).

Один процесс Node.js: **REST API**, **Grammy-бот** (команды, webhook) и посты в групповой чат. Обзор проекта — [**корневой README**](../README.md).

## Возможности

- **Авторизация** — вход по [Telegram Web App `initData`](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app), выдача JWT
- **События** — создание, редактирование, soft delete; фильтр по диапазону дат
- **RSVP** — статусы `going`, `maybe`, `not_going`; списки участников в ответах API
- **Профиль** — опциональное отображаемое имя (`displayName`) поверх имени из Telegram
- **iCal** — персональные feed-токены: все события или только «Иду» (Apple / Google Calendar)
- **Telegram** — анонсы в чат; бот: `/start`, `/calendar`, `/setup`, menu button, webhook или polling

Часовой пояс приложения: **Europe/Belgrade**. Даты в MongoDB хранятся в UTC.

## Стек

- Node.js 20+, TypeScript, Express 5
- MongoDB + Mongoose
- JWT, валидация подписи Telegram `initData`
- [ical-generator](https://www.npmjs.com/package/ical-generator) для `.ics`
- [Grammy](https://grammy.dev/) для команд бота

## Требования

- Node.js **20+**
- MongoDB 7+ (локально: `docker compose` из корня репозитория)

## Быстрый старт

Из **корня** монорепозитория:

```bash
docker compose up -d

cp .env.example .env
# Заполните: JWT_SECRET, BOT_TOKEN, TELEGRAM_ADMIN_IDS, TELEGRAM_CHAT_ID (для постов в чат)

cd backend-api
npm install
npm run dev
```

Сервер: [http://localhost:3000](http://localhost:3000) (API + бот в **polling**, если `BOT_USE_POLLING=true`)  
Health: `GET /health` → `{ "ok": true }`

Сборка и запуск production:

```bash
npm run build
npm start
```

## Переменные окружения

Файл `.env` в **корне репозитория** (читается из `backend-api` автоматически).

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `JWT_SECRET` | да | Секрет для подписи JWT |
| `MONGODB_URI` | да | URI MongoDB |
| `BOT_TOKEN` | да | Токен бота [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_ADMIN_IDS` | да* | Telegram ID админов через запятую |
| `TELEGRAM_CHAT_ID` | нет | ID группы/канала для анонсов событий |
| `WEBAPP_URL` | нет | HTTPS URL Mini App (кнопки в постах бота) |
| `API_PUBLIC_URL` | нет | Публичный base URL API для ссылок iCal (на prod: `https://<домен>/api`) |
| `JWT_EXPIRES_IN` | нет | Срок JWT, по умолчанию `30d` |
| `PORT` | нет | Порт API, по умолчанию `3000` |
| `TZ` | нет | Таймзона, по умолчанию `Europe/Belgrade` |
| `BOT_WEBHOOK_URL` | prod | `https://<домен>/bot/webhook` |
| `BOT_USE_POLLING` | нет | `true` — polling (dev); `false` + webhook на prod |

\*Пустой список допустим технически, но тогда не будет пользователей с ролью `admin`.

Пример для production:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<случайная длинная строка>
MONGODB_URI=mongodb://127.0.0.1:27017/belgrade_calendar
BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=-100xxxxxxxxxx
TELEGRAM_ADMIN_IDS=123456789
WEBAPP_URL=https://belca.jtutor.app
API_PUBLIC_URL=https://belca.jtutor.app/api
```

## Авторизация

### Вход

```http
POST /auth/telegram
Content-Type: application/json

{ "initData": "<строка из Telegram.WebApp.initData>" }
```

Ответ `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "telegramId": 123456789,
    "username": "friend",
    "firstName": "Alex",
    "lastName": null,
    "displayName": null,
    "photoUrl": null,
    "role": "member"
  }
}
```

### Защищённые запросы

```http
Authorization: Bearer <token>
```

При каждом входе профиль синхронизируется с данными Telegram (`firstName`, `lastName`, `username`, `photoUrl`).

## API

Базовый путь на сервере: `/` (за nginx часто `/api/` → `proxy_pass` на этот сервис).

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/health` | — | Health check |
| `POST` | `/auth/telegram` | — | Вход, JWT |
| `GET` | `/me` | JWT | Текущий пользователь |
| `PATCH` | `/me` | JWT | Обновить профиль (`displayName`) |
| `GET` | `/me/calendar-feeds` | JWT | URL подписки iCal |
| `POST` | `/me/calendar-feeds/reset` | JWT | Перевыпустить токен feed |
| `GET` | `/events?from=&to=` | JWT | Список событий (ISO даты) |
| `GET` | `/events/:id` | JWT | Карточка события + участники |
| `POST` | `/events` | JWT | Создать событие |
| `PATCH` | `/events/:id` | JWT | Изменить (автор или admin) |
| `DELETE` | `/events/:id` | JWT | Soft delete (автор или admin) |
| `PUT` | `/events/:id/rsvp` | JWT | RSVP |
| `GET` | `/calendar/:token/all.ics` | — | iCal: все будущие события |
| `GET` | `/calendar/:token/going.ics` | — | iCal: события со статусом «Иду» |

### Создание события

```http
POST /events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Пицца у Иры",
  "startsAt": "2026-06-07T17:00:00.000Z",
  "durationMinutes": 120,
  "location": "Belgrade",
  "description": "Вечером у Иры"
}
```

При наличии `TELEGRAM_CHAT_ID` в группу уходит анонс с кнопкой открытия Mini App.

### RSVP

```http
PUT /events/:id/rsvp
Content-Type: application/json

{ "status": "going" }
```

Допустимые значения: `going`, `maybe`, `not_going`.

### Профиль

```http
PATCH /me
Content-Type: application/json

{ "displayName": "Саша" }
```

Пустая строка или `null` сбрасывает кастомное имя (снова имя из Telegram).

### Ошибки

JSON с полем `message` и HTTP-кодом (`400`, `401`, `403`, `404`, `500`).

## Примеры (curl)

```bash
export API=http://localhost:3000
export TOKEN=<jwt>

# События на июнь
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API/events?from=2026-06-01&to=2026-06-30" | jq .

# Создать событие
curl -s -X POST "$API/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Настолки","startsAt":"2026-06-15T18:00:00.000Z"}' | jq .

# RSVP
curl -s -X PUT "$API/events/<eventId>/rsvp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"going"}' | jq .
```

## Telegram-бот

Запускается вместе с API (`src/bot/`).

| Режим | Когда | Как |
|-------|-------|-----|
| **Polling** | Локально (по умолчанию) | `BOT_USE_POLLING=true` или webhook URL без https |
| **Webhook** | Production | `BOT_USE_POLLING=false`, `BOT_WEBHOOK_URL=https://<домен>/bot/webhook` |

| Команда | Описание |
|---------|----------|
| `/start` | Приветствие + кнопка Mini App |
| `/calendar` | Кнопка «Открыть календарь» |
| `/setup` | Admin: закреплённый пост в группе с кнопкой |

В группе кнопка — ссылка `t.me/?startapp`; в личке — `web_app`, если `WEBAPP_URL` — HTTPS.

## Структура проекта

```
src/
├── app.ts
├── index.ts            # DB + API + bot
├── bot/                # Grammy: команды, webhook/polling
├── config.ts
├── middleware/
├── models/
├── routes/
├── services/           # события, iCal, посты в чат (fetch)
├── types/
└── utils/
```

## Production

Один процесс `npm start` на порту `3000`.

- Mini App — статика nginx (`/`)
- API — `location /api/` → `127.0.0.1:3000/`
- Webhook — `location /bot/webhook` → `127.0.0.1:3000/bot/webhook`
- iCal — `{API_PUBLIC_URL}/calendar/{token}/all.ics`

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /bot/webhook {
    proxy_pass http://127.0.0.1:3000/bot/webhook;
}
```

`API_PUBLIC_URL=https://<домен>/api`, `BOT_USE_POLLING=false`.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Разработка с hot reload (`tsx watch`) |
| `npm run build` | Компиляция TypeScript → `dist/` |
| `npm start` | Запуск `node dist/index.js` |
| `npm run typecheck` | Проверка типов без сборки |

## См. также

- [Корневой README](../README.md) — архитектура, быстрый старт, деплой
- [`mini-app/`](../mini-app/) · [`docs/decisions.md`](../docs/decisions.md)
