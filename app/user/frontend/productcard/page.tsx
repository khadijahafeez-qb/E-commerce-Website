'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Image, notification } from 'antd';
import './style.css';
import { addToCart, getUserCart } from '@/utils/cart-storage';
import { useSession } from 'next-auth/react';

export interface ProductVariant {
  id: string;
  img: string;
  colour: string;
  colourcode?: string;
  size: string;
  stock: number;
  price: number;
  availabilityStatus: 'ACTIVE' | 'INACTIVE';
}

export interface ProductCardProps {
  id: string;
  title: string;
  isDeleted: boolean;
  variants: ProductVariant[];
}

const ProductCard: React.FC<ProductCardProps> = ({ id, title, variants }) => {
  const [selectedColor, setSelectedColor] = useState<ProductVariant | null>(
    variants[0] || null
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    variants[0]?.size || ''
  );
  const [count, setCount] = useState(1);

  const { data: session } = useSession();
  const userEmail = session?.user?.email || 'guest';

  const [api, contextHolder] = notification.useNotification();

  // optional: you can show what's currently in localStorage
  useEffect(() => {
    if (userEmail) {
      getUserCart(userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    if (!selectedColor) return;
    const firstSizeForColor = variants.find(
      v => v.colour === selectedColor.colour
    )?.size;
    setSelectedSize(firstSizeForColor || '');
    setCount(1);
  }, [selectedColor, variants]);

  const currentVariant = variants.find(
    v => v.colour === selectedColor?.colour && v.size === selectedSize
  );

  const handleAddToCart = () => {
    if (!currentVariant) return;

    const existingCart = getUserCart(userEmail);
    const existing = existingCart.find(item => item.id === currentVariant.id);
    const currentCount = existing ? existing.count : 0;

    if (currentCount + count > currentVariant.stock) {
      api.error({
        message: 'Cannot Add to Cart',
        description: `Only ${currentVariant.stock - currentCount} items available in stock.`,
        placement: 'topRight',
      });
      return;
    }

    // ✅ Add directly to localStorage (no Redux, no state)
    addToCart(userEmail, {
      productId: id,
      id: currentVariant.id,
      title,
      img: currentVariant.img,
      price: currentVariant.price,
      colour: currentVariant.colour,
      size: currentVariant.size,
      stock: currentVariant.stock,
      count,
    });

    api.success({
      message: 'Added to Cart',
      description: `${title} (${currentVariant.colour} - ${currentVariant.size}) x${count} added`,
      placement: 'topRight',
    });
  };

  const uniqueColors = Array.from(
    new Map(variants.map(v => [v.colour, v])).values()
  );

  const sizesForColor = variants
    .filter(v => v.colour === selectedColor?.colour)
    .map(v => v.size);

  return (
    <>
      {contextHolder}
      <Card bodyStyle={{ padding: 16 }} headStyle={{ padding: 0 }}>
        <div className="product-images">
          <Image
            src={currentVariant?.img ?? '/placeholder.png'}
            alt={title}
            className="main-image"
          />
          <div className="thumbnail-row">
            {uniqueColors.map(v => (
              <Image
                key={v.id}
                src={v.img}
                className={`thumbnail ${
                  selectedColor?.colour === v.colour ? 'selected' : ''
                }`}
                onClick={() => setSelectedColor(v)}
                width={50}
                height={50}
                preview={false}
                alt="row-images"
              />
            ))}
          </div>
        </div>

        <p className="cardTitle mt-4">{title}</p>
        <p className="price">Price: ${currentVariant?.price ?? 'N/A'}</p>

        <div className="sizes mt-2 flex flex-wrap gap-2">
          {sizesForColor.map(size => {
            const variantForSize = variants.find(
              v => v.colour === selectedColor?.colour && v.size === size
            );
            const outOfStock = variantForSize?.stock === 0;
            return (
              <Button
                key={size}
                type={selectedSize === size ? 'primary' : 'default'}
                disabled={outOfStock}
                onClick={() => setSelectedSize(size)}
              >
                <span className={outOfStock ? 'line-through' : ''}>
                  {size}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="quantity-cart mt-3 flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            <Button
              type="text"
              onClick={() => setCount(prev => Math.max(prev - 1, 1))}
              disabled={count <= 1}
            >
              -
            </Button>
            <Button className="button">{count}</Button>
            <Button
              type="text"
              onClick={() =>
                setCount(prev =>
                  prev < (currentVariant?.stock ?? 0) ? prev + 1 : prev
                )
              }
              disabled={count >= (currentVariant?.stock ?? 0)}
            >
              +
            </Button>
          </div>
          <Button
            type="primary"
            disabled={(currentVariant?.stock ?? 0) === 0}
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
          <span>Stock: {currentVariant?.stock ?? 0}</span>
        </div>
      </Card>
    </>
  );
};

export default ProductCard;
