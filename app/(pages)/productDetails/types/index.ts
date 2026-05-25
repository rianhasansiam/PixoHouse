// Product Details Page - Type Definitions
// Centralized types for all product details components

import { ReactNode } from 'react'

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export interface ProductGalleryProps {
  images: string[]
  productName: string
}

export interface ProductSpec {
  id: string
  icon: string
  label: string
  value: string
}

export interface ProductInfoProps {
  name: string
  price: number
  originalPrice: number
  discount: number
  specs: ProductSpec[]
  deliveryTime?: string
}

export interface ProductActionsProps {
  productId: number
  productName: string
  price: number
  inStock: boolean
  stockCount?: number
}

export interface RecentProductItem {
  id: number
  name: string
  image: string
  price: number
  originalPrice: number
  discount: number
}

export interface RecentProductsProps {
  products: RecentProductItem[]
  title?: string
}

export interface DealBanner {
  id: number
  image: string
  title: string
  subtitle: string
  bgClass: string
  link: string
}

export interface DealsCarouselProps {
  deals: DealBanner[]
  title?: string
}

export interface PromoBanner {
  id: number
  image: string
  title: string
  subtitle: string
  discount: string
  bgClass: string
  link: string
}

export interface PromoBannersProps {
  banners: PromoBanner[]
}

export interface RelatedProductsProps {
  products: RecentProductItem[]
  title?: string
}

// ============================================================================
// ICON MAPPING TYPE
// ============================================================================

export type IconName = 
  | 'Battery'
  | 'Bluetooth'
  | 'Headphones'
  | 'Mic'
  | 'Armchair'
  | 'Lightbulb'
  | 'SlidersHorizontal'
  | 'Monitor'
  | 'Cpu'
  | 'Camera'
  | 'HardDrive'
  | 'Smartphone'
  | 'Keyboard'
  | 'Usb'
  | 'Square'
  | 'Settings'
