import { api } from '@/lib/api';

// Item del carrito tal y como lo devuelve el backend.
export type CartItem = {
  id: string;
  kg: number;
  listingId: string;
  listing: {
    id: string;
    pricePerKg: number;
    active: boolean;
    product: { id: string; name: string; imageUrl: string };
    seller: { id: string; name: string; city: string | null };
  };
};

async function listCart() {
  const res = await api.get<CartItem[]>('/me/cart');
  return res.data;
}

async function addToCart(body: { listingId: string; kg: number }) {
  const res = await api.post('/me/cart', body);
  return res.data;
}

async function updateCartItem(id: string, body: { kg: number }) {
  const res = await api.patch<CartItem>(`/me/cart/${id}`, body);
  return res.data;
}

async function removeCartItem(id: string) {
  const res = await api.delete(`/me/cart/${id}`);
  return res.data;
}

export const cartApi = {
  list: listCart,
  add: addToCart,
  update: updateCartItem,
  remove: removeCartItem,
};
