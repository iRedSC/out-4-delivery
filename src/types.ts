export const carriers = ["ups", "usps", "fedex", "dhl_express", "other"] as const;
export type Carrier = (typeof carriers)[number];

export const packageStatuses = [
  "unknown",
  "pre_transit",
  "transit",
  "delivered",
  "returned",
  "failure",
] as const;
export type PackageStatus = (typeof packageStatuses)[number];

export type ExtractedShipment = {
  trackingNumber: string;
  carrier: Carrier;
  product: string;
  merchant: string | null;
  estimatedDelivery: string | null;
  confidence: number;
};

export type PackageRecord = {
  id: number;
  trackingNumber: string;
  carrier: Carrier;
  product: string;
  merchant: string | null;
  sourceAccount: string;
  status: PackageStatus;
  statusText: string | null;
  estimatedDelivery: string | null;
  lastEventAt: string | null;
  lastLocation: string | null;
  trackingUrl: string;
  checkedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
