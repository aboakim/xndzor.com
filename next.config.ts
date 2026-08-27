import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com https://*.stripe.com",
      "object-src 'none'",
    ].join("; "),
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Standalone output is produced in Docker (linux). Local Windows builds use default output.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/", destination: "/hy", permanent: false },
      { source: "/:locale/listings", destination: "/:locale/supply", permanent: false },
      { source: "/:locale/listings/new", destination: "/:locale/supply/new", permanent: false },
      { source: "/:locale/my/listings", destination: "/:locale/matches", permanent: false },
      { source: "/:locale/fertilizers", destination: "/:locale/shop/fertilizers", permanent: false },
      { source: "/:locale/seeds", destination: "/:locale/shop/seeds", permanent: false },
      { source: "/:locale/feed", destination: "/:locale/shop/feed", permanent: false },
      { source: "/:locale/chemicals", destination: "/:locale/shop/chemicals", permanent: false },
      { source: "/:locale/tools", destination: "/:locale/shop/tools", permanent: false },
      { source: "/:locale/land", destination: "/:locale/shop/land", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
