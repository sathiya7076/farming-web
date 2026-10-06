import { Navigate, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Products from './pages/Products.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Farmers from './pages/Farmers.jsx';
import FarmerDetails from './pages/FarmerDetails.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import NotFound from './pages/NotFound.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

import FarmerDashboard from './pages/farmer/FarmerDashboard.jsx';
import ProductForm from './pages/farmer/ProductForm.jsx';
import MyProducts from './pages/farmer/MyProducts.jsx';
import FarmerOrders from './pages/farmer/FarmerOrders.jsx';
import Sales from './pages/farmer/Sales.jsx';
import Earnings from './pages/farmer/Earnings.jsx';
import FarmerReviews from './pages/farmer/FarmerReviews.jsx';

import ClientDashboard from './pages/client/ClientDashboard.jsx';
import Cart from './pages/client/Cart.jsx';
import MyOrders from './pages/client/MyOrders.jsx';
import OrderTracking from './pages/client/OrderTracking.jsx';
import Wishlist from './pages/client/Wishlist.jsx';
import MyReviews from './pages/client/MyReviews.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminFarmers from './pages/admin/AdminFarmers.jsx';
import AdminClients from './pages/admin/AdminClients.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminPayments from './pages/admin/AdminPayments.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import AdminComplaints from './pages/admin/AdminComplaints.jsx';
import AdminNotifications from './pages/admin/AdminNotifications.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="farmers" element={<Farmers />} />
          <Route path="farmers/:id" element={<FarmerDetails />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Farmer-only */}
        <Route element={<ProtectedRoute roles={['farmer']} />}>
          <Route path="/farmer" element={<DashboardLayout role="farmer" />}>
            <Route index element={<FarmerDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="products" element={<MyProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="orders" element={<FarmerOrders />} />
            <Route path="sales" element={<Sales />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="reviews" element={<FarmerReviews />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Client-only */}
        <Route element={<ProtectedRoute roles={['client']} />}>
          <Route path="/client" element={<DashboardLayout role="client" />}>
            <Route index element={<ClientDashboard />} />
            <Route path="browse" element={<Products embedded />} />
            <Route path="cart" element={<Cart />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="tracking" element={<OrderTracking />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="reviews" element={<MyReviews />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Admin-only */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<DashboardLayout role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="farmers" element={<AdminFarmers />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/dashboard" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
