"use client";

import ProductCard from "@/app/CommonComponents/Cards";
import { CategoriesBanner } from "./CategoriesBanner";
import { ChevronRight } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  badge?: string;
};

type CategoryBanner = {
  id: string;
  image: string;
  label: string;
  heading: string;
  discount: string;
  description: string;
  link?: string;
};

type Category = {
  id: string;
  name: string;
  image?: string;
  products: Product[];
  categoryBanner?: CategoryBanner;
};

const categoriesData: Category[] = [
  {
    id: "cat1",
    name: "Grocery & Essentials",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100",
    products: [
      {
        id: "g1",
        name: "Fresh Organic Bananas",
        description: "Naturally ripened organic bananas, rich in potassium and perfect for smoothies or snacking.",
        price: 69,
        discountPrice: 49,
        image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
        images: [
          "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800",
          "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800",
        ],
        rating: 4.5,
        reviewCount: 120,
        badge: "Organic",
      },
      {
        id: "g2",
        name: "Whole Wheat Bread Loaf",
        description: "Freshly baked whole wheat bread with no preservatives. Soft, fluffy, and nutritious.",
        price: 60,
        discountPrice: 45,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
        images: [
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
          "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800",
        ],
        rating: 4.2,
        reviewCount: 85,
        badge: "Fresh",
      },
      {
        id: "g3",
        name: "Farm Fresh Eggs (12 Pack)",
        description: "Free-range farm eggs packed with protein. Ideal for breakfast, baking, and cooking.",
        price: 110,
        discountPrice: 89,
        image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400",
        images: [
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800",
          "https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=800",
        ],
        rating: 4.7,
        reviewCount: 200,
        badge: "Bestseller",
      },
      {
        id: "g4",
        name: "Organic Milk 1L",
        description: "Pure organic milk sourced from grass-fed cows. No added hormones or antibiotics.",
        price: 80,
        discountPrice: 65,
        image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400",
        images: [
          "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800",
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800",
        ],
        rating: 4.3,
        reviewCount: 95,
        badge: "Pure",
      },
      {
        id: "g5",
        name: "Fresh Tomatoes 1kg",
        description: "Vine-ripened juicy tomatoes, perfect for salads, curries, and sauces.",
        price: 50,
        discountPrice: 35,
        image: "https://images.unsplash.com/photo-1546470427-0d62b9f43ce7?w=400",
        images: [
          "https://images.unsplash.com/photo-1546470427-0d62b9f43ce7?w=800",
          "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800",
        ],
        rating: 4.1,
        reviewCount: 60,
        badge: "Farm Fresh",
      },
      {
        id: "g6",
        name: "Basmati Rice 5kg Premium",
        description: "Long-grain premium basmati rice with aromatic fragrance. Ideal for biryanis and pulao.",
        price: 520,
        discountPrice: 399,
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
        images: [
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800",
          "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=800",
        ],
        rating: 4.6,
        reviewCount: 310,
        badge: "New",
      },
    ],
    categoryBanner: {
      id: "cb1",
      image: "https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=400",
      label: "SALE",
      heading: "FLASH SALE",
      discount: "40%",
      description: "Grab amazing deals on selected groceries. Limited time offer!",
      link: "/allProducts?category=grocery",
    },
  },
  {
    id: "cat2",
    name: "Electronics & Gadgets",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100",
    products: [
      {
        id: "e1",
        name: "Wireless Bluetooth Earbuds",
        description: "Premium noise-cancelling earbuds with deep bass, 24hr battery life, and IPX5 water resistance.",
        price: 2499,
        discountPrice: 1299,
        image: "https://images.unsplash.com/photo-1590658268037-6bf12f8e4e12?w=400",
        images: [
          "https://images.unsplash.com/photo-1590658268037-6bf12f8e4e12?w=800",
          "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800",
        ],
        rating: 4.4,
        reviewCount: 540,
        badge: "Hot Deal",
      },
      {
        id: "e2",
        name: "Smart Watch Fitness Tracker",
        description: "Track steps, heart rate, sleep, and SpO2. AMOLED display with 7-day battery life.",
        price: 3499,
        discountPrice: 1999,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
          "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800",
        ],
        rating: 4.3,
        reviewCount: 320,
        badge: "Trending",
      },
      {
        id: "e3",
        name: "Portable Power Bank 10000mAh",
        description: "Slim and lightweight power bank with dual USB ports and fast charging support.",
        price: 1299,
        discountPrice: 799,
        image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400",
        images: [
          "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800",
          "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800",
        ],
        rating: 4.5,
        reviewCount: 410,
        badge: "Bestseller",
      },
      {
        id: "e4",
        name: "USB-C Fast Charging Cable",
        description: "Durable braided nylon cable with 65W fast charging. Compatible with all USB-C devices.",
        price: 499,
        discountPrice: 299,
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400",
        images: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800",
          "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800",
        ],
        rating: 4.1,
        reviewCount: 180,
        badge: "Value Pick",
      },
      {
        id: "e5",
        name: "Wireless Mouse Ergonomic",
        description: "Ergonomic design with silent clicks, adjustable DPI, and long-lasting battery.",
        price: 999,
        discountPrice: 599,
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
        images: [
          "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
          "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800",
        ],
        rating: 4.6,
        reviewCount: 275,
        badge: "Top Rated",
      },
      {
        id: "e6",
        name: "LED Desk Lamp Touch Control",
        description: "Adjustable brightness LED lamp with touch controls, USB charging port, and eye-care technology.",
        price: 1499,
        discountPrice: 899,
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400",
        images: [
          "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800",
          "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800",
        ],
        rating: 4.2,
        reviewCount: 150,
        badge: "New",
      },
    ],
    categoryBanner: {
      id: "cb2",
      image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400",
      label: "MEGA DEAL",
      heading: "TECH FEST",
      discount: "50%",
      description: "Unbeatable prices on top electronics. Don't miss out!",
      link: "/allProducts?category=electronics",
    },
  },
  {
    id: "cat3",
    name: "Fashion & Clothing",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100",
    products: [
      {
        id: "f1",
        name: "Men's Cotton Casual T-Shirt",
        description: "Breathable 100% cotton t-shirt with a relaxed fit. Available in multiple colors.",
        price: 699,
        discountPrice: 349,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        images: [
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
          "https://images.unsplash.com/photo-1503341504253-dff4f94032fc?w=800",
        ],
        rating: 4.3,
        reviewCount: 230,
        badge: "50% Off",
      },
      {
        id: "f2",
        name: "Women's Summer Floral Dress",
        description: "Lightweight floral print dress perfect for summer outings. Soft fabric with a flattering silhouette.",
        price: 1499,
        discountPrice: 799,
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400",
        images: [
          "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800",
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
        ],
        rating: 4.5,
        reviewCount: 180,
        badge: "Trending",
      },
      {
        id: "f3",
        name: "Unisex Running Sneakers",
        description: "Lightweight running shoes with cushioned sole, breathable mesh upper, and anti-slip grip.",
        price: 2199,
        discountPrice: 1299,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800",
        ],
        rating: 4.7,
        reviewCount: 450,
        badge: "Top Rated",
      },
      {
        id: "f4",
        name: "Classic Denim Jeans Slim Fit",
        description: "Stretchable slim-fit denim jeans with a classic wash. Comfortable for all-day wear.",
        price: 1599,
        discountPrice: 899,
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
        images: [
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
        ],
        rating: 4.2,
        reviewCount: 310,
        badge: "Popular",
      },
      {
        id: "f5",
        name: "Leather Belt Premium Quality",
        description: "Genuine leather belt with a polished buckle. Durable craftsmanship for everyday use.",
        price: 899,
        discountPrice: 499,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        images: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
          "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800",
        ],
        rating: 4.4,
        reviewCount: 125,
        badge: "Premium",
      },
      {
        id: "f6",
        name: "Stylish Sunglasses UV Protection",
        description: "Polarized UV400 sunglasses with a lightweight frame. Stylish design for men and women.",
        price: 1199,
        discountPrice: 599,
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
        images: [
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800",
          "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800",
        ],
        rating: 4.6,
        reviewCount: 290,
        badge: "Bestseller",
      },
    ],
    categoryBanner: {
      id: "cb3",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400",
      label: "SEASON SALE",
      heading: "STYLE UP",
      discount: "60%",
      description: "Refresh your wardrobe with trending styles at unbeatable prices!",
      link: "/allProducts?category=fashion",
    },
  },
  {
    id: "cat4",
    name: "Home & Kitchen",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100",
    products: [
      {
        id: "h1",
        name: "Non-Stick Frying Pan Set",
        description: "Premium non-stick cookware set with heat-resistant handles. Suitable for all stovetops.",
        price: 1299,
        discountPrice: 699,
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
        images: [
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
          "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800",
        ],
        rating: 4.5,
        reviewCount: 340,
        badge: "Hot Deal",
      },
      {
        id: "h2",
        name: "Stainless Steel Water Bottle",
        description: "Double-wall insulated bottle keeps drinks cold 24hrs or hot 12hrs. BPA-free and eco-friendly.",
        price: 699,
        discountPrice: 399,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
        images: [
          "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800",
          "https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=800",
        ],
        rating: 4.3,
        reviewCount: 210,
        badge: "Eco-Friendly",
      },
      {
        id: "h3",
        name: "Cotton Bedsheet King Size",
        description: "Soft 300 thread count cotton bedsheet with 2 pillow covers. Breathable and wrinkle-resistant.",
        price: 1599,
        discountPrice: 899,
        image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400",
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
        ],
        rating: 4.4,
        reviewCount: 175,
        badge: "Premium",
      },
      {
        id: "h4",
        name: "Scented Candle Gift Set",
        description: "Set of 4 soy wax candles with calming fragrances. Perfect for relaxation and gifting.",
        price: 599,
        discountPrice: 349,
        image: "https://images.unsplash.com/photo-1602607688066-d694778ba902?w=400",
        images: [
          "https://images.unsplash.com/photo-1602607688066-d694778ba902?w=800",
          "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800",
        ],
        rating: 4.6,
        reviewCount: 420,
        badge: "Gift Pick",
      },
      {
        id: "h5",
        name: "Ceramic Coffee Mug Set (4 Pcs)",
        description: "Handcrafted ceramic mugs with matte finish. Microwave and dishwasher safe.",
        price: 799,
        discountPrice: 499,
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",
        images: [
          "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",
          "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=800",
        ],
        rating: 4.2,
        reviewCount: 95,
        badge: "Handcrafted",
      },
      {
        id: "h6",
        name: "Indoor Plant Pot Decorative",
        description: "Modern minimalist ceramic pot with drainage hole. Ideal for succulents and small plants.",
        price: 499,
        discountPrice: 299,
        image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
        images: [
          "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800",
          "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800",
        ],
        rating: 4.7,
        reviewCount: 160,
        badge: "New",
      },
    ],
    categoryBanner: {
      id: "cb4",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
      label: "HOME FEST",
      heading: "DECOR SALE",
      discount: "35%",
      description: "Transform your space with premium home essentials at great prices!",
      link: "/allProducts?category=home-kitchen",
    },
  },
];

export default function Categories() {
  return (
    <div className="space-y-10">
      {categoriesData.map((category, index) => (
        <section
          key={category.id}
          className="relative"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
             
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {category.name}
                </h2>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {category.products.length} products available
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors group">
              View All
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-0.5 bg-linear-to-r from-violet-500 via-purple-400 to-transparent rounded-full mb-4"></div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 flex-1 gap-3 sm:gap-4">
              {category.products.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.discountPrice ?? item.price}
                  originalPrice={item.discountPrice ? item.price : undefined}
                  image={item.image}
                  rating={item.rating}
                  reviewCount={item.reviewCount}
                  badge={item.badge}
                />
              ))}
            </div>

            {/* Flash Sale Banner - Desktop only */}
            {category.categoryBanner && (
              <CategoriesBanner saleBanner={category.categoryBanner} />
            )}
          </div>

          {/* Load More */}
          <div className="text-center mt-5">
            <button className="px-6 py-2.5 bg-linear-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold text-sm hover:from-violet-700 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md">
              Load More Products
            </button>
          </div>

          {/* Section separator (except last) */}
          {index < categoriesData.length - 1 && (
            <div className="mt-8 border-b border-gray-100"></div>
          )}
        </section>
      ))}
    </div>
  );
}
