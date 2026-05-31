import type { Metadata } from "next";

import CaroselBanner from "./components/CarouselBanner";
import Categories from "./components/Categories";
import { getHomeCategories } from "@/lib/services/home-categories.service";
import { buildMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} - Online Shopping for Electronics, Fashion & More`,
  description: siteConfig.description,
  path: "/",
  keywords: [
    "online shopping",
    "ecommerce store",
    "shop electronics",
    "fashion online",
    ...siteConfig.keywords,
  ],
});

export default async function Home() {
  const categories = await getHomeCategories();

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <CaroselBanner />
      </div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-10">
        <Categories initialCategories={categories} />
      </div>
    </>
  );
}
