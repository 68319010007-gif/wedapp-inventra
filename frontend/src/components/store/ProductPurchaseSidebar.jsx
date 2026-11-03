import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { Button } from '../crud';
import { useLanguage } from '../../i18n';

export default function ProductPurchaseSidebar({
  product,
  stock,
  qty,
  setQty,
  added,
  onAdd,
}) {
  const { t } = useLanguage();

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-3xl font-bold text-primary">{formatCurrency(product.sellPrice)}</p>
        <p className="mt-1 text-xs text-muted">/ {product.unit || 'pcs'}</p>

        <p className={`mt-3 text-sm font-medium ${stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {stock > 0 ? `${stock} ${t('store.unitsAvailable')}` : t('store.outOfStock')}
        </p>

        <div className="mt-5 flex items-center rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="p-3 text-muted hover:text-primary"
          >
            <Minus size={16} />
          </button>
          <span className="w-full text-center font-medium">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(Math.min(stock, qty + 1))}
            disabled={qty >= stock}
            className="p-3 text-muted hover:text-primary disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>

        <Button onClick={onAdd} disabled={stock <= 0} className="mt-4 w-full">
          <ShoppingCart size={18} />
          {added ? t('store.addedToCart') : t('store.addToCart')}
        </Button>

        <Link to="/cart" className="mt-3 block">
          <Button variant="outline" className="w-full">{t('store.viewCart')}</Button>
        </Link>

        <p className="mt-4 text-xs leading-relaxed text-muted">{t('store.shippingPolicyLine1')}</p>
      </div>
    </aside>
  );
}
