"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { resolveBannerBackground } from "@/components/ui/tailwind-palette";

/**
 * Home page hero carousel.
 *
 * Slides are managed from the admin "Banners" page (CAROUSEL type in the
 * unified `Banner` model) and passed in from the server component. Each
 * slide paints its background either as a gradient (bgFrom/bgVia/bgTo)
 * or a single solid color (bgColor), selected by `bgType`.
 *
 * Colors are stored as hex values (chosen with the admin color picker) and
 * applied via inline `style`. Older rows that still hold Tailwind class
 * strings are resolved to hex by `resolveBannerBackground`, so existing
 * slides keep rendering.
 */
export type CarouselSlide = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  bgType: "gradient" | "solid";
  bgFrom: string | null;
  bgVia: string | null;
  bgTo: string | null;
  bgColor: string | null;
  link: string | null;
};

/** Build the hero panel background as a CSS value (hex gradient or solid). */
function heroBackground(slide: CarouselSlide): string {
  return resolveBannerBackground({
    bgType: slide.bgType,
    bgColor: slide.bgColor,
    bgFrom: slide.bgFrom,
    bgVia: slide.bgVia,
    bgTo: slide.bgTo,
  });
}

/** Compact background for the deal selector cards (no "via" stop). */
function cardBackground(slide: CarouselSlide): string {
  return resolveBannerBackground({
    bgType: slide.bgType,
    bgColor: slide.bgColor,
    bgFrom: slide.bgFrom,
    bgTo: slide.bgTo,
  });
}

export default function CaroselBanner({ slides }: { slides: CarouselSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) =>
        prevIndex === slides.length - 1 ? 0 : prevIndex + 1,
      );
    }, 3500);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  // Slides can change between renders (admin edits + revalidation), so
  // clamp at render time to stay in range without an extra state sync.
  const safeIndex = Math.min(activeIndex, slides.length - 1);
  const activeDeal = slides[safeIndex];

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden rounded-2xl mx-3 sm:mx-4 lg:mx-6 mt-4 transition-all duration-700"
        style={{ background: heroBackground(activeDeal) }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 sm:px-10 py-8 sm:py-12">
          {/* Text Content */}
          <div
            key={activeDeal.id}
            className="text-white text-center md:text-left mb-6 md:mb-0 max-w-lg animate-in fade-in slide-in-from-left-5 duration-700"
          >
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-3">
              🎉 {activeDeal.badge}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
              {activeDeal.title}
              <br />
              <span className="text-yellow-300">{activeDeal.subtitle}</span>
            </h1>

            <p className="text-sm sm:text-base text-white/80 mb-5 max-w-md">
              {activeDeal.description}
            </p>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                href={activeDeal.link ?? "/products"}
                className="px-6 py-2.5 bg-white text-violet-700 font-bold text-sm rounded-full hover:bg-yellow-300 hover:text-violet-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Shop Now
              </Link>

              <Link
                href="/products"
                className="px-6 py-2.5 border-2 border-white/50 text-white font-semibold text-sm rounded-full hover:bg-white/10 transition-all duration-300"
              >
                View Offers
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div
            key={`${activeDeal.id}-image`}
            className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 shrink-0 animate-in fade-in zoom-in-95 duration-700"
          >
            <Image
              src={activeDeal.image}
              alt={activeDeal.subtitle}
              fill
              className="object-cover rounded-full border-4 border-white/30 shadow-2xl"
              sizes="(max-width: 640px) 192px, (max-width: 1024px) 256px, 288px"
              priority
            />

            <div className="absolute -top-2 -right-2 bg-yellow-400 text-violet-900 font-black text-sm px-3 py-1.5 rounded-full shadow-lg animate-bounce">
              {activeDeal.title}
            </div>
          </div>
        </div>
      </div>

      {/* Deal Cards */}
      {slides.length > 1 && (
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {slides.map((card, index) => {
              const isActive = index === safeIndex;

              return (
                <button
                  key={card.id}
                  onClick={() => setActiveIndex(index)}
                  style={{ background: cardBackground(card) }}
                  className={`rounded-xl min-w-[160px] sm:min-w-[180px] h-28 sm:h-32 shrink-0
                  shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                  cursor-pointer relative overflow-hidden group flex-1 text-left
                  ${
                    isActive
                      ? "ring-4 ring-yellow-300 ring-offset-2 ring-offset-white scale-[1.03]"
                      : "ring-1 ring-white/20"
                  }
                `}
                >
                  <Image
                    src={card.image}
                    alt={card.subtitle}
                    fill
                    className={`object-cover transition-all duration-500 ${
                      isActive
                        ? "opacity-60 scale-110"
                        : "opacity-40 group-hover:opacity-50 group-hover:scale-110"
                    }`}
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

                  {/* Active Progress Indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 h-1 bg-yellow-300 animate-[progress_3.5s_linear_infinite]" />
                  )}

                  <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-3">
                    <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-lg mb-0.5">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-white/90 drop-shadow">
                      {card.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
