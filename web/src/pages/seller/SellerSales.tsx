import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api/sales';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const label: Record<string, string> = { pending: 'Pendiente', shipped: 'Enviado', delivered: 'Entregado' };

export default function SellerSales() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['seller', 'sales'], queryFn: salesApi.list });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'shipped' | 'delivered' }) => salesApi.setStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller', 'sales'] }); toast.success('Actualizado'); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Error'),
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data?.length) return <p className="text-muted-foreground">Aún no tienes ventas.</p>;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Ventas</h1>
      <div className="overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader><TableRow>
          <TableHead>Fecha</TableHead><TableHead>Comprador</TableHead><TableHead>Producto</TableHead><TableHead>Kg</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {data.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{new Date(s.order.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>{s.buyer.name}{s.buyer.city ? ` · ${s.buyer.city}` : ''}</TableCell>
              <TableCell>{s.productName}</TableCell>
              <TableCell>{s.kg.toFixed(2)}</TableCell>
              <TableCell>{(s.kg * s.pricePerKg).toFixed(2)} €</TableCell>
              <TableCell><Badge variant={s.status === 'delivered' ? 'default' : 'secondary'}>{label[s.status]}</Badge></TableCell>
              <TableCell>
                {s.status === 'pending' && <Button size="sm" onClick={() => setStatus.mutate({ id: s.id, status: 'shipped' })}>Marcar enviado</Button>}
                {s.status === 'shipped' && <Button size="sm" variant="secondary" onClick={() => setStatus.mutate({ id: s.id, status: 'delivered' })}>Marcar entregado</Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
