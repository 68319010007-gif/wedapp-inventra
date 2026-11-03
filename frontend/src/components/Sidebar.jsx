import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, Warehouse, ShoppingCart, Users, Truck,
  ClipboardList, BarChart3, Settings, LogOut, Store, UserCog, User, Receipt, Landmark,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useLanguage } from '../i18n';
import { LanguageSwitcherLight } from './LanguageSwitcher';
import Avatar from './Avatar';
import BrandLogo from './BrandLogo';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: t('nav.dashboard'), end: true },
    { to: '/admin/products', icon: Package, label: t('nav.products') },
    { to: '/admin/categories', icon: Tags, label: t('nav.categories') },
    { to: '/admin/inventory', icon: Warehouse, label: t('nav.inventory') },
    { to: '/admin/sales', icon: ShoppingCart, label: t('nav.sales') },
    { to: '/admin/payments', icon: Receipt, label: t('nav.payments') },
    { to: '/admin/payment-channels', icon: Landmark, label: t('nav.paymentChannels') },
    { to: '/admin/customers', icon: Users, label: t('nav.customers') },
    { to: '/admin/suppliers', icon: Truck, label: t('nav.suppliers') },
    { to: '/admin/purchases', icon: ClipboardList, label: t('nav.purchases') },
    { to: '/admin/users', icon: UserCog, label: t('nav.users') },
    { to: '/admin/reports', icon: BarChart3, label: t('nav.reports') },
    { to: '/admin/settings', icon: Settings, label: t('nav.settings') },
    { to: '/admin/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col bg-navy text-white lg:flex">
      <div className="border-b border-white/10 px-6 py-5">
        <BrandLogo
          variant="admin"
          layout="stack"
          showText={false}
          imageClassName="h-10 w-auto"
          subtitle={t('nav.adminPanel')}
          subtitleClassName="text-[10px] uppercase tracking-wider text-white/50"
        />
        <div className="mt-3"><LanguageSwitcherLight /></div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
        <a href="/" target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cyan hover:bg-white/5">
          <Store size={18} />{t('nav.viewStore')}
        </a>
      </nav>

      <div className="border-t border-white/10 p-4">
        <NavLink to="/admin/profile" className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10">
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-white/50">{user?.role}</p>
          </div>
        </NavLink>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
          <LogOut size={16} />{t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { t } = useLanguage();
  const links = [
    { to: '/admin', label: t('nav.dashboard'), end: true },
    { to: '/admin/products', label: t('nav.products') },
    { to: '/admin/sales', label: t('nav.sales') },
    { to: '/admin/profile', label: t('nav.profile') },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white lg:hidden">
      {links.map(({ to, label, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) =>
          `flex flex-1 flex-col items-center py-2 text-xs ${isActive ? 'font-medium text-primary' : 'text-muted'}`}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
