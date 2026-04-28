import { api } from '@/lib/api';
import type { OrderItemStatus } from './orders';

export type Sale = {
  id: string;
  status: OrderItemStatus;
  productName: string;
  pricePerKg: number;
  kg: number;
  order: { id: string; createdAt: string; shippingAddress: string };
  buyer: { id: string; name: string; city: string | null };
};

async function listSales() {
  const res = await api.get<Sale[]>('/me/sales');
  return res.data;
}

async function setSaleStatus(itemId: string, status: 'shipped' | 'delivered') {
  const res = await api.patch(`/me/sales/${itemId}`, { status });
  return res.data;
}

export const salesApi = {
  list: listSales,
  setStatus: setSaleStatus,
};
