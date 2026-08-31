import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowUpRight } from 'lucide-react';
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
    <article className="group overflow-hidden rounded-[22px] border border-[#dfe4df] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#bdc9c2] hover:shadow-[0_20px_45px_-28px_rgba(16,37,31,.45)]">
      <Link to={`/shop/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#eef0ec]">
        <img src={img} alt={product.name} className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-105" />
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-navy opacity-0 shadow-sm transition group-hover:opacity-100"><ArrowUpRight size={17} /></span>
      </Link>
      <div className="p-5">
        {product.category && (
          <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-primary">{product.category.name}</p>
        )}
        <Link to={`/shop/${product.id}`}>
          <h3 className="mt-2 min-h-12 font-semibold leading-6 text-navy transition hover:text-primary">{product.name}</h3>
        </Link>
        <p className="mt-1 text-xs text-muted">SKU: {product.sku}</p>
        <div className="mt-4 flex items-end justify-between border-t border-[#edf0ed] pt-4">
          <div>
            <p className="text-xl font-bold text-navy">{formatCurrency(product.sellPrice)}</p>
            <p className={`mt-0.5 text-xs font-medium ${stock > 0 ? 'text-emerald-700' : 'text-red-500'}`}>
              {stock > 0 ? `${stock} ${t('store.inStock')}` : t('store.outOfStock')}
            </p>
          </div>
          <button
            disabled={stock <= 0}
            onClick={() => addItem({ ...product, stock })}
            className="rounded-full bg-navy p-3 text-white transition hover:bg-primary disabled:opacity-40"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
