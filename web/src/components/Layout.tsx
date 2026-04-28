import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { cartApi } from '@/api/cart';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Menu, ShoppingCart, ClipboardList, Store, ShieldCheck, Sprout } from 'lucide-react';

// Layout principal de la app: cabecera + contenido + toaster.
// Tiene una versión móvil (Sheet lateral) y otra desktop (nav arriba).
export function Layout() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();

  // Pedimos el carrito solo si hay un comprador logueado, así sabemos cuántos items mostrar.
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.list,
    enabled: user?.role === 'buyer',
  });

  // Estado del menú móvil (abierto/cerrado).
  const [openMenu, setOpenMenu] = useState(false);

  // Al montar el layout llamamos a /health para "despertar" el backend
  // (en Render el plan gratis duerme la API si no se usa un rato).
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`).catch(() => {
      // Si falla no pasa nada, es solo para despertar el servicio.
    });
  }, []);

  const cerrarMenu = () => setOpenMenu(false);

  // Estilos de los enlaces según donde se muestren.
  const headerLinkClass = 'inline-flex items-center gap-1.5 text-sm hover:text-primary transition-colors';
  const sheetLinkClass = 'flex items-center gap-2 text-base py-2 hover:text-primary transition-colors';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Sprout className="h-5 w-5 text-primary" />
            <span>LarryKfruta</span>
          </Link>

          {/* Navegación de escritorio */}
          <nav className="hidden md:flex items-center gap-4">
            {user?.role === 'buyer' && (
              <Link to="/cart" className={headerLinkClass}>
                <ShoppingCart className="h-4 w-4" />
                Carrito{cart?.length ? ` (${cart.length})` : ''}
              </Link>
            )}
            {user?.role === 'buyer' && (
              <Link to="/me/orders" className={headerLinkClass}>
                <ClipboardList className="h-4 w-4" />
                Mis pedidos
              </Link>
            )}
            {user?.role === 'seller' && (
              <Link to="/seller" className={headerLinkClass}>
                <Store className="h-4 w-4" />
                Mi panel
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className={headerLinkClass}>
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}

            {/* Si no hay usuario, mostramos botones de login y registro */}
            {!user && (
              <>
                <Button asChild size="sm" variant="ghost"><Link to="/login">Entrar</Link></Button>
                <Button asChild size="sm"><Link to="/register">Registro</Link></Button>
              </>
            )}

            {/* Si hay usuario, menú con email y botón de cerrar sesión */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      nav('/');
                    }}
                  >
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Navegación móvil (botón hamburguesa que abre un Sheet) */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <Sheet open={openMenu} onOpenChange={setOpenMenu}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menú">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="text-lg">Menú</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-4 flex flex-col gap-1">
                  {user?.role === 'buyer' && (
                    <Link to="/cart" onClick={cerrarMenu} className={sheetLinkClass}>
                      <ShoppingCart className="h-4 w-4" />
                      Carrito{cart?.length ? ` (${cart.length})` : ''}
                    </Link>
                  )}
                  {user?.role === 'buyer' && (
                    <Link to="/me/orders" onClick={cerrarMenu} className={sheetLinkClass}>
                      <ClipboardList className="h-4 w-4" />
                      Mis pedidos
                    </Link>
                  )}
                  {user?.role === 'seller' && (
                    <Link to="/seller" onClick={cerrarMenu} className={sheetLinkClass}>
                      <Store className="h-4 w-4" />
                      Mi panel
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link to="/admin" onClick={cerrarMenu} className={sheetLinkClass}>
                      <ShieldCheck className="h-4 w-4" />
                      Admin
                    </Link>
                  )}

                  <Separator className="my-3" />

                  {!user && (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline">
                        <Link to="/login" onClick={cerrarMenu}>Entrar</Link>
                      </Button>
                      <Button asChild>
                        <Link to="/register" onClick={cerrarMenu}>Crear cuenta</Link>
                      </Button>
                    </div>
                  )}

                  {user && (
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-muted-foreground break-all">{user.email}</div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          cerrarMenu();
                          logout();
                          nav('/');
                        }}
                      >
                        Cerrar sesión
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 md:py-6">
        <Outlet />
      </main>

      <Toaster richColors />
    </div>
  );
}
