# Belgrade Calendar Bot

Telegram-бот: `/start`, menu button, webhook (prod) / polling (dev). Обзор проекта: [корневой README](../README.md).

## Запуск

```bash
# из корня — .env уже должен быть заполнен
cd telegram-bot
npm install
npm run dev
```

## Режимы

| Режим | Когда | Как |
|-------|-------|-----|
| **Polling** | Локально (по умолчанию) | `BOT_WEBHOOK_URL=http://localhost:3001/webhook` |
| **Webhook** | Production | `BOT_WEBHOOK_URL=https://belca.jtutor.app/bot/webhook` |

Принудительный polling: `BOT_USE_POLLING=true`

## Команды бота

| Команда | Где | Кто | Действие |
|---------|-----|-----|----------|
| `/start` | личка | все | приветствие + кнопка Mini App |
| `/calendar` | группа или личка | все | кнопка «Открыть календарь» |
| `/setup` | **группа** (рекомендуется) | admin | пост + **закрепление** с кнопкой Mini App |

### Кнопка календаря в группе

1. `WEBAPP_URL` должен быть **HTTPS** (ngrok или prod)
2. Бот — **админ** группы с правом **«Закреплять сообщения»**
3. В группе **Belgrade Friends Calendar** напиши:

```
/setup
```

4. Бот закрепит сообщение с кнопкой **«📅 Открыть календарь»** — все участники смогут нажать и открыть Mini App.

Повтори `/setup`, если сменился ngrok-URL.

## Связь с API

При создании события через API backend сам постит анонс в `TELEGRAM_CHAT_ID` (см. `backend-api`).

## Production

Nginx:

```nginx
location /bot/webhook {
    proxy_pass http://127.0.0.1:3001/webhook;
}
```

Запуск: `npm run build && npm start`
