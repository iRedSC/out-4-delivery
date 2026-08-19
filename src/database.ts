import Database from "better-sqlite3";
import type { Carrier, ExtractedShipment, PackageRecord, PackageStatus } from "./types.js";
import { trackingUrl } from "./tracking-url.js";

type PackageRow = {
  id: number;
  tracking_number: string;
  carrier: Carrier;
  product: string;
  merchant: string | null;
  source_account: string;
  status: PackageStatus;
  status_text: string | null;
  estimated_delivery: string | null;
  last_event_at: string | null;
  last_location: string | null;
  shippo_registered: number;
  checked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TrackingUpdate = {
  status: PackageStatus;
  statusText: string | null;
  estimatedDelivery: string | null;
  lastEventAt: string | null;
  lastLocation: string | null;
};

export class ParcelDatabase {
  private readonly database: Database.Database;

  constructor(path: string) {
    this.database = new Database(path);
    this.database.pragma("journal_mode = WAL");
    this.database.pragma("foreign_keys = ON");
    this.migrate();
  }

  close(): void {
    this.database.close();
  }

  hasProcessedEmail(accountEmail: string, messageId: string): boolean {
    const row = this.database.prepare(`
      SELECT 1 FROM processed_emails WHERE account_email = ? AND message_id = ?
    `).get(accountEmail, messageId);
    return row !== undefined;
  }

  markEmailProcessed(accountEmail: string, messageId: string): void {
    this.database.prepare(`
      INSERT OR IGNORE INTO processed_emails (account_email, message_id, processed_at)
      VALUES (?, ?, ?)
    `).run(accountEmail, messageId, new Date().toISOString());
  }

  upsertShipment(shipment: ExtractedShipment, accountEmail: string, messageId: string): PackageRow {
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO packages (
        tracking_number, carrier, product, merchant, source_account,
        source_message_id, estimated_delivery, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tracking_number, carrier) DO UPDATE SET
        merchant = COALESCE(excluded.merchant, packages.merchant),
        estimated_delivery = COALESCE(excluded.estimated_delivery, packages.estimated_delivery),
        updated_at = excluded.updated_at
    `).run(
      shipment.trackingNumber,
      shipment.carrier,
      shipment.product,
      shipment.merchant,
      accountEmail,
      messageId,
      shipment.estimatedDelivery,
      now,
      now,
    );

    return this.getRow(shipment.trackingNumber, shipment.carrier);
  }

  markShippoRegistered(id: number): void {
    this.database.prepare(`UPDATE packages SET shippo_registered = 1 WHERE id = ?`).run(id);
  }

  updateTracking(id: number, update: TrackingUpdate): void {
    const now = new Date().toISOString();
    this.database.prepare(`
      UPDATE packages SET
        status = ?,
        status_text = ?,
        estimated_delivery = COALESCE(?, estimated_delivery),
        last_event_at = ?,
        last_location = ?,
        checked_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      update.status,
      update.statusText,
      update.estimatedDelivery,
      update.lastEventAt,
      update.lastLocation,
      now,
      now,
      id,
    );
  }

  listTrackable(): PackageRow[] {
    return this.database.prepare(`
      SELECT * FROM packages
      WHERE status NOT IN ('delivered', 'returned') AND carrier != 'other'
      ORDER BY created_at DESC
    `).all() as PackageRow[];
  }

  listPackages(): PackageRecord[] {
    const rows = this.database.prepare(`
      SELECT * FROM packages
      ORDER BY
        CASE status WHEN 'delivered' THEN 1 ELSE 0 END,
        COALESCE(estimated_delivery, '9999-12-31'),
        updated_at DESC
    `).all() as PackageRow[];
    return rows.map(toPackageRecord);
  }

  private getRow(trackingNumber: string, carrier: Carrier): PackageRow {
    const row = this.database.prepare(`
      SELECT * FROM packages WHERE tracking_number = ? AND carrier = ?
    `).get(trackingNumber, carrier) as PackageRow | undefined;
    if (!row) throw new Error("Package was not saved");
    return row;
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS processed_emails (
        account_email TEXT NOT NULL,
        message_id TEXT NOT NULL,
        processed_at TEXT NOT NULL,
        PRIMARY KEY (account_email, message_id)
      );

      CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY,
        tracking_number TEXT NOT NULL,
        carrier TEXT NOT NULL,
        product TEXT NOT NULL,
        merchant TEXT,
        source_account TEXT NOT NULL,
        source_message_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unknown',
        status_text TEXT,
        estimated_delivery TEXT,
        last_event_at TEXT,
        last_location TEXT,
        shippo_registered INTEGER NOT NULL DEFAULT 0,
        checked_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (tracking_number, carrier)
      );
    `);
  }
}

function toPackageRecord(row: PackageRow): PackageRecord {
  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    product: row.product,
    merchant: row.merchant,
    sourceAccount: row.source_account,
    status: row.status,
    statusText: row.status_text,
    estimatedDelivery: row.estimated_delivery,
    lastEventAt: row.last_event_at,
    lastLocation: row.last_location,
    trackingUrl: trackingUrl(row.carrier, row.tracking_number),
    checkedAt: row.checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type StoredPackage = PackageRow;
