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
    return NO_INDEX_PATHS.map((source) => ({
      source,
      headers: [
        {
          key: "X-Robots-Tag",
          value: "noindex, nofollow",
        },
      ],
    }));
  },
};

export default nextConfig;
