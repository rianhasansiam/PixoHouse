import type { Metadata } from "next";

import { noIndexMetadata } from "@/lib/seo/metadata";

/**
 * The wishlist page is a client component. This server layout supplies a
 * noindex robots tag so the personal wishlist is never indexed, matching
 * the robots.txt disallow rule.
 */
export const metadata: Metadata = noIndexMetadata(
  "Your Wishlist",
  "Items you've saved to your EnterFly wishlist.",
);

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
