"use client";

import {
  X,
  Sparkles,
  ArrowRight,
  Tag,
  Zap,
  Gift,
  
  TrendingUp,
  Percent,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

export type TopBannerSlide = {
  id: string;
  icon: string;
  badge: string;
  discount: string;
  description: string;
  tag: string;
  tagIcon: string;
  link: string | null;
};

/**
 * Map the icon-name strings stored on the banner (admin types e.g.
 * "Sparkles", "Zap") onto real lucide components. Unknown names fall
 * back to a sensible default so a typo never crashes the render.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Tag,
  Sparkles,
  Zap,
  Gift,
  TrendingUp,
  Percent,
  ArrowRight,
};

function resolveIcon(name: string, fallback: LucideIcon): LucideIcon {
  return ICON_MAP[name] ?? fallback;
}







const TopBannerClient = ({ slides }: { slides: TopBannerSlide[] }) => {




  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rotate only when there's more than one slide to show.
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  // Guard the index against a slide list that shrank between renders.
  const safeIndex = currentIndex % Math.max(slides.length, 1);
  const currentSale = slides[safeIndex];

  const CurrentIcon = useMemo(
    () => (currentSale ? resolveIcon(currentSale.icon, Tag) : Tag),
    [currentSale],
  );



  const CurrentTagIcon = useMemo(
    () => (currentSale ? resolveIcon(currentSale.tagIcon, Sparkles) : Sparkles),
    [currentSale],
  );




  if (!isVisible || !currentSale) return null;

  return (
    <div className="relative bg-linear-to-r from-violet-600 via-violet-500 to-indigo-500 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse opacity-60"></div>
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-100 opacity-60"></div>
        <div className="absolute -bottom-4 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse delay-200 opacity-60"></div>
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-1 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-4">
          

          {/* Animated Text */}
          <div className="grow flex items-center justify-center min-w-0">
            <div
              className={`flex flex-wrap items-center justify-center gap-x-1 sm:gap-x-3 md:gap-x-4 gap-y-0.5 text-white 
              transition-all duration-300 ease-in-out text-center 
              ${
                isAnimating
                  ? "opacity-0 translate-y-1"
                  : "opacity-100 translate-y-0"
              }`}
            >
              {/* Badge */}
              <div className="flex items-center gap-1 shrink-0">
                <CurrentIcon className="w-3 h-3 sm:w-4 md:w-5" />
                <span className="font-bold text-[10px] sm:text-sm md:text-base tracking-wide">
                  {currentSale.badge}
                </span>
              </div>

              <div className="hidden sm:block w-px h-4 bg-white/40"></div>

              {/* Discount Text */}
              <p className="text-[9px] sm:text-xs md:text-sm font-medium shrink-0">
                <span className="font-extrabold text-xs sm:text-base md:text-lg mx-1 text-yellow-300">
                  {currentSale.discount}
                </span>
                {currentSale.description}
              </p>

              <div className="hidden sm:block w-px h-4 bg-white/40"></div>

              {/* Tag */}
              <span className="hidden sm:flex items-center gap-1 text-xs md:text-sm shrink-0 whitespace-nowrap">
                <CurrentTagIcon className="w-3.5 h-3.5" />
                {currentSale.tag}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href={currentSale.link || "/products"}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white text-violet-700 rounded-lg shrink-0
            font-semibold text-xs md:text-sm hover:bg-violet-50 transition-all duration-200 hover:scale-[1.05] shadow-lg shadow-violet-500/30"
          >
            Shop Now
            <ArrowRight className="w-3 h-3" />
          </Link>

          {/* Close Button */}
          <button
            aria-label="Close Banner"
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-white/20 rounded-md transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Glow Line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
    </div>
  );
};

export default TopBannerClient;
