import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../../store/CartContext';
import storeApi from '../../services/storeApi';
import { formatCurrency } from '../../utils/format';
import { Button, Input, Textarea, Alert } from '../../components/crud';
import { useLanguage } from '../../i18n';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', note: '' });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle size={64} className="mx-auto text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold">{t('store.orderPlaced')}</h1>
        <p className="mt-2 text-muted">{t('admin.sales.title')} #: <strong>{order.orderNo}</strong></p>
        <p className="mt-1 text-muted">{t('store.total')}: {formatCurrency(order.total)}</p>
        <p className="mt-4 text-sm text-muted">{t('store.orderPlacedNote')}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/orders">
            <Button variant="outline">{t('store.myOrders')}</Button>
          </Link>
          <Link to="/shop">
            <Button>{t('store.continueShopping')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

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
          <h2 className="font-semibold">{t('store.shippingInfo')}</h2>
          <Alert message={error} />
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

