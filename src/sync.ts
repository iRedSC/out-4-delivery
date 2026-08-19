import type { GmailAccount } from "./config.js";
import { ParcelDatabase } from "./database.js";
import { isTrackingCandidate } from "./email-candidate.js";
import { ShipmentExtractor } from "./extractor.js";
import { fetchRecentMessages } from "./gmail.js";
import { ShippoClient } from "./shippo.js";

type Logger = {
  info(context: object, message: string): void;
  warn(context: object, message: string): void;
  error(context: object, message: string): void;
};

export type SyncSummary = {
  emailsChecked: number;
  shipmentsFound: number;
  packagesUpdated: number;
};

export class ParcelSync {
  private running: Promise<SyncSummary> | null = null;

  constructor(
    private readonly accounts: GmailAccount[],
    private readonly lookbackDays: number,
    private readonly database: ParcelDatabase,
    private readonly extractor: ShipmentExtractor,
    private readonly shippo: ShippoClient,
    private readonly logger: Logger,
  ) {}

  run(): Promise<SyncSummary> {
    if (this.running) return this.running;
    this.running = this.sync().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async sync(): Promise<SyncSummary> {
    const summary: SyncSummary = { emailsChecked: 0, shipmentsFound: 0, packagesUpdated: 0 };

    for (const account of this.accounts) {
      try {
        await this.syncAccount(account, summary);
      } catch (error) {
        this.logger.error({ account: account.email, error }, "Gmail sync failed");
      }
    }

    for (const parcel of this.database.listTrackable()) {
      try {
        const update = parcel.shippo_registered === 1
          ? await this.shippo.track(parcel.carrier, parcel.tracking_number)
          : await this.shippo.register(parcel.carrier, parcel.tracking_number);
        if (parcel.shippo_registered === 0) this.database.markShippoRegistered(parcel.id);
        this.database.updateTracking(parcel.id, update);
        summary.packagesUpdated += 1;
      } catch (error) {
        this.logger.warn(
          { carrier: parcel.carrier, trackingNumber: parcel.tracking_number, error },
          "Package tracking failed",
        );
      }
    }

    this.logger.info(summary, "Sync complete");
    return summary;
  }

  private async syncAccount(account: GmailAccount, summary: SyncSummary): Promise<void> {
    const messages = await fetchRecentMessages(account, this.lookbackDays);
    for (const message of messages) {
      if (this.database.hasProcessedEmail(account.email, message.messageId)) continue;
      summary.emailsChecked += 1;

      if (!isTrackingCandidate(message.subject, message.text)) {
        this.database.markEmailProcessed(account.email, message.messageId);
        continue;
      }

      try {
        const shipments = await this.extractor.extract(message);
        for (const shipment of shipments) {
          this.database.upsertShipment(shipment, account.email, message.messageId);
          summary.shipmentsFound += 1;
        }
        this.database.markEmailProcessed(account.email, message.messageId);
      } catch (error) {
        this.logger.warn({ account: account.email, messageId: message.messageId, error }, "Email extraction failed");
      }
    }
  }
}
