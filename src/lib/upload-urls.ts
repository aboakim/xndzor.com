/**
 * Shared allowlist for listing/avatar image URLs after upload.
 * Local disk: /uploads/...
 * Vercel Blob: https://*.public.blob.vercel-storage.com/...
 */
export function isAllowedUploadUrl(url: string, kind: "listing" | "avatar" = "listing"): boolean {
  if (!url || url.includes("..")) return false;

  if (kind === "avatar") {
    if (url.startsWith("/uploads/avatars/") && !url.includes("//")) return true;
  } else if (url.startsWith("/uploads/") && !url.includes("//")) {
    return true;
  }

  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    // Vercel Blob public URLs
    if (
      u.hostname.endsWith(".public.blob.vercel-storage.com") ||
      u.hostname === "public.blob.vercel-storage.com"
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function filterListingImageUrls(urls: string[] | undefined | null): string[] {
  return (urls || []).filter((u) => isAllowedUploadUrl(u, "listing"));
}
