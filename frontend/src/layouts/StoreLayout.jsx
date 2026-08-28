import { Link, NavLink, Outlet } from 'react-router-dom';
import { ShoppingCart, Search, LayoutDashboard } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { useStoreAuth } from '../store/StoreAuthContext';
import { useLanguage } from '../i18n';
import LanguageSwitcher, { LanguageSwitcherLight } from '../components/LanguageSwitcher';
import CategoryMegaMenu from '../components/store/CategoryMegaMenu';
import Avatar from '../components/Avatar';

export default function StoreLayout() {
  const { totalItems } = useCart();
  const { isAuthenticated, customer, logout } = useStoreAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy">
              <span className="text-lg font-bold text-primary">I</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-navy">
                Inven<span className="text-primary">tra</span>
              </p>
              <p className="hidden text-[10px] uppercase tracking-wider text-muted sm:block">{t('store.buildingStore')}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <CategoryMegaMenu />
            <NavLink to="/" end className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}>
              {t('store.home')}
            </NavLink>
            <NavLink to="/shop" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}>
              {t('store.shop')}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcherLight className="hidden sm:flex" />
            <Link to="/shop" className="hidden rounded-xl border border-slate-200 p-2.5 text-muted hover:text-primary sm:block">
              <Search size={18} />
            </Link>
            <Link to="/cart" className="relative rounded-xl bg-primary p-2.5 text-white hover:bg-primary-dark">
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan text-[10px] font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/account/orders" className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-muted hover:border-primary hover:text-primary sm:block">
                  {t('store.myOrders')}
                </Link>
                <Link to="/account" className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 hover:border-primary">
                  <Avatar src={customer?.avatar} name={customer?.name} size="sm" />
                  <span className="hidden text-xs font-medium text-slate-700 sm:inline">{customer?.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={logout} className="hidden text-xs text-muted hover:text-red-500 sm:block">{t('nav.logout')}</button>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <LanguageSwitcher className="sm:hidden" />
                <Link to="/login" className="text-sm font-medium text-primary hover:underline">{t('store.login')}</Link>
              </div>
            )}

            <Link to="/admin" className="hidden items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-muted hover:text-primary lg:flex">
              <LayoutDashboard size={14} />
              {t('store.admin')}
            </Link>
          </div>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="mt-16 border-t border-slate-200 bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-xl font-semibold">INVENTRA</p>
              <p className="mt-2 text-sm text-white/60">Smart Inventory & Sales Management System</p>
            </div>
            <div>
              <p className="font-medium">{t('store.categories')}</p>
              <ul className="mt-2 space-y-1 text-sm text-white/60">
                <li>Cement & Concrete</li>
                <li>Steel & Rebar</li>
                <li>Tiles & Flooring</li>
                <li>Sanitary Ware</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">{t('store.contact')}</p>
              <p className="mt-2 text-sm text-white/60">support@inventra.com</p>
              <p className="text-sm text-white/60">02-123-4567</p>
            </div>
          </div>
          <p className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © 2026 INVENTRA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
