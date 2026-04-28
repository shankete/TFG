import { api } from '@/lib/api';
import type { ProductListItem } from './products';

export type Listing = {
  id: string;
  sellerId: string;
  productId: string;
  pricePerKg: number;
  active: boolean;
  product: ProductListItem;
};

async function listMine() {
  const res = await api.get<Listing[]>('/me/listings');
  return res.data;
}

async function createListing(body: { productId: string; pricePerKg: number }) {
  const res = await api.post<Listing>('/me/listings', body);
  return res.data;
}

async function updateListing(id: string, body: { pricePerKg?: number; active?: boolean }) {
  const res = await api.patch<Listing>(`/me/listings/${id}`, body);
  return res.data;
}

async function removeListing(id: string) {
  const res = await api.delete(`/me/listings/${id}`);
  return res.data;
}

export const listingsApi = {
  mine: listMine,
  create: createListing,
  update: updateListing,
  remove: removeListing,
};
