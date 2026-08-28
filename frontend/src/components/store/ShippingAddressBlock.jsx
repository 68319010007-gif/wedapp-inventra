import { MapPin } from 'lucide-react';
import { parseOrderNote, getShippingDetailRows } from '../../utils/orderNote';
import { useLanguage } from '../../i18n';

export default function ShippingAddressBlock({ note, compact = false }) {
  const { t } = useLanguage();
  const { shipping } = parseOrderNote(note);
  const rows = getShippingDetailRows(shipping, t);

  if (!rows.length) return null;

  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 ${compact ? 'p-3' : 'p-4'}`}>
      <h4 className={`mb-2 flex items-center gap-2 font-semibold text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>
        <MapPin size={compact ? 14 : 16} /> {t('store.shippingInfo')}
      </h4>
      <dl className={`grid gap-x-4 gap-y-2 text-slate-800 ${compact ? 'text-xs sm:grid-cols-2' : 'text-sm sm:grid-cols-2 lg:grid-cols-3'}`}>
        {rows.map(([label, value]) => (
          <div key={label} className={label === t('auth.address') || label === t('account.pinLocation') ? 'sm:col-span-2 lg:col-span-3' : ''}>
            <dt className="text-muted">{label}</dt>
            <dd className="mt-0.5 font-medium whitespace-pre-wrap">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
