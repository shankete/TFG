import { QueryClient } from '@tanstack/react-query';

// Configuración global de TanStack Query.
// - retry: 1 -> si una query falla, solo la reintentamos una vez.
// - refetchOnWindowFocus: false -> no recargar al volver a la pestaña.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
