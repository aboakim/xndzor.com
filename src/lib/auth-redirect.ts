/** Resolve where to send the user after login/register. */
export function resolveAuthRedirectUrl(
  callbackUrl: string | null | undefined,
  locale: string,
): string {
  if (
    callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  ) {
    return callbackUrl;
  }
  return `/${locale}`;
}
