import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Include bare `/en` (and `/hy`, `/ru`) — `/:locale/:path*` alone skips `/en` without a trailing segment.
  matcher: ["/", "/(hy|ru|en)", "/(hy|ru|en)/:path*"],
};
