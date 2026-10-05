/** Public listing URL for share actions (strips post-create query flags). */

export const NEW_LISTING_QUERY_PARAM = "new";

export function listingSharePayload(
  title: string,
  url: string,
  priceSnippet?: string | null,
) {
  const headline = priceSnippet ? `${title} — ${priceSnippet}` : title;
  return { url, headline, text: `${headline}\n${url}` };
}

export function listingShareUrlFromLocation(href: string): string {
  const u = new URL(href);
  u.searchParams.delete(NEW_LISTING_QUERY_PARAM);
  u.searchParams.delete("shared");
  u.hash = "";
  return u.toString();
}
