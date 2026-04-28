import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { aggregateStatus, ordersApi } from '@/api/orders';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const statusLabels: Record<string, string> = {
  pending: 'Pendiente', shipped: 'Enviado', delivered: 'Entregado', partial: 'En curso',
};

export default function MyOrders() {
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list });
  if (isLoading) return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );
  if (!data?.length) return <p className="text-muted-foreground">Aún no tienes pedidos.</p>;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">Mis pedidos</h1>
      {data.map((o) => {
        const s = aggregateStatus(o.items);
        return (
          <Link key={o.id} to={`/me/orders/${o.id}`}>
            <Card className="hover:bg-accent">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">Pedido del {new Date(o.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm text-muted-foreground">{o.items.length} línea(s) · {o.total.toFixed(2)} €</div>
                </div>
                <Badge variant={s === 'delivered' ? 'default' : 'secondary'}>{statusLabels[s]}</Badge>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
