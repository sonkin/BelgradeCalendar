# Belgrade Friends Calendar

Telegram Mini App для общего календаря встреч: друзья создают события, отмечают «иду / возможно / не иду», подписываются на iCal и получают анонсы в групповом чате.

Интерфейс и тексты бота — **на русском**. Часовой пояс — **Europe/Belgrade**.

## Как это устроено

```mermaid
flowchart LR
  subgraph telegram [Telegram]
    Group[Группа / канал]
    Bot[Бот]
    MiniApp[Mini App]
  end

  User((Пользователь)) --> Bot
  User --> MiniApp
  Bot --> Group
  MiniApp --> API
  API[(MongoDB)]
  Bot -.->|webhook| BotSvc[telegram-bot]
  API -->|анонс события| Group
```

| Компонент | Папка | Назначение |
|-----------|--------|------------|
| **Mini App** | [`mini-app/`](mini-app/) | React + Vite: список событий, RSVP, настройки, подписка на календарь |
| **API** | [`backend-api/`](backend-api/) | Express + MongoDB: auth, события, профили, iCal feeds |
| **Бот** | [`telegram-bot/`](telegram-bot/) | Grammy: `/start`, menu button, `/setup` в группе, webhook |

Один Telegram-чат (`TELEGRAM_CHAT_ID`) = один общий календарь. Любой пользователь Telegram может открыть Mini App и залогиниться через `initData`.

## Возможности

- Создание и редактирование событий (автор или admin)
- RSVP: **иду** / **возможно** / **не иду**
- Отображаемое имя в календаре (поверх имени из Telegram)
- Ссылки на профили участников в Telegram
- Подписка на **Apple / Google Calendar** (все события или только «Иду»)
- Анонс нового события и уведомление об изменении в групповой чат
- Deep link из поста бота: `?startapp=event_<id>`

## Быстрый старт (локально)

**Требования:** Node.js 20+, Docker (для MongoDB).

```bash
git clone <repository-url>
cd belgrade-calendar   # имя папки после clone

docker compose up -d

cp .env.example .env
# Заполните: JWT_SECRET, BOT_TOKEN, TELEGRAM_ADMIN_IDS, TELEGRAM_CHAT_ID
```

Три терминала:

```bash
cd backend-api && npm install && npm run dev    # :3000
cd telegram-bot && npm install && npm run dev   # polling, :3001
cd mini-app && npm install && npm run dev       # :5173
```

- API: http://localhost:3000/health  
- Mini App: http://localhost:5173 (без Telegram auth не заработает — это ожидаемо)

### Тест в Telegram (ngrok)

1. Поднимите HTTPS-туннель на Mini App (`5173`).
2. В `.env` укажите `WEBAPP_URL` и `API_PUBLIC_URL` на ngrok-URL.
3. В [@BotFather](https://t.me/BotFather) → Menu Button → URL Mini App.
4. В группе: бот — админ, команда `/setup` (см. [`telegram-bot/README.md`](telegram-bot/README.md)).

Подробнее: [`mini-app/README.md`](mini-app/README.md).

## Переменные окружения

Один файл `.env` в **корне** репозитория (читают `backend-api` и `telegram-bot`).

| Переменная | Описание |
|------------|----------|
| `JWT_SECRET` | Секрет для JWT |
| `MONGODB_URI` | MongoDB, по умолчанию `mongodb://127.0.0.1:27017/belgrade_calendar` |
| `BOT_TOKEN` | Токен бота |
| `TELEGRAM_CHAT_ID` | ID группы для анонсов |
| `TELEGRAM_ADMIN_IDS` | Telegram ID админов через запятую |
| `WEBAPP_URL` | HTTPS URL Mini App |
| `API_PUBLIC_URL` | Публичный base API (для iCal), на prod: `https://<домен>/api` |
| `BOT_WEBHOOK_URL` | Webhook бота на prod |
| `BOT_USE_POLLING` | `true` локально, `false` на prod |

Полный пример — [`.env.example`](.env.example).

## Production

Целевой домен в проекте: **`belca.jtutor.app`**.

1. VPS: Node 20+, nginx, certbot, MongoDB (Docker или Atlas).
2. Сборка: `backend-api`, `telegram-bot`, `mini-app` → статика в `/var/www/...`.
3. Процессы: API `:3000`, бот webhook `:3001` (pm2/systemd).
4. Nginx: `/` → Mini App, `/api/` → API, `/bot/webhook` → бот.
5. `BOT_USE_POLLING=false`, SSL, Menu Button в BotFather, `/setup` в группе.

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/;
}
location /bot/webhook {
    proxy_pass http://127.0.0.1:3001/webhook;
}
```

Детали API и деплоя: [`backend-api/README.md`](backend-api/README.md), архитектура: [`docs/decisions.md`](docs/decisions.md).

## Структура репозитория

```
.
├── backend-api/      # REST API
├── mini-app/         # Telegram Mini App (React)
├── telegram-bot/     # Telegram bot (Grammy)
├── docs/
│   └── decisions.md  # Принятые решения
├── docker-compose.yml
├── .env.example
└── req.md            # Исходное исследование / ТЗ
```

## Документация по пакетам

| Документ | Содержание |
|----------|------------|
| [backend-api/README.md](backend-api/README.md) | REST API, endpoints, curl |
| [mini-app/README.md](mini-app/README.md) | Экраны, ngrok, локальный запуск |
| [telegram-bot/README.md](telegram-bot/README.md) | Команды, webhook, `/setup` |
| [docs/decisions.md](docs/decisions.md) | Модель данных, роли, MVP / v1.1 |

## Скрипты (по пакетам)

В каждой папке: `npm run dev`, `npm run build`, `npm start`.

## Лицензия

Самая свободная лицензия - MIT.