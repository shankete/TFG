import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cartApi } from '@/api/cart';
import { ordersApi } from '@/api/orders';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const schema = z.object({ shippingAddress: z.string().min(5, 'Dirección requerida') });

export default function Checkout() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: items } = useQuery({ queryKey: ['cart'], queryFn: cartApi.list });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { shippingAddress: '' } });

  const total = items?.reduce((s, i) => s + i.kg * i.listing.pricePerKg, 0) ?? 0;

  const checkout = useMutation({
    mutationFn: ordersApi.checkout,
    onSuccess: ({ id }) => { qc.invalidateQueries({ queryKey: ['cart'] }); qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Pedido realizado'); nav(`/me/orders/${id}`); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Error'),
  });

  if (!items?.length) { nav('/cart'); return null; }

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.listing.product.name} × {i.kg.toFixed(2)} kg</span>
                <span>{(i.kg * i.listing.pricePerKg).toFixed(2)} €</span>
              </li>
            ))}
          </ul>
          <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
            <span>Total</span><span>{total.toFixed(2)} €</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Datos del envío</CardTitle></CardHeader>
        <CardContent>
          <Alert className="mb-4"><AlertDescription>Pago contra reembolso al recibir.</AlertDescription></Alert>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => checkout.mutate(v))} className="space-y-3">
              <FormField control={form.control} name="shippingAddress" render={({ field }) => (
                <FormItem><FormLabel>Dirección</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={checkout.isPending}>Confirmar pedido</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
