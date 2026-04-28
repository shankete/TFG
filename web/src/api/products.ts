import { api } from '@/lib/api';

// Tipos que devuelve la API de productos.
export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  category: Category;
  minPricePerKg: number | null;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  category: Category;
  listings: {
    id: string;
    pricePerKg: number;
    seller: { id: string; name: string; city: string | null };
  }[];
};

// Funciones para llamar al backend.
async function listProducts(params: { q?: string; category?: string }) {
  const res = await api.get<ProductListItem[]>('/products', { params });
  return res.data;
}

async function getProduct(id: string) {
  const res = await api.get<ProductDetail>(`/products/${id}`);
  return res.data;
}

async function listCategories() {
  const res = await api.get<Category[]>('/categories');
  return res.data;
}

export const productsApi = {
  list: listProducts,
  get: getProduct,
  categories: listCategories,
};
