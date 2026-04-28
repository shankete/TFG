import { NavLink, Outlet } from 'react-router-dom';
import { ResponsiveSidebar } from '@/components/ResponsiveSidebar';

const link = (active: boolean) => `block px-3 py-2 rounded-md text-sm ${active ? 'bg-accent' : 'hover:bg-accent'}`;

export default function AdminLayout() {
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[180px_1fr] md:gap-6">
      <ResponsiveSidebar mobileLabel="Menú admin">
        {(close) => (
          <>
            <NavLink to="/admin/users" onClick={close} className={({ isActive }) => link(isActive)}>Usuarios</NavLink>
            <NavLink to="/admin/products" onClick={close} className={({ isActive }) => link(isActive)}>Productos</NavLink>
            <NavLink to="/admin/listings" onClick={close} className={({ isActive }) => link(isActive)}>Listings</NavLink>
          </>
        )}
      </ResponsiveSidebar>
      <section><Outlet /></section>
    </div>
  );
}
