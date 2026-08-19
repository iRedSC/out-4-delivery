# Out 4 Delivery

Out 4 Delivery (O4D) turns shipping emails into a package-tracking widget. It reads one or more Gmail inboxes, extracts shipment details with GPT-5.6 Luna, and keeps delivery statuses current through Shippo.

## Get started

1. Copy `.env.example` to `.env`.
2. Add your Gmail accounts, OpenAI API key, Shippo token, and an O4D API key.
3. Run `docker compose up -d --build`.
4. Copy `scriptable/ParcelMail.js` into Scriptable and set `API_URL` and `API_KEY`.

Generate the O4D API key with `openssl rand -hex 32`.

Gmail accounts use 16-character app passwords and are configured as JSON:

```dotenv
GMAIL_ACCOUNTS=[{"email":"personal@gmail.com","appPassword":"abcdefghijklmnop"},{"email":"work@gmail.com","appPassword":"qrstuvwxyzabcdef"}]
```

## API

`GET /health` is public. All other routes require `Authorization: Bearer <API_KEY>`.

- `GET /api/packages` lists packages.
- `POST /api/sync` starts a sync immediately.

The service also syncs on startup and every `SYNC_INTERVAL_MINUTES`.
