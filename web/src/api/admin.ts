import { api } from '@/lib/api';
import type { Category } from './products';

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  category: Category;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'admin';
  city: string | null;
  banned: boolean;
  createdAt: string;
};

export type AdminListing = {
  id: string;
  productId: string;
  sellerId: string;
  pricePerKg: number;
  active: boolean;
  createdAt: string;
  product: { id: string; name: string };
  seller: { id: string; name: string; email: string; city: string | null };
};

// ----- Productos (admin) -----
type ProductBody = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  categoryId: string;
};

async function listAdminProducts() {
  const res = await api.get<AdminProduct[]>('/admin/products');
  return res.data;
}

async function createAdminProduct(body: ProductBody) {
  const res = await api.post<AdminProduct>('/admin/products', body);
  return res.data;
}

async function updateAdminProduct(id: string, body: Partial<ProductBody>) {
  const res = await api.patch<AdminProduct>(`/admin/products/${id}`, body);
  return res.data;
}

async function removeAdminProduct(id: string) {
  const res = await api.delete(`/admin/products/${id}`);
  return res.data;
}

// ----- Usuarios (admin) -----
async function listAdminUsers() {
  const res = await api.get<AdminUser[]>('/admin/users');
  return res.data;
}

async function banUser(id: string) {
  const res = await api.patch(`/admin/users/${id}/ban`);
  return res.data;
}

async function unbanUser(id: string) {
  const res = await api.patch(`/admin/users/${id}/unban`);
  return res.data;
}

// ----- Listings (admin) -----
async function listAdminListings() {
  const res = await api.get<AdminListing[]>('/admin/listings');
  return res.data;
}

export const adminApi = {
  products: {
    list: listAdminProducts,
    create: createAdminProduct,
    update: updateAdminProduct,
    remove: removeAdminProduct,
  },
  users: {
    list: listAdminUsers,
    ban: banUser,
    unban: unbanUser,
  },
  listings: {
    list: listAdminListings,
  },
};
