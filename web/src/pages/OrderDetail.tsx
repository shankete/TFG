import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const statusLabel: Record<string, string> = { pending: 'Pendiente', shipped: 'Enviado', delivered: 'Entregado' };

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: o, isLoading } = useQuery({ queryKey: ['orders', id], queryFn: () => ordersApi.get(id!), enabled: !!id });
  const confirm = useMutation({
    mutationFn: (itemId: string) => ordersApi.confirm(id!, itemId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders', id] }); qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Confirmada entrega'); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Error'),
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
  if (!o) return <p>Pedido no encontrado.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">Pedido del {new Date(o.createdAt).toLocaleDateString()}</h1>
      <Card><CardHeader><CardTitle>Envío</CardTitle></CardHeader><CardContent className="text-sm whitespace-pre-line">{o.shippingAddress}</CardContent></Card>
      <Card>
        <CardHeader><CardTitle>Líneas</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {o.items.map((i) => (
            <div key={i.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{i.productName}</div>
                <div className="text-sm text-muted-foreground">{i.kg.toFixed(2)} kg × {i.pricePerKg.toFixed(2)} €/kg = {(i.kg * i.pricePerKg).toFixed(2)} €</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={i.status === 'delivered' ? 'default' : 'secondary'}>{statusLabel[i.status]}</Badge>
                {i.status === 'shipped' && <Button size="sm" onClick={() => confirm.mutate(i.id)}>Confirmar entrega</Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="text-right text-lg font-semibold">Total: {o.total.toFixed(2)} €</div>
    </div>
  );
}
