/** Public support / contact email (override via env in production). */
export function getContactEmail(): string {
  return (
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    "hello@xndzor.com"
  );
}

export function contactMailtoHref(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${getContactEmail()}?${params.toString()}`;
}

export function reportListingContactQuery(listingPath: string, listingTitle: string) {
  return {
    subject: "report",
    listing: listingPath,
    title: listingTitle,
  } as const;
}

export function securityContactQuery() {
  return { subject: "security" } as const;
}
