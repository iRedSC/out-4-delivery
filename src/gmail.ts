import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { GmailAccount } from "./config.js";
import type { ShippingEmail } from "./extractor.js";

export type GmailMessage = ShippingEmail & { messageId: string };

export async function fetchRecentMessages(
  account: GmailAccount,
  lookbackDays: number,
): Promise<GmailMessage[]> {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: account.email, pass: account.appPassword },
    logger: false,
  });

  await client.connect();
  try {
    const mailbox = await client.mailboxOpen("INBOX", { readOnly: true });
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1_000);
    const matches = await client.search({ since }, { uid: true });
    if (!matches) return [];
    const recentUids = matches.slice(-250);
    if (recentUids.length === 0) return [];

    const messages: GmailMessage[] = [];
    for await (const message of client.fetch(recentUids, { uid: true, source: true }, { uid: true })) {
      if (!message.source) continue;
      const parsed = await simpleParser(message.source);
      messages.push({
        messageId: parsed.messageId ?? `${mailbox.uidValidity.toString()}:${message.uid}`,
        from: parsed.from?.text ?? "",
        subject: parsed.subject ?? "",
        text: parsed.text ?? "",
        date: parsed.date?.toISOString() ?? null,
      });
    }
    return messages;
  } finally {
    await client.logout().catch(() => undefined);
  }
}
