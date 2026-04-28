import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { listingsApi } from '@/api/listings';
import { productsApi } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

const schema = z.object({ productId: z.string().uuid(), pricePerKg: z.coerce.number().positive() });
type FormValues = z.infer<typeof schema>;

export default function SellerListings() {
  const qc = useQueryClient();
  const { data: listings } = useQuery({ queryKey: ['seller', 'listings'], queryFn: listingsApi.mine });
  const { data: products } = useQuery({ queryKey: ['products', { all: true }], queryFn: () => productsApi.list({}) });
  const [open, setOpen] = useState(false);

  const ownedIds = new Set(listings?.map((l) => l.productId) ?? []);
  const available = products?.filter((p) => !ownedIds.has(p.id)) ?? [];

  const form = useForm<z.input<typeof schema>, any, FormValues>({ resolver: zodResolver(schema), defaultValues: { productId: '', pricePerKg: 1 } });

  const create = useMutation({
    mutationFn: (v: FormValues) => listingsApi.create(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller', 'listings'] }); qc.invalidateQueries({ queryKey: ['products'] }); setOpen(false); form.reset(); toast.success('Oferta creada'); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Error'),
  });
  const update = useMutation({
    mutationFn: ({ id, b }: { id: string; b: { pricePerKg?: number; active?: boolean } }) => listingsApi.update(id, b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller', 'listings'] }); qc.invalidateQueries({ queryKey: ['products'] }); },
  });
  const remove = useMutation({
    mutationFn: listingsApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller', 'listings'] }); qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Eliminado'); },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Mis ofertas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={!available.length}>Nueva oferta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva oferta</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-3">
                <FormField control={form.control} name="productId" render={({ field }) => (
                  <FormItem><FormLabel>Producto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger></FormControl>
                      <SelectContent>{available.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pricePerKg" render={({ field }) => (
                  <FormItem><FormLabel>€/kg</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={create.isPending}>Crear</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!listings?.length ? (
        <p className="text-muted-foreground">Aún no has publicado ofertas. Crea la primera con "Nueva oferta".</p>
      ) : (
      <div className="overflow-x-auto">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>€/kg</TableHead>
            <TableHead>Activa</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.product.name}</TableCell>
              <TableCell>
                <Input type="number" step="0.01" defaultValue={l.pricePerKg} className="w-24"
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0 && v !== l.pricePerKg) update.mutate({ id: l.id, b: { pricePerKg: v } });
                  }} />
              </TableCell>
              <TableCell>
                <Switch checked={l.active} onCheckedChange={(active) => update.mutate({ id: l.id, b: { active } })} />
                {!l.active && <Badge variant="secondary" className="ml-2">Pausada</Badge>}
              </TableCell>
              <TableCell><Button size="icon" variant="ghost" onClick={() => { if (confirm('¿Eliminar?')) remove.mutate(l.id); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      )}
    </div>
  );
}
