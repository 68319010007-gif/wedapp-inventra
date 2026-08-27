import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../../store/CartContext';
import { useStoreAuth } from '../../store/StoreAuthContext';
import storeApi from '../../services/storeApi';
import { formatCurrency } from '../../utils/format';
import { Button, Input, Textarea, Alert } from '../../components/crud';
import { useLanguage } from '../../i18n';

function formatShippingAddress(a) {
  if (!a) return '';
  return [
    a.houseNo,
    a.moo ? `ม.${a.moo}` : null,
    a.village,
    a.floor ? `ชั้น ${a.floor}` : null,
    a.room ? `ห้อง ${a.room}` : null,
    a.soi ? `ซ.${a.soi}` : null,
    a.road ? `ถ.${a.road}` : null,
    a.subdistrict,
    a.district,
    a.province,
    a.postalCode,
  ].filter(Boolean).join(' ');
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { customer } = useStoreAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    note: '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!order && items.length === 0) navigate('/cart');
  }, [order, items.length, navigate]);

  useEffect(() => {
    storeApi.get('/store/addresses').then((res) => {
      const { items: list, shippingDefault } = res.data.data;
      setAddresses(list);
      if (shippingDefault) {
        setSelectedAddressId(shippingDefault.id);
        setForm((f) => ({
          ...f,
          name: `${shippingDefault.firstName} ${shippingDefault.lastName}`.trim(),
          phone: shippingDefault.phone || f.phone,
          address: formatShippingAddress(shippingDefault),
        }));
      }
    }).catch(() => {});
  }, []);

  const applyAddress = (id) => {
    setSelectedAddressId(id);
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    setForm((f) => ({
      ...f,
      name: `${addr.firstName} ${addr.lastName}`.trim(),
      phone: addr.phone || f.phone,
      address: formatShippingAddress(addr),
    }));
  };

  if (order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle size={64} className="mx-auto text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold">{t('store.orderPlaced')}</h1>
        <p className="mt-2 text-muted">{t('admin.sales.title')} #: <strong>{order.orderNo}</strong></p>
        <p className="mt-1 text-muted">{t('store.total')}: {formatCurrency(order.total)}</p>
        <p className="mt-4 text-sm text-muted">{t('store.orderPlacedNote')}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/account/orders">
            <Button>{t('store.notifyPayment')}</Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline">{t('store.continueShopping')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!order && items.length === 0) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await storeApi.post('/store/checkout', {
        customer: form,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        note: form.note,
      });
      setOrder(res.data.data);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">{t('store.checkout')}</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{t('store.shippingInfo')}</h2>
            <Link to="/account/addresses" className="text-sm font-medium text-primary hover:underline">
              {t('account.manageAddresses')}
            </Link>
          </div>
          <Alert message={error} />

          {addresses.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('account.shippingAddress')}</label>
              <select
                value={selectedAddressId}
                onChange={(e) => applyAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t('account.selectAddress')}</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.firstName} {a.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={`${t('auth.name')} *`} value={form.name} onChange={set('name')} required />
            <Input label={`${t('auth.phone')} *`} value={form.phone} onChange={set('phone')} required />
            <Input label={t('auth.email')} type="email" value={form.email} onChange={set('email')} className="sm:col-span-2" />
            <Input label={t('auth.address')} value={form.address} onChange={set('address')} className="sm:col-span-2" />
          </div>
          <Textarea label={t('store.orderNotes')} value={form.note} onChange={set('note')} />
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">{t('store.yourOrder')}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between">
                <span>{i.name} × {i.quantity}</span>
                <span>{formatCurrency(i.sellPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-slate-100 pt-4 flex justify-between font-semibold text-lg">
            <span>{t('store.total')}</span>
            <span className="text-primary">{formatCurrency(subtotal)}</span>
          </div>
          <Button type="submit" loading={loading} className="mt-6 w-full">
            {t('store.placeOrder')}
          </Button>
        </div>
      </form>
    </div>
  );
}
