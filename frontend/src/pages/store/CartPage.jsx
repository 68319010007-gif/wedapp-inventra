import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../store/CartContext';
import { getImageUrl, getProductPlaceholder } from '../../utils/imageUrl';
import { formatCurrency } from '../../utils/format';
import { Button } from '../../components/crud';
import { useLanguage } from '../../i18n';

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, totalItems } = useCart();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-2xl font-semibold">{t('store.emptyCart')}</h1>
        <p className="mt-2 text-muted">{t('store.emptyCartSubtitle')}</p>
        <Link to="/shop" className="mt-6 inline-block">
          <Button>{t('store.continueShopping')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">{t('store.cart')} ({totalItems} {t('store.products')})</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <img
                src={getImageUrl(item.image) || getProductPlaceholder(item.name)}
                alt={item.name}
                className="h-24 w-24 rounded-xl object-cover"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-xs text-muted">SKU: {item.sku}</p>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-slate-200">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-2">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-2">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-semibold text-primary">{formatCurrency(item.sellPrice * item.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t('store.orderSummary')}</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t('store.subtotal')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('store.shipping')}</span>
              <span className="text-emerald-600">{t('store.free')}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between font-semibold text-lg">
              <span>{t('store.total')}</span>
              <span className="text-primary">{formatCurrency(subtotal)}</span>
            </div>
          </div>
          <Link to="/checkout" className="mt-6 block">
            <Button className="w-full">{t('store.proceedToCheckout')}</Button>
          </Link>
          <Link to="/shop" className="mt-3 block text-center text-sm text-primary hover:underline">
            {t('store.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}

