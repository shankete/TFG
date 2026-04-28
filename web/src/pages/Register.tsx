import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  name: z.string().min(1),
  role: z.enum(['buyer', 'seller']),
  city: z.string().optional(),
}).refine((d) => d.role !== 'seller' || !!d.city, { path: ['city'], message: 'Ciudad requerida para vendedores' });

export default function Register() {
  const nav = useNavigate();
  const { setSession } = useAuthStore();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '', name: '', role: 'buyer', city: '' } });
  const role = form.watch('role');

  const onSubmit = async (v: z.infer<typeof schema>) => {
    try {
      const { data } = await api.post('/auth/register', v);
      setSession(data);
      toast.success('Cuenta creada');
      nav('/');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Error');
    }
  };

  return (
    <Card className="max-w-sm mx-auto mt-8">
      <CardHeader><CardTitle>Crear cuenta</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>Rol</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="buyer">Comprador</SelectItem>
                    <SelectItem value="seller">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {role === 'seller' && (
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            )}
            <Button type="submit" className="w-full">Crear cuenta</Button>
            <p className="text-sm text-muted-foreground text-center">¿Ya tienes cuenta? <Link to="/login" className="underline">Entra</Link></p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
