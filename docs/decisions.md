# Belgrade Calendar — зафиксированные решения

Документ фиксирует продуктовые и технические решения, принятые перед разработкой.  
Исходное исследование и обоснование архитектуры — в [req.md](../req.md).

---

## Продукт

### Модель использования

- **Один чат Telegram** (канал/группа) = **один общий календарь** для компании друзей.
- **Telegram Mini App** — основной интерфейс (список событий, карточка, RSVP, создание).
- **Telegram-бот** — точка входа, публикация событий в чат, команды (позже).
- **Чат** — медиа-слой: анонсы и кнопка «Открыть календарь».

### Доступ

- Mini App может открыть **любой пользователь Telegram** (без проверки членства в чате).
- Авторизация через **Telegram Web App `initData`** с валидацией на backend.

### Роли

| Роль | Описание |
|------|----------|
| `member` | Обычный пользователь по умолчанию |
| `admin` | Пользователь, чей `telegram_id` указан в `TELEGRAM_ADMIN_IDS` |

Первые админы задаются через переменную окружения, не через UI.

### События

- Создавать события может **любой member** — без модерации и подтверждения.
- Событие **сразу попадает в календарь** (статусы `pending` / `approved` / `rejected` **не используются**).
- **Редактировать** может **автор** или **admin**.
- **Удалять** может **автор** или **admin** (soft delete через `deletedAt`).
- Ограничений по времени на редактирование и RSVP **нет**.

### Поля события

| Поле | Обязательность | Описание |
|------|----------------|----------|
| `title` | да | Название |
| `startsAt` | да | Дата и время начала |
| `location` | нет | Место |
| `durationMinutes` | нет | Длительность в минутах |
| `description` | нет | Описание |

### Приватность

- В MVP все события **public** — видны всем, кто открыл Mini App.
- Поле `visibility` в схеме **не вводим** до v2.

### RSVP

- Статусы: `going` / `maybe` / `not_going`.
- RSVP может поставить **любой залогиненный пользователь** (без проверки членства в чате).

### Бот и чат

- Бот — **администратор** чата.
- При **создании события** бот публикует сообщение в чат, например:

  ```
  Новое событие: Пицца у Иры
  Суббота, 2 июня, 19:00 (Белград)
  📍 адрес (если указан)

  [Открыть календарь]
  ```

- Кнопка «Открыть» ведёт в Mini App (карточка события или главный экран).

### Язык

- Интерфейс Mini App и тексты бота — **русский**.

### Отложено (не MVP)

- Напоминания за день / за час.
- Модерация событий (`pending` → `approve` / `reject`).
- Приватность: «только друзья», «только приглашённые».
- Комментарии, фото, повторяющиеся события.
- Экспорт «Добавить в календарь» (.ics).
- Календарь-сетка (grid view) — в MVP достаточно списка ближайших событий.
- Синхронизация поста в Telegram при редактировании/удалении события — v1.1 (поле `telegramMessageId` заложено под это).

---

## Техническая архитектура

### Стек

| Слой | Технология |
|------|------------|
| Frontend (Mini App) | React + Vite |
| Backend API | Node.js (Express или Fastify) |
| База данных | MongoDB |
| Telegram Bot | Grammy или Telegraf |
| Deploy | VPS (собственный сервер) |

**Firebase не используем.** Причины: auth уже через Telegram; бот и API на одном сервере; связанные сущности (события + участники) и выборки по датам удобнее в MongoDB.

### Структура репозитория

```text
belgrade-calendar/
├── backend-api/          # REST API + Mongoose
├── backend-api/src/bot/  # Grammy (в одном процессе с API)
├── mini-app/             # React + Vite
├── docker-compose.yml    # MongoDB (опционально)
├── docs/
│   └── decisions.md      # этот документ
├── .env.example
└── req.md
```

### URL на production

| Сервис | URL |
|--------|-----|
| Mini App | `https://belca.jtutor.app` |
| API | `https://belca.jtutor.app/api` |
| Bot webhook | `https://belca.jtutor.app/bot/webhook` |

### Timezone

- Отображение и форматирование дат: **`Europe/Belgrade`**.
- Хранение в MongoDB: **UTC** (`Date`).

### Аутентификация

