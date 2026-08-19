import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { loadConfig } from "./config.js";
import { ParcelDatabase } from "./database.js";
import { ShipmentExtractor } from "./extractor.js";
import { createServer } from "./server.js";
import { ShippoClient } from "./shippo.js";
import { ParcelSync } from "./sync.js";

const config = loadConfig();
process.env.TZ = config.TIMEZONE;
mkdirSync(dirname(config.DATABASE_PATH), { recursive: true });

const database = new ParcelDatabase(config.DATABASE_PATH);
const extractor = new ShipmentExtractor(config.OPENAI_API_KEY);
const shippo = new ShippoClient(config.SHIPPO_API_TOKEN);

const bootstrapLogger = {
  info: (context: object, message: string) => console.info(message, context),
  warn: (context: object, message: string) => console.warn(message, context),
  error: (context: object, message: string) => console.error(message, context),
};
const sync = new ParcelSync(
  config.GMAIL_ACCOUNTS,
  config.EMAIL_LOOKBACK_DAYS,
  database,
  extractor,
  shippo,
  bootstrapLogger,
);
const server = await createServer({ config, database, sync });

const interval = setInterval(
  () => void sync.run(),
  config.SYNC_INTERVAL_MINUTES * 60 * 1_000,
);
interval.unref();

await server.listen({ host: "0.0.0.0", port: config.PORT });
void sync.run();

async function shutdown(): Promise<void> {
  clearInterval(interval);
  await server.close();
  database.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
