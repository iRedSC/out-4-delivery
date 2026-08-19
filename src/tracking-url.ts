import type { Carrier } from "./types.js";

const trackingUrlBuilders: Record<Carrier, (trackingNumber: string) => string> = {
  ups: (number) => `https://www.ups.com/track?tracknum=${encodeURIComponent(number)}`,
  usps: (number) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(number)}`,
  fedex: (number) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`,
  dhl_express: (number) => `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(number)}`,
  other: (number) => `https://www.google.com/search?q=${encodeURIComponent(`${number} tracking`)}`,
};

export function trackingUrl(carrier: Carrier, trackingNumber: string): string {
  return trackingUrlBuilders[carrier](trackingNumber);
}
