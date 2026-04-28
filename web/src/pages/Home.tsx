import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/products';
import { ProductCard } from '@/components/ProductCard';
import { ResponsiveSidebar } from '@/components/ResponsiveSidebar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);

  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: productsApi.categories });
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', { q, cat }],
    queryFn: () => productsApi.list({ q: q || undefined, category: cat ?? undefined }),
  });

  const sidebarContent = (close?: () => void) => (
    <>
      <h2 className="hidden md:block text-base font-semibold tracking-tight mb-1">Categorías</h2>
      <button
        className={`block text-left text-sm py-1.5 ${!cat ? 'font-semibold' : 'text-muted-foreground'}`}
        onClick={() => { setCat(null); close?.(); }}
      >Todas</button>
      {cats?.map((c) => (
        <button
          key={c.id}
          className={`block text-left text-sm py-1.5 ${cat === c.slug ? 'font-semibold' : 'text-muted-foreground'}`}
          onClick={() => { setCat(c.slug); close?.(); }}
        >{c.name}</button>
      ))}
    </>
  );

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[200px_1fr] md:gap-6">
      <ResponsiveSidebar mobileLabel={cat ? `Categoría: ${cats?.find((c) => c.slug === cat)?.name ?? '…'}` : 'Categorías'}>
        {(close) => sidebarContent(close)}
      </ResponsiveSidebar>
      <section>
        <Input placeholder="Buscar producto…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
          </div>
        ) : products?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : <p className="text-muted-foreground">Sin resultados.</p>}
      </section>
    </div>
  );
}
