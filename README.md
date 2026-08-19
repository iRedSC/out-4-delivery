# Parcel Mail

Parcel Mail finds shipment emails in Gmail, extracts package details with GPT-5.6 Luna, tracks them through Shippo, and exposes a small API for a Scriptable widget.

## Start

1. Copy `.env.example` to `.env`.
2. Add one or more Gmail accounts, an OpenAI key, a Shippo token, and a random API key.
3. Run `docker compose up -d --build`.
4. Copy `scriptable/ParcelMail.js` into Scriptable and set `API_URL` and `API_KEY`.

Generate an API key with `openssl rand -hex 32`.

Gmail accounts use 16-character app passwords and are configured as JSON:

```dotenv
GMAIL_ACCOUNTS=[{"email":"personal@gmail.com","appPassword":"abcdefghijklmnop"},{"email":"work@gmail.com","appPassword":"qrstuvwxyzabcdef"}]
```

## API

`GET /health` is public. All other routes require `Authorization: Bearer <API_KEY>`.

- `GET /api/packages` lists packages.
- `POST /api/sync` starts a sync immediately.

The service also syncs on startup and every `SYNC_INTERVAL_MINUTES`.
