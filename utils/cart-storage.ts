export interface Product {
  productId: string;
  id: string;
  title: string;
  img: string;
  price: number;
  colour: string;
  size: string;
  stock: number;
  count: number;
}

const CART_KEY_PREFIX = 'cart_';

const getCartKey = (userId: string) => `${CART_KEY_PREFIX}${userId}`;

// ✅ Get user cart
export const getUserCart = (userId: string): Product[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(getCartKey(userId));
  return data ? JSON.parse(data) : [];
};

// ✅ Save cart
export const saveUserCart = (userId: string, items: Product[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getCartKey(userId), JSON.stringify(items));
};

// ✅ Add product
export const addToCart = (userId: string, product: Product) => {
  const cart = getUserCart(userId);
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.count += product.count;
  } else {
    cart.push(product);
  }

  saveUserCart(userId, cart);
};

// ✅ Remove product
export const removeFromCart = (userId: string, productId: string) => {
  const cart = getUserCart(userId).filter((item) => item.id !== productId);
  saveUserCart(userId, cart);
};

// ✅ Update quantity
export const updateQty = (userId: string, productId: string, count: number) => {
  const cart = getUserCart(userId);
  const product = cart.find((item) => item.id === productId);
  if (product) {
    product.count = Math.max(1, count);
    saveUserCart(userId, cart);
  }
};

// ✅ Clear cart
export const clearCart = (userId: string) => {
  localStorage.removeItem(getCartKey(userId));
};

// ✅ Get total count
export const getCartCount = (userId: string): number => {
  return getUserCart(userId).length;
};
