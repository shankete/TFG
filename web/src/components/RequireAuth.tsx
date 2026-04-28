import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

type Role = 'buyer' | 'seller' | 'admin';

type Props = {
  roles?: Role[];
  children: ReactNode;
};

// Componente para proteger rutas privadas.
// - Si no hay usuario, le mandamos a /login.
// - Si su rol no está en la lista permitida, le mandamos a /.
export function RequireAuth({ roles, children }: Props) {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
