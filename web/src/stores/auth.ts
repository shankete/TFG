import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipo del usuario logueado en la app.
export type User = {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'admin';
  city?: string | null;
};

type AuthState = {
  user: User | null;
  token: string | null;
  setSession: (data: { user: User; token: string }) => void;
  logout: () => void;
};

// Store de zustand que guarda el usuario y el token en localStorage
// para no perder la sesión al recargar la página.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: ({ user, token }) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'tfg-auth' },
  ),
);
