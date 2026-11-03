import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Package, UserRound, MapPin, LayoutGrid, LogOut } from 'lucide-react';
import { useStoreAuth } from '../store/StoreAuthContext';
import { useLanguage } from '../i18n';

export default function AccountLayout() {
  const { customer, logout } = useStoreAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm transition ${
      isActive
        ? 'bg-primary/10 font-medium text-primary'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        {t('account.yourAccount')} <span className="text-primary">{customer?.name}</span>
      </h1>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
            {t('account.myAccount')}
          </p>
          <nav className="space-y-1">
            <NavLink to="/account" end className={linkClass}>
              <span className="inline-flex items-center gap-2">
                <LayoutGrid size={16} /> {t('account.overview')}
              </span>
            </NavLink>
            <NavLink to="/account/orders" className={linkClass}>
              <span className="inline-flex items-center gap-2">
                <Package size={16} /> {t('store.myOrders')}
              </span>
            </NavLink>
          </nav>

          <p className="mb-2 mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
            {t('account.personalInfo')}
          </p>
          <nav className="space-y-1">
            <NavLink to="/account/profile" className={linkClass}>
              <span className="inline-flex items-center gap-2">
                <UserRound size={16} /> {t('account.editProfile')}
              </span>
            </NavLink>
            <NavLink to="/account/addresses" className={linkClass}>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} /> {t('account.manageAddresses')}
              </span>
            </NavLink>
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} /> {t('nav.logout')}
          </button>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
