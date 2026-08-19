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

## Scriptable widget

Open the section below, tap the copy button, paste it into a new Scriptable script, and replace `API_URL` and `API_KEY`.

<details>
<summary>Copy the O4D widget script</summary>

```js
// Replace these two values, then add this script to a Scriptable widget.
const API_URL = "https://packages.example.com";
const API_KEY = "replace-with-your-api-key";

const request = new Request(`${API_URL}/api/packages`);
request.headers = { Authorization: `Bearer ${API_KEY}` };
const data = await request.loadJSON();

const widget = new ListWidget();
widget.backgroundColor = new Color("#111827");
widget.setPadding(14, 14, 14, 14);

const title = widget.addText("Packages");
title.font = Font.boldSystemFont(16);
title.textColor = Color.white();
widget.addSpacer(8);

const visible = data.packages.slice(0, config.widgetFamily === "large" ? 6 : 3);
if (visible.length === 0) {
  const empty = widget.addText("Nothing on the way");
  empty.textColor = Color.gray();
} else {
  for (const parcel of visible) {
    const row = widget.addStack();
    row.url = parcel.trackingUrl;
    row.layoutVertically();

    const product = row.addText(parcel.product);
    product.font = Font.semiboldSystemFont(13);
    product.textColor = Color.white();
    product.lineLimit = 1;

    const detail = row.addText(packageDetail(parcel));
    detail.font = Font.systemFont(11);
    detail.textColor = new Color("#9CA3AF");
    detail.lineLimit = 1;
    widget.addSpacer(7);
  }
}

Script.setWidget(widget);
Script.complete();

function packageDetail(parcel) {
  if (parcel.status === "delivered") return "Delivered";
  if (parcel.estimatedDelivery) return `Due ${formatDate(parcel.estimatedDelivery)}`;
  return parcel.statusText || parcel.status.replaceAll("_", " ");
}

function formatDate(value) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}
```

</details>

## API

`GET /health` is public. All other routes require `Authorization: Bearer <API_KEY>`.

- `GET /api/packages` lists packages.
- `POST /api/sync` starts a sync immediately.

The service also syncs on startup and every `SYNC_INTERVAL_MINUTES`.
