import { NavLink, Outlet } from 'react-router-dom';
import { ResponsiveSidebar } from '@/components/ResponsiveSidebar';

const link = (active: boolean) => `block px-3 py-2 rounded-md text-sm ${active ? 'bg-accent' : 'hover:bg-accent'}`;

export default function SellerLayout() {
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[180px_1fr] md:gap-6">
      <ResponsiveSidebar mobileLabel="Menú vendedor">
        {(close) => (
          <>
            <NavLink to="/seller" end onClick={close} className={({ isActive }) => link(isActive)}>Mis ofertas</NavLink>
            <NavLink to="/seller/sales" onClick={close} className={({ isActive }) => link(isActive)}>Ventas</NavLink>
          </>
        )}
      </ResponsiveSidebar>
      <section><Outlet /></section>
    </div>
  );
}
