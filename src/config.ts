import { z } from "zod";

const gmailAccountSchema = z.object({
  email: z.string().email(),
  appPassword: z.string().transform((value) => value.replaceAll(" ", "")).pipe(z.string().min(16)),
});

const environmentSchema = z.object({
  API_KEY: z.string().min(32, "API_KEY must contain at least 32 characters"),
  GMAIL_ACCOUNTS: z.string().transform((value, context) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      context.addIssue({ code: "custom", message: "GMAIL_ACCOUNTS must be valid JSON" });
      return z.NEVER;
    }
  }).pipe(z.array(gmailAccountSchema).min(1)),
  OPENAI_API_KEY: z.string().min(1),
  SHIPPO_API_TOKEN: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_PATH: z.string().default("/data/parcel-mail.sqlite"),
  SYNC_INTERVAL_MINUTES: z.coerce.number().int().positive().default(30),
  EMAIL_LOOKBACK_DAYS: z.coerce.number().int().positive().default(30),
  TIMEZONE: z.string().default("UTC"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Config = z.infer<typeof environmentSchema>;
export type GmailAccount = Config["GMAIL_ACCOUNTS"][number];

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): Config {
  return environmentSchema.parse(environment);
}
