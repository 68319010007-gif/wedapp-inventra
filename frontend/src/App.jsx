import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n';
import { AuthProvider } from './store/AuthContext';
import { StoreAuthProvider } from './store/StoreAuthContext';
import { CartProvider } from './store/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import StoreProtectedRoute from './components/StoreProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import StoreLayout from './layouts/StoreLayout';
import AccountLayout from './layouts/AccountLayout';
import LoginPage from './pages/LoginPage';
import AdminProfilePage from './pages/AdminProfilePage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchasesPage from './pages/PurchasesPage';
import PaymentsPage from './pages/PaymentsPage';
import PaymentChannelsPage from './pages/PaymentChannelsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import HomePage from './pages/store/HomePage';
import ShopPage from './pages/store/ShopPage';
import ProductDetailPage from './pages/store/ProductDetailPage';
import CartPage from './pages/store/CartPage';
import CheckoutPage from './pages/store/CheckoutPage';
import StoreLoginPage from './pages/store/StoreLoginPage';
import StoreRegisterPage from './pages/store/StoreRegisterPage';
import StoreProfilePage from './pages/store/StoreProfilePage';
import AccountOverviewPage from './pages/store/AccountOverviewPage';
import AddressesPage from './pages/store/AddressesPage';
import OrdersPage from './pages/store/OrdersPage';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StoreAuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<StoreLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="shop/:id" element={<ProductDetailPage />} />
                  <Route path="login" element={<StoreLoginPage />} />
                  <Route path="register" element={<StoreRegisterPage />} />
                  <Route path="cart" element={
                    <StoreProtectedRoute><CartPage /></StoreProtectedRoute>
                  } />
                  <Route path="checkout" element={
                    <StoreProtectedRoute><CheckoutPage /></StoreProtectedRoute>
                  } />

                  <Route path="account" element={
                    <StoreProtectedRoute><AccountLayout /></StoreProtectedRoute>
                  }>
                    <Route index element={<AccountOverviewPage />} />
                    <Route path="profile" element={<StoreProfilePage />} />
                    <Route path="addresses" element={<AddressesPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                  </Route>

                  <Route path="profile" element={<Navigate to="/account/profile" replace />} />
                  <Route path="orders" element={<Navigate to="/account/orders" replace />} />
                </Route>

                <Route path="/admin/login" element={<LoginPage />} />
                <Route path="/admin" element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="sales" element={<SalesPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="suppliers" element={<SuppliersPage />} />
                    <Route path="purchases" element={<PurchasesPage />} />
                    <Route path="payments" element={<PaymentsPage />} />
                    <Route path="payment-channels" element={<PaymentChannelsPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="profile" element={<AdminProfilePage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </StoreAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
