'use client';

import React, { useState } from 'react';
import { Card, Button, notification, Image } from 'antd';
import './style.css';

import { useAppDispatch, useAppSelector } from '@/lib/hook';
import { addToCart } from '@/lib/features/cart/cartSlice';

export interface Product {
  title: string;
  img: string;
  price: number;
  id: string;
  colour: string;
  size: string;
  stock: number;
}

const ProductCard: React.FC<Product> = ({ title, img, price, id, colour, size, stock }) => {
  const [count, setCount] = useState(1);
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const [api, contextHolder] = notification.useNotification();

  const handleAddToCart = () => {
    const existing = cartItems.find(item => item.id === id); 
    const currentCount = existing ? existing.count : 0;
    if (currentCount + count > stock) {
      api.error({
        message: 'Cannot Add to Cart',
        description: `Only ${stock - currentCount} items available in stock.`,
        placement: 'topRight',
      });
      return;
    }
    dispatch(addToCart({ id, title, img, price, colour, size, stock, count }));
    api.success({
      message: 'Added to Cart ',
      description: `${title} (x${count}) has been added to your shopping cart.`,
      placement: 'topRight',
    });
  };
  return (
    <>
      {contextHolder}
      <Card
        bodyStyle={{ padding: 16 }}
        headStyle={{ padding: 0 }}
      >
        <Image
          src={img}
          alt="example"
          className="cardImg aspect-[1.1577]"
        />
        <div className='pt-4'>
          <p className="cardTitle">
            {title}
          </p>
          <div className='flex items-center mt-2 gap-[2px]'>
            <p className='price-label'>
              Price
            </p>
            <p className='price'>
              ${price}
            </p>
          </div >
          <div className='flex flex-wrap items-center gap-5 mt-[35px]'>
            <div className='flex gap-1'>
              <Button
               type='text' className='buttons'
               onClick={() => setCount((prev) => Math.max(prev - 1, 0))}
               disabled={count <= 1}
              >
                -
              </Button>
              <Button className='button' >{count}</Button>
              <Button type='text' className='buttons'
                onClick={() => setCount((prev) => (prev < stock ? prev + 1 : prev))}
                disabled={count >= stock} >
                +
              </Button>
            </div>

            <div className='ml-auto'>
               {stock > 0 ?
                (<Button type='primary' className='add-to-cart'
                  onClick={handleAddToCart}>Add to Cart</Button>) : (
                 <Button disabled className="out-of-stock"
                  >Out Of Stock</Button>
                )}
            </div>
          </div>
        </div>
      </Card>
   </>
  );
};
export default ProductCard;
