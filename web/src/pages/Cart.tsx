import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { cartApi, type CartItem } from '@/api/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

// Página del carrito. Agrupa los items por vendedor y permite cambiar
// la cantidad de kg o eliminar items.
export default function Cart() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.list,
  });

  // Mutación para cambiar los kg de un item del carrito.
  const updateMutation = useMutation({
    mutationFn: (params: { id: string; kg: number }) => cartApi.update(params.id, { kg: params.kg }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  // Mutación para eliminar un item.
  const removeMutation = useMutation({
    mutationFn: cartApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Eliminado');
    },
  });

  // Skeleton mientras se carga.
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Carrito vacío.
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
        <Button asChild><Link to="/">Ver catálogo</Link></Button>
      </div>
    );
  }

  // Agrupamos los items por vendedor para mostrarlos por bloques.
  type Group = {
    sellerName: string;
    sellerCity: string | null;
    items: CartItem[];
  };
  const groups: Record<string, Group> = {};
  for (const it of items) {
    const sellerId = it.listing.seller.id;
    if (!groups[sellerId]) {
      groups[sellerId] = {
        sellerName: it.listing.seller.name,
        sellerCity: it.listing.seller.city,
        items: [],
      };
    }
    groups[sellerId].items.push(it);
  }

  // Calculamos el total del carrito.
  let total = 0;
  for (const it of items) {
    total += it.kg * it.listing.pricePerKg;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Carrito</h1>

      {Object.entries(groups).map(([sellerId, group]) => (
        <Card key={sellerId}>
          <CardContent className="p-4">
            <div className="font-semibold mb-3">
              {group.sellerName}
              {group.sellerCity && (
                <span className="text-muted-foreground font-normal"> · {group.sellerCity}</span>
              )}
            </div>
            <div className="divide-y">
              {group.items.map((item) => (
                <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 py-3">
                  <img
                    src={item.listing.product.imageUrl}
                    alt={item.listing.product.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.listing.product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.listing.pricePerKg.toFixed(2)} €/kg
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      defaultValue={item.kg}
                      className="w-20"
                      onBlur={(e) => {
                        const nuevoKg = Number(e.target.value);
                        if (nuevoKg > 0 && nuevoKg !== item.kg) {
                          updateMutation.mutate({ id: item.id, kg: nuevoKg });
                        }
                      }}
                    />
                    <div className="w-20 text-right font-medium tabular-nums">
                      {(item.kg * item.listing.pricePerKg).toFixed(2)} €
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeMutation.mutate(item.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
        <div className="text-lg">
          Total: <strong>{total.toFixed(2)} €</strong>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/checkout">Tramitar pedido</Link>
        </Button>
      </div>
    </div>
  );
}
