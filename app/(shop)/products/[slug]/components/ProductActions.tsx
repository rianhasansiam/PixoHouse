"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";

import {
  setCartData,
  setCartError as setCartErrorAction,
} from "@/store/slices/cart.slice";
import type { AppDispatch } from "@/store";
import {
  canUseServerCart,
  createCartItemOnServer,
  fetchServerCartSnapshot,
} from "@/features/cart/api";
import { computeCartSummary } from "@/features/cart/summary";
import {
  readLocalCart,
  upsertLocalCartItem,
  writeLocalCart,
} from "@/features/cart/storage";
import type { CartItem } from "@/features/cart/api";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

const HEX_VALUE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** True when the variant's color is a hex value (vs a legacy color name). */
function colorIsHex(value: string | null): boolean {
  return typeof value === "string" && HEX_VALUE.test(value.trim());
}

export type ProductVariantOption = {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
};

/**
 * Build a human label for a variant, e.g. "Black / Large".
 * Hex colors are omitted from the text (a swatch is shown beside the label
 * instead) so the button never prints a raw "#070716".
 */
function variantLabel(variant: ProductVariantOption): string {
  const textColor = colorIsHex(variant.color) ? null : variant.color;
  const parts = [textColor, variant.size].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : variant.sku;
}

function effectivePrice(variant: ProductVariantOption): number {
  return variant.salePrice != null && variant.salePrice < variant.price
    ? variant.salePrice
    : variant.price;
}

const ProductActions = ({
  productId,
  productName,
  image,
  variants,
}: {
  productId: string;
  productName: string;
  image?: string | null;
  variants: ProductVariantOption[];
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Default to the first in-stock variant, falling back to the first one.
  const initialVariantId = useMemo(() => {
    const inStock = variants.find((v) => v.stock > 0);
    return (inStock ?? variants[0])?.id ?? null;
  }, [variants]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariantId,
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isCartBusy, setIsCartBusy] = useState(false);

  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;

  const hasVariantChoice = variants.length > 1;
  const stockCount = selectedVariant?.stock ?? 0;
  const inStock = stockCount > 0;
  const unitPrice = selectedVariant ? effectivePrice(selectedVariant) : 0;
  const listPrice = selectedVariant?.price ?? 0;
  const discount =
    listPrice > unitPrice
      ? Math.round(((listPrice - unitPrice) / listPrice) * 100)
      : 0;

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
    setAddedToCart(false);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(stockCount || 1, prev + delta)));
  };

  const handleAddToCart = async () => {
    if (!inStock || isCartBusy || !selectedVariant) return;

    const canUseServer = canUseServerCart(session?.user?.role, status);
    dispatch(setCartErrorAction(null));

    if (canUseServer) {
      setIsCartBusy(true);
      try {
        await createCartItemOnServer(productId, quantity, selectedVariant.id);
        const snapshot = await fetchServerCartSnapshot();
        writeLocalCart(snapshot.items);
        dispatch(setCartData(snapshot));
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to add item to cart.";
        dispatch(setCartErrorAction(message));
      } finally {
        setIsCartBusy(false);
      }
      return;
    }

    const localBefore = readLocalCart();
    const optimisticItem: CartItem = {
      id: `local:${selectedVariant.id}`,
      productId,
      variantId: selectedVariant.id,
      sku: selectedVariant.sku,
      color: selectedVariant.color,
      size: selectedVariant.size,
      name: productName,
      image: image ?? FALLBACK_PRODUCT_IMAGE,
      quantity,
      unitPrice,
      originalPrice: listPrice,
      lineTotal: unitPrice * quantity,
      stock: Math.max(stockCount, 1),
      status: "ACTIVE",
    };

    const nextLocal = upsertLocalCartItem(localBefore, optimisticItem);
    writeLocalCart(nextLocal);
    dispatch(setCartData({ items: nextLocal, summary: computeCartSummary(nextLocal) }));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!inStock || !selectedVariant) return;
    // Carry the variant so checkout buys the exact selected item.
    const target = `/checkout?buy=${encodeURIComponent(
      `${productId}:${quantity}:${selectedVariant.id}`,
    )}`;
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(target)}`);
      return;
    }
    router.push(target);
  };

  return (
    <div className="space-y-5 pt-4 border-t border-gray-100">
      {/* Price for the selected variant */}
      {selectedVariant && (
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-bold text-gray-900">
            {unitPrice.toLocaleString()} BDT
          </span>
          {discount > 0 && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {listPrice.toLocaleString()} BDT
              </span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                -{discount}%
              </span>
            </>
          )}
        </div>
      )}

      {/* Variant picker */}
      {hasVariantChoice && (
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">
            Select option
            {selectedVariant && (
              <span className="ml-1 font-normal text-gray-500">
                ({variantLabel(selectedVariant)})
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariantId;
              const isOut = variant.stock <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleSelectVariant(variant.id)}
                  disabled={isOut}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-violet-600 bg-violet-50 text-violet-700 ring-1 ring-violet-600"
                      : isOut
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 line-through"
                        : "border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                  }`}
                >
                  {colorIsHex(variant.color) && (
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-inset ring-black/15"
                      style={{ backgroundColor: variant.color as string }}
                      aria-hidden
                    />
                  )}
                  {variantLabel(variant)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock hint */}
      {selectedVariant && (
        <p className="text-xs font-medium text-gray-500">
          {inStock ? (
            <>
              <span className="text-emerald-600">In stock</span>
              {stockCount <= 5 && (
                <span className="ml-1 text-amber-600">
                  · only {stockCount} left
                </span>
              )}
            </>
          ) : (
            <span className="text-rose-600">Out of stock</span>
          )}
        </p>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="w-12 text-center font-medium text-gray-900">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= stockCount}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <button
          onClick={() => {
            void handleAddToCart();
          }}
          disabled={!inStock || isCartBusy}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            inStock
              ? addedToCart
                ? "bg-green-500 text-white"
                : "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {addedToCart ? "Added!" : "Add to cart"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={!inStock}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
          inStock
            ? "bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Zap className="h-4 w-4" />
        Buy now
      </button>
    </div>
  );
};

export default ProductActions;