- Клиент отправляет `initData` из Telegram Web App.
- Backend валидирует подпись по [алгоритму Telegram](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
- После успеха — **JWT** (срок по умолчанию: **30 дней**).
- При каждом login обновляются `firstName`, `lastName`, `username`, `photoUrl` из Telegram.

---

## Переменные окружения

```env
# Server
NODE_ENV=production
PORT=3000
JWT_SECRET=change-me-long-random-string
JWT_EXPIRES_IN=30d

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/belgrade_calendar

# Telegram
BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=-100xxxxxxxxxx
TELEGRAM_ADMIN_IDS=123456789,987654321

# URLs
WEBAPP_URL=https://belca.jtutor.app
API_PUBLIC_URL=https://belca.jtutor.app/api
BOT_WEBHOOK_URL=https://belca.jtutor.app/bot/webhook

# App
TZ=Europe/Belgrade
```

| Переменная | Назначение |
|------------|------------|
| `TELEGRAM_CHAT_ID` | Единственный чат (канал/группа) календаря |
| `TELEGRAM_ADMIN_IDS` | Список `telegram_id` админов через запятую |
| `WEBAPP_URL` | URL Mini App для кнопок бота и Web App menu |

---

## Модель данных (MongoDB)

### Коллекция `users`

```js
{
  telegramId: Number,       // unique
  username: String | null,
  firstName: String,
  lastName: String | null,
  photoUrl: String | null,
  role: 'member' | 'admin',
  createdAt: Date,
  updatedAt: Date
}
```

**Индексы:** `{ telegramId: 1 }` unique.

Роль `admin` выставляется, если `telegramId` ∈ `TELEGRAM_ADMIN_IDS`.

### Коллекция `events`

```js
{
  title: String,
  description: String | null,
  startsAt: Date,              // UTC
  durationMinutes: Number | null,
  location: String | null,
  createdBy: ObjectId,         // ref users
  deletedAt: Date | null,      // soft delete
  telegramMessageId: Number | null,
  createdAt: Date,
  updatedAt: Date
}
```

**Индексы:**

- `{ startsAt: 1, deletedAt: 1 }` — список ближайших событий
- `{ createdBy: 1 }`

### Коллекция `event_participants`

```js
{
  eventId: ObjectId,           // ref events
  userId: ObjectId,            // ref users
  status: 'going' | 'maybe' | 'not_going',
  updatedAt: Date
}
```

**Индексы:**

- `{ eventId: 1, userId: 1 }` unique
- `{ eventId: 1, status: 1 }`

---

## API (REST)

Base URL: `https://belca.jtutor.app/api`

| Метод | Endpoint | Auth | Описание |
|-------|----------|------|----------|
| `POST` | `/auth/telegram` | — | Login по `initData`, возвращает JWT |
| `GET` | `/me` | JWT | Текущий пользователь |
| `GET` | `/events?from=&to=` | JWT | Список событий (без удалённых) |
| `GET` | `/events/:id` | JWT | Карточка + участники по статусам |
| `POST` | `/events` | JWT | Создание → пост бота в чат |
| `PATCH` | `/events/:id` | JWT | Редактирование (автор или admin) |
| `DELETE` | `/events/:id` | JWT | Soft delete (автор или admin) |
| `PUT` | `/events/:id/rsvp` | JWT | Upsert RSVP (`going` / `maybe` / `not_going`) |

### `POST /auth/telegram`

```json
// Request
{ "initData": "query_id=...&user=...&hash=..." }

// Response
{
  "token": "jwt...",
  "user": {
    "id": "...",
    "telegramId": 123456789,
    "firstName": "Вова",
    "username": "vova",
    "role": "member"
  }
}
```

### `POST /events`

```json
// Request
{
  "title": "Пицца у Иры",
  "startsAt": "2026-06-02T17:00:00.000Z",
  "durationMinutes": 120,
  "location": "...",
  "description": "..."
}
```

После успешного создания backend инициирует публикацию сообщения в `TELEGRAM_CHAT_ID`.

---

## Mini App — экраны MVP

1. **Главный** — ближайшие события, группировка по дням, RSVP-кнопки в списке.
2. **Карточка события** — детали, участники (`идут` / `возможно`), RSVP.
3. **Создание события** — форма с обязательными `title` и `startsAt`.

---

## Порядок реализации

| Фаза | Содержание |
|------|------------|
| **1** | Backend: Mongoose-модели, auth, CRUD событий, RSVP |
| **2** | Bot: webhook, `/start`, menu button, пост в чат при создании |
| **3** | Mini App: список, карточка, создание, RSVP |
| **4** | Deploy: VPS, nginx, SSL (`belca.jtutor.app`) |
| **5** | v1.1: напоминания; синхронизация поста при edit/delete |

---

## Nginx (ориентир)

```nginx
server {
    server_name belca.jtutor.app;

    location / {
        root /var/www/belca-mini-app;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
    }

    location /bot/webhook {
        proxy_pass http://127.0.0.1:3000/bot/webhook;
    }
}
```

---

## История решений

| Дата | Изменение |
|------|-----------|
| 2026-06-02 | Первая фиксация: Node + MongoDB, один чат, без модерации, soft delete, RSVP, пост бота при create, домен `belca.jtutor.app`, напоминания отложены |
