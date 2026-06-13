# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Belgrade Friends Calendar: Telegram Mini App (`mini-app/`) + Express API + Grammy bot (`backend-api/`), MongoDB via root `docker-compose.yml`. Single root `.env` (see `.env.example`).

### Services (local dev)

| Service | Port | Start |
|---------|------|--------|
| MongoDB | 27017 | `docker compose up -d` (repo root) |
| backend-api | 3000 | `cd backend-api && npm run dev` |
| mini-app (Vite) | 5173 | `cd mini-app && npm run dev` |

Vite proxies `/api` → `http://127.0.0.1:3000` (see `mini-app/vite.config.ts`).

### Required secrets

`JWT_SECRET` and `BOT_TOKEN` in root `.env` are required for `npm run dev` in `backend-api`. Without a valid `BOT_TOKEN`, startup fails at `registerBotCommands` (Telegram API 401).

**API-only testing (no live bot):** run REST without the bot process:

```bash
set -a && source .env && set +a
# Minimal API-only process (no Telegram bot); run from repo root:
npx tsx --import tsx/esm <<'EOF'
import { createApp } from './backend-api/src/app.ts';
import { connectDb } from './backend-api/src/db.ts';
import { config } from './backend-api/src/config.ts';
await connectDb();
createApp().listen(config.port, () => console.log('API on', config.port));
EOF
```

If heredoc/top-level await fails in your shell, use a small `.mjs` file under `/tmp` that imports `createApp`, `connectDb`, and `config` from `backend-api/src/`.

Generate signed `initData` and call the API:

```bash
node backend-api/scripts/generate-init-data.mjs [telegramId]
curl -X POST http://localhost:3000/auth/telegram -H 'Content-Type: application/json' -d '{"initData":"..."}'
```

### Lint / typecheck / build

No ESLint in repo. Use TypeScript checks and builds:

- `cd backend-api && npm run typecheck` / `npm run build`
- `cd mini-app && npm run typecheck` / `npm run build`

### Docker in Cloud Agent VMs

Docker may require `sudo` until the `ubuntu` user is in the `docker` group (log out/in or new shell after `usermod -aG docker ubuntu`). Use `sudo docker compose up -d` if `docker compose` permission is denied.

### Full Telegram Mini App E2E

Needs real `BOT_TOKEN`, HTTPS tunnel (ngrok) on port 5173, and BotFather menu URL. See `README.md` and `mini-app/README.md`.
