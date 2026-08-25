/** Strip HTML tags and control characters from user-provided plain text. */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

/** Sanitize optional string fields (empty → empty). */
export function cleanText(input: string | undefined | null, maxLen?: number): string {
  if (input == null) return "";
  let s = stripHtml(String(input));
  if (maxLen != null && s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}
