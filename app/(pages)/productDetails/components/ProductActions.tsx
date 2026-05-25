'use client'

import React, { useState } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'

const ProductActions = ({
  productId,
  productName,
  price,
  inStock,
  stockCount = 10,
}: {
  productId: number
  productName: string
  price: number
  inStock: boolean
  stockCount?: number
}) => {
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(stockCount, prev + delta)))
  }

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      {/* Quantity Selector & Add to Cart */}
      <div className="flex items-center gap-4">
        {/* Quantity */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="w-12 text-center font-medium text-gray-900">
            {quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= stockCount}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            inStock
              ? addedToCart
                ? 'bg-green-500 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {addedToCart ? 'Added!' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}

export default ProductActions
