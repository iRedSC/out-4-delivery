const candidateTerms = [
  "tracking",
  "shipped",
  "shipment",
  "out for delivery",
  "has been delivered",
  "delivery update",
  "package update",
];

const trackingLinkPattern = /(?:ups\.com|usps\.com|fedex\.com|dhl\.com)[^\s"'<>]*/i;

export function isTrackingCandidate(subject: string, text: string): boolean {
  const content = `${subject}\n${text}`.toLowerCase();
  return candidateTerms.some((term) => content.includes(term)) || trackingLinkPattern.test(content);
}
