import { api } from '@/lib/api';

// Estados posibles de una línea de pedido.
export type OrderItemStatus = 'pending' | 'shipped' | 'delivered';

export type OrderItem = {
  id: string;
  orderId: string;
  listingId: string | null;
  sellerId: string;
  productName: string;
  pricePerKg: number;
  kg: number;
  status: OrderItemStatus;
};

export type Order = {
  id: string;
  buyerId: string;
  shippingAddress: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

async function checkout(body: { shippingAddress: string }) {
  const res = await api.post<{ id: string }>('/me/orders', body);
  return res.data;
}

async function listOrders() {
  const res = await api.get<Order[]>('/me/orders');
  return res.data;
}

async function getOrder(id: string) {
  const res = await api.get<Order>(`/me/orders/${id}`);
  return res.data;
}

async function confirmItem(orderId: string, itemId: string) {
  const res = await api.patch<OrderItem>(`/me/orders/${orderId}/items/${itemId}/confirm`);
  return res.data;
}

export const ordersApi = {
  checkout,
  list: listOrders,
  get: getOrder,
  confirm: confirmItem,
};

// Devuelve el estado "general" de un pedido a partir del estado de sus items.
// Si todos están en el mismo estado lo devolvemos, si no decimos que es parcial.
export function aggregateStatus(items: OrderItem[]): OrderItemStatus | 'partial' {
  if (items.length === 0) return 'pending';
  const first = items[0].status;
  for (const it of items) {
    if (it.status !== first) return 'partial';
  }
  return first;
}
