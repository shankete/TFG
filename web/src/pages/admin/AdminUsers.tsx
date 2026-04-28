import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminUsers() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.users.list });
  const ban = useMutation({ mutationFn: adminApi.users.ban, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Baneado'); }, onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Error') });
  const unban = useMutation({ mutationFn: adminApi.users.unban, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Reactivado'); } });

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Usuarios</h1>
      {!data?.length ? <p className="text-muted-foreground">Sin usuarios.</p> : (
      <div className="overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader><TableRow>
          <TableHead>Email</TableHead><TableHead>Nombre</TableHead><TableHead>Rol</TableHead><TableHead>Ciudad</TableHead><TableHead>Estado</TableHead><TableHead></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {data.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.name}</TableCell>
              <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
              <TableCell>{u.city ?? '—'}</TableCell>
              <TableCell>{u.banned ? <Badge variant="destructive">Baneado</Badge> : <Badge>Activo</Badge>}</TableCell>
              <TableCell>
                {u.role !== 'admin' && (u.banned
                  ? <Button size="sm" variant="secondary" onClick={() => unban.mutate(u.id)}>Reactivar</Button>
                  : <Button size="sm" variant="destructive" onClick={() => { if (confirm(`¿Banear ${u.email}?`)) ban.mutate(u.id); }}>Banear</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      )}
    </div>
  );
}
