import { z } from "zod";
import type { TrackingUpdate } from "./database.js";
import type { Carrier, PackageStatus } from "./types.js";

const shippoStatusSchema = z.object({
  status: z.string().nullish(),
  status_details: z.string().nullish(),
  status_date: z.string().nullish(),
  location: z.object({
    city: z.string().nullish(),
    state: z.string().nullish(),
    country: z.string().nullish(),
  }).nullish(),
});

const shippoTrackSchema = z.object({
  eta: z.string().nullish(),
  tracking_status: shippoStatusSchema.nullish(),
});

const statusMap: Record<string, PackageStatus> = {
  UNKNOWN: "unknown",
  PRE_TRANSIT: "pre_transit",
  TRANSIT: "transit",
  DELIVERED: "delivered",
  RETURNED: "returned",
  FAILURE: "failure",
};

export class ShippoClient {
  constructor(private readonly token: string) {}

  async register(carrier: Carrier, trackingNumber: string): Promise<TrackingUpdate> {
    return this.request("/tracks/", {
      method: "POST",
      body: JSON.stringify({ carrier, tracking_number: trackingNumber }),
    });
  }

  async track(carrier: Carrier, trackingNumber: string): Promise<TrackingUpdate> {
    return this.request(`/tracks/${encodeURIComponent(carrier)}/${encodeURIComponent(trackingNumber)}`);
  }

  private async request(path: string, init?: RequestInit): Promise<TrackingUpdate> {
    const response = await fetch(`https://api.goshippo.com${path}`, {
      ...init,
      headers: {
        Authorization: `ShippoToken ${this.token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`Shippo returned ${response.status}: ${await response.text()}`);
    }
    return toTrackingUpdate(shippoTrackSchema.parse(await response.json()));
  }
}

function toTrackingUpdate(track: z.infer<typeof shippoTrackSchema>): TrackingUpdate {
  const event = track.tracking_status;
  const location = event?.location;
  return {
    status: statusMap[event?.status?.toUpperCase() ?? ""] ?? "unknown",
    statusText: event?.status_details ?? null,
    estimatedDelivery: track.eta ?? null,
    lastEventAt: event?.status_date ?? null,
    lastLocation: location
      ? [location.city, location.state, location.country].filter(Boolean).join(", ") || null
      : null,
  };
}
