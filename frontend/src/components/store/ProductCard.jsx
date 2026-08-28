import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { getImageUrl, getProductPlaceholder } from '../../utils/imageUrl';
import { getProductImage } from '../../utils/orderNote';
import { formatCurrency } from '../../utils/format';
import { useCart } from '../../store/CartContext';
import { useLanguage } from '../../i18n';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { t } = useLanguage();
  const img = getImageUrl(getProductImage(product)) || getProductPlaceholder(product.name);
  const stock = product.stock ?? product.inventoryItems?.quantity ?? 0;

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      <Link to={`/shop/${product.id}`} className="block aspect-square overflow-hidden bg-slate-100">
        <img src={img} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
      </Link>
      <div className="p-4">
        {product.category && (
          <p className="text-xs font-medium uppercase tracking-wide text-cyan">{product.category.name}</p>
        )}
        <Link to={`/shop/${product.id}`}>
          <h3 className="mt-1 font-semibold text-slate-900 hover:text-primary">{product.name}</h3>
        </Link>
        <p className="mt-1 text-xs text-muted">SKU: {product.sku}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary">{formatCurrency(product.sellPrice)}</p>
            <p className={`text-xs ${stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {stock > 0 ? `${stock} ${t('store.inStock')}` : t('store.outOfStock')}
            </p>
          </div>
          <button
            disabled={stock <= 0}
            onClick={() => addItem({ ...product, stock })}
            className="rounded-xl bg-navy p-2.5 text-white transition hover:bg-primary disabled:opacity-40"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
