import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';

// Cliente axios que usamos en toda la app para llamar a la API.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Antes de cada request añadimos el token de la sesión si lo hay.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si la API responde 401 (no autenticado) cerramos sesión.
// Si responde 5xx mostramos un toast genérico.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      useAuthStore.getState().logout();
    }
    if (status >= 500) {
      toast.error('Error de servidor, prueba de nuevo');
    }
    return Promise.reject(error);
  },
);
