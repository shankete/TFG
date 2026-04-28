import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/products';
import { cartApi } from '@/api/cart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

// Página de detalle de producto: muestra la info del producto y la lista
// de vendedores que lo ofrecen, con filtros por ciudad y orden por precio.
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // Datos del producto (con sus vendedores activos).
  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id!),
    enabled: !!id,
  });

  // Filtro de ciudad y orden de precio (estado local).
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // Cantidad en kg que el usuario quiere añadir al carrito por cada vendedor.
  const [kgByListing, setKgByListing] = useState<Record<string, number>>({});

  // Mutación para añadir al carrito.
  const addMutation = useMutation({
    mutationFn: cartApi.add,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Añadido al carrito');
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.error?.message ?? 'Error';
      toast.error(msg);
    },
  });

  // Skeleton mientras se carga.
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <Skeleton className="aspect-square w-full max-w-md md:max-w-none" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-40 w-full mt-6" />
        </div>
      </div>
    );
  }

  if (!product) return <p>Producto no encontrado.</p>;

  // Sacamos las ciudades únicas de los vendedores para el filtro.
  const cities: string[] = [];
  for (const l of product.listings) {
    if (l.seller.city && !cities.includes(l.seller.city)) {
      cities.push(l.seller.city);
    }
  }
  cities.sort();

  // Aplicamos filtro de ciudad y orden de precio.
  let visibleListings = product.listings;
  if (cityFilter !== 'all') {
    visibleListings = visibleListings.filter((l) => l.seller.city === cityFilter);
  }
  visibleListings = [...visibleListings].sort((a, b) => {
    if (order === 'asc') return a.pricePerKg - b.pricePerKg;
    return b.pricePerKg - a.pricePerKg;
  });

  // Maneja el click de "Añadir" en una oferta concreta.
  function handleAdd(listingId: string) {
    if (!user) {
      toast.error('Inicia sesión para comprar');
      return;
    }
    if (user.role !== 'buyer') {
      toast.error('Solo compradores pueden añadir al carrito');
      return;
    }
    const kg = kgByListing[listingId] ?? 1;
    addMutation.mutate({ listingId, kg });
  }

  function changeKg(listingId: string, value: number) {
    setKgByListing((prev) => ({ ...prev, [listingId]: value }));
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      <div className="relative aspect-square w-full max-w-md md:max-w-none bg-muted rounded-lg overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <div className="text-xs uppercase text-muted-foreground">{product.category.name}</div>
        <h1 className="text-2xl md:text-3xl font-semibold">{product.name}</h1>
        <p className="text-muted-foreground mt-2">{product.description}</p>

        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight">Vendedores</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={order} onValueChange={(v) => setOrder(v as 'asc' | 'desc')}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Precio ↑</SelectItem>
                  <SelectItem value="desc">Precio ↓</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {visibleListings.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin vendedores aún.</p>
          ) : (
            <>
              {/* Versión móvil: tarjetas */}
              <div className="md:hidden space-y-3">
                {visibleListings.map((l) => (
                  <div key={l.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">{l.seller.name}</div>
                        <div className="text-xs text-muted-foreground">{l.seller.city ?? '—'}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-semibold tabular-nums">{l.pricePerKg.toFixed(2)} €</div>
                        <div className="text-xs text-muted-foreground">/kg</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        defaultValue={1}
                        className="w-20"
                        onChange={(e) => changeKg(l.id, Number(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">kg</span>
                      <Button size="sm" onClick={() => handleAdd(l.id)} className="ml-auto">
                        Añadir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Versión escritorio: tabla */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>€/kg</TableHead>
                      <TableHead>Kg</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleListings.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.seller.name}</TableCell>
                        <TableCell>{l.seller.city ?? '—'}</TableCell>
                        <TableCell>{l.pricePerKg.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            defaultValue={1}
                            className="w-20"
                            onChange={(e) => changeKg(l.id, Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleAdd(l.id)}>Añadir</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
