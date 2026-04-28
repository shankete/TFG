import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminListings() {
  const { data } = useQuery({ queryKey: ['admin', 'listings'], queryFn: adminApi.listings.list });
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Listings</h1>
      {!data?.length ? <p className="text-muted-foreground">Sin listings.</p> : (
      <div className="overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader><TableRow>
          <TableHead>Producto</TableHead><TableHead>Vendedor</TableHead><TableHead>Ciudad</TableHead><TableHead>€/kg</TableHead><TableHead>Activa</TableHead><TableHead>Creada</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {data.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.product.name}</TableCell>
              <TableCell>{l.seller.name} <span className="text-xs text-muted-foreground">({l.seller.email})</span></TableCell>
              <TableCell>{l.seller.city ?? '—'}</TableCell>
              <TableCell>{l.pricePerKg.toFixed(2)}</TableCell>
              <TableCell>{l.active ? <Badge>Sí</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
              <TableCell>{new Date(l.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      )}
    </div>
  );
}
