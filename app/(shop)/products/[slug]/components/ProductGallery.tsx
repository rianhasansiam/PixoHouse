'use client'

import React, { useState } from 'react'
import Image from 'next/image'

const ProductGallery = ({
  images,
  productName,
}: {
  images: string[]
  productName: string
}) => {
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <Image
          src={images[selectedImage]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-contain p-4"
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`relative aspect-4/5 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
              selectedImage === index
                ? 'border-brand-red'
                : 'border-gray-200 hover:border-brand-red'
            }`}
          >
            <Image
              src={image}
              alt={`Thumbnail ${index + 1}`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProductGallery
