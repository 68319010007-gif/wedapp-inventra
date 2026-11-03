import { Link } from 'react-router-dom';
import { Package, UserRound, MapPin, ChevronRight } from 'lucide-react';
import { useStoreAuth } from '../../store/StoreAuthContext';
import { useLanguage } from '../../i18n';
import Avatar from '../../components/Avatar';

export default function AccountOverviewPage() {
  const { customer } = useStoreAuth();
  const { t } = useLanguage();

  const cards = [
    {
      to: '/account/profile',
      icon: UserRound,
      title: t('account.editProfile'),
      desc: t('account.editProfileDesc'),
    },
    {
      to: '/account/addresses',
      icon: MapPin,
      title: t('account.manageAddresses'),
      desc: t('account.manageAddressesDesc'),
    },
    {
      to: '/account/orders',
      icon: Package,
      title: t('store.myOrders'),
      desc: t('account.ordersDesc'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Avatar src={customer?.avatar} name={customer?.name} size="lg" />
        <div>
          <p className="text-lg font-semibold text-slate-900">{customer?.name}</p>
          <p className="text-sm text-muted">{customer?.email}</p>
          <p className="mt-1 text-xs text-muted">{t('account.memberCode')}: {customer?.code}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon size={20} />
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </div>
              <ChevronRight size={18} className="mt-1 shrink-0 text-slate-300 transition group-hover:text-primary" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
