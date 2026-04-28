import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import MyOrders from '@/pages/MyOrders';
import OrderDetail from '@/pages/OrderDetail';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminListings from '@/pages/admin/AdminListings';
import SellerLayout from '@/pages/seller/SellerLayout';
import SellerListings from '@/pages/seller/SellerListings';
import SellerSales from '@/pages/seller/SellerSales';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<RequireAuth roles={['buyer']}><Cart /></RequireAuth>} />
            <Route path="/checkout" element={<RequireAuth roles={['buyer']}><Checkout /></RequireAuth>} />
            <Route path="/me/orders" element={<RequireAuth roles={['buyer']}><MyOrders /></RequireAuth>} />
            <Route path="/me/orders/:id" element={<RequireAuth roles={['buyer']}><OrderDetail /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth roles={['admin']}><AdminLayout /></RequireAuth>}>
              <Route index element={<Navigate to="/admin/products" replace />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="listings" element={<AdminListings />} />
            </Route>
            <Route path="/seller" element={<RequireAuth roles={['seller']}><SellerLayout /></RequireAuth>}>
              <Route index element={<SellerListings />} />
              <Route path="sales" element={<SellerSales />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
