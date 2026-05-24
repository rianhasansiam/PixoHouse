"use client";

import { useMemo, useState } from "react";
import FilterSidebar from "./components/FilterSidebar";
import MobileFilterDrawer from "./components/MobileFilterDrawer";
import PageHeader from "./components/PageHeader";
import Pagination from "./components/Pagination";
import ProductsGrid from "./components/ProductsGrid";
import ProductToolbar from "./components/ProductToolbar";
import { allProductsData, PRICE_BOUNDS } from "./components/data";
import type { Filters, SortOption, ViewMode } from "./components/types";

const DEFAULT_FILTERS: Filters = {
  categories: [],
  brands: [],
  priceRange: PRICE_BOUNDS,
  minRating: 0,
  inStockOnly: false,
};

const PAGE_SIZE = 12;

export default function AllProductsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filtered = useMemo(() => {
    let list = allProductsData.filter((p) => {
      const finalPrice = p.discountPrice ?? p.price;
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(p.category)
      )
        return false;
      if (
        filters.brands.length > 0 &&
        (!p.brand || !filters.brands.includes(p.brand))
      )
        return false;
      if (
        finalPrice < filters.priceRange[0] ||
        finalPrice > filters.priceRange[1]
      )
        return false;
      if (filters.minRating > 0 && p.rating < filters.minRating) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const aPrice = a.discountPrice ?? a.price;
      const bPrice = b.discountPrice ?? b.price;
      switch (sort) {
        case "price-low":
          return aPrice - bPrice;
        case "price-high":
          return bPrice - aPrice;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return b.id.localeCompare(a.id);
        case "popular":
        default:
          return b.reviewCount - a.reviewCount;
      }
    });

    return list;
  }, [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleFiltersChange = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
       

        <div className="flex gap-5">
          {/* Desktop Sidebar (collapsible) */}
          <div
            className={`hidden lg:block shrink-0 overflow-hidden transition-[width,opacity,margin] duration-300 ease-in-out ${
              sidebarOpen
                ? "w-64 opacity-100"
                : "w-0 opacity-0 -ml-5"
            }`}
            aria-hidden={!sidebarOpen}
          >
            <div className="w-64">
              <FilterSidebar
                filters={filters}
                onChange={handleFiltersChange}
                onReset={resetFilters}
              />
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <ProductToolbar
              resultsCount={filtered.length}
              totalCount={allProductsData.length}
              sort={sort}
              onSortChange={setSort}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenMobileFilter={() => setMobileFilterOpen(true)}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((o) => !o)}
            />

            <ProductsGrid
              products={pageItems}
              viewMode={viewMode}
              onClearFilters={resetFilters}
              wide={!sidebarOpen}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </main>
        </div>
      </div>

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onChange={handleFiltersChange}
        onReset={resetFilters}
      />
    </div>
  );
}
