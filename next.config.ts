import type { NextConfig } from "next";

/**
 * Private/transactional/admin route prefixes that must never be indexed.
 * Mirrors the robots.txt disallow list. We add an `X-Robots-Tag` HTTP
 * header here as defense-in-depth: the admin section's layout is a client
 * component (so it can't emit a `noindex` <meta> tag), and headers also
 * protect non-HTML responses (API JSON, downloads). The customer-facing
 * private pages additionally emit `noindex` via their server layouts.
 */
const NO_INDEX_PATHS = [
  "/admin/:path*",
  "/cart/:path*",
  "/checkout/:path*",
  "/orders/:path*",
  "/profile/:path*",
  "/wishlist/:path*",
  "/login",
  "/register",
  "/api/:path*",
];

const IS_DEV = process.env.NODE_ENV === "development";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${IS_DEV ? " 'unsafe-eval'" : ""} https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://i.ibb.co https://picsum.photos https://api.dicebear.com https://www.facebook.com",
  "font-src 'self' data:",
  `connect-src 'self' https://api.emailjs.com${IS_DEV ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
  "frame-src 'self' https://www.google.com",
].join("; ");

const SECURITY_HEADERS = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: CONTENT_SECURITY_POLICY,
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
       {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ]},
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      ...NO_INDEX_PATHS.map((source) => ({
        source,
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      })),
    ];
  },
};

export default nextConfig;
