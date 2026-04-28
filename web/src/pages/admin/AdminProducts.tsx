import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi, type AdminProduct } from '@/api/admin';
import { productsApi } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case'),
  description: z.string().default(''),
  imageUrl: z.string().url(),
  categoryId: z.string().uuid(),
});
type FormValues = z.infer<typeof schema>;

export default function AdminProducts() {
  const qc = useQueryClient();
  const { data: products } = useQuery({ queryKey: ['admin', 'products'], queryFn: adminApi.products.list });
  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: productsApi.categories });
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', slug: '', description: '', imageUrl: '', categoryId: '' } });

  const openCreate = () => { setEditing(null); form.reset({ name: '', slug: '', description: '', imageUrl: '', categoryId: '' }); setOpen(true); };
  const openEdit = (p: AdminProduct) => { setEditing(p); form.reset({ name: p.name, slug: p.slug, description: p.description, imageUrl: p.imageUrl, categoryId: p.categoryId }); setOpen(true); };

  const save = useMutation({
    mutationFn: (v: FormValues) => editing ? adminApi.products.update(editing.id, v) : adminApi.products.create(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'products'] }); qc.invalidateQueries({ queryKey: ['products'] }); setOpen(false); toast.success('Guardado'); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.products.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'products'] }); qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Borrado'); },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Productos</h1>
        <Button onClick={openCreate}>Nuevo producto</Button>
      </div>
      {!products?.length ? (
        <p className="text-muted-foreground">Sin productos. Crea el primero con "Nuevo producto".</p>
      ) : (
      <div className="overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="w-32">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.category.name}</TableCell>
              <TableCell className="font-mono text-xs">{p.slug}</TableCell>
              <TableCell className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm('¿Borrar?')) remove.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nuevo'} producto</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-3">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem><FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger></FormControl>
                    <SelectContent>{cats?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)} />
              <DialogFooter><Button type="submit" disabled={save.isPending}>Guardar</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
