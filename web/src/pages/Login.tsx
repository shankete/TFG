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
import { toast } from 'sonner';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export default function Login() {
  const nav = useNavigate();
  const { setSession } = useAuthStore();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    try {
      const { data } = await api.post('/auth/login', v);
      setSession(data);
      toast.success(`Hola, ${data.user.name}`);
      nav('/');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Error');
    }
  };

  return (
    <Card className="max-w-sm mx-auto mt-8">
      <CardHeader><CardTitle>Iniciar sesión</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" className="w-full">Entrar</Button>
            <p className="text-sm text-muted-foreground text-center">¿No tienes cuenta? <Link to="/register" className="underline">Regístrate</Link></p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
