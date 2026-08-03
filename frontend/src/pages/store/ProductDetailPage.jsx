import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';
import storeApi from '../../services/storeApi';
import { useCart } from '../../store/CartContext';
import { getImageUrl, getProductPlaceholder } from '../../utils/imageUrl';
import { formatCurrency } from '../../utils/format';
import { LoadingState } from '../../components/ui';
import { Button } from '../../components/crud';
import { useLanguage } from '../../i18n';
import { useStockUpdates } from '../../utils/useStockUpdates';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    storeApi
      .get(`/store/products/${id}`)
      .then((res) => setProduct(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStockUpdate = useCallback((productId, quantity) => {
    setProduct((prev) => (prev && prev.id === productId ? { ...prev, stock: quantity } : prev));
  }, []);
  useStockUpdates(handleStockUpdate);

  if (loading) return <LoadingState />;
  if (!product) return <div className="p-8 text-center">{t('store.productNotFound')}</div>;

  const stock = product.stock ?? 0;
  const img = getImageUrl(product.image) || getProductPlaceholder(product.name);

  const handleAdd = () => {
    addItem({ ...product, stock }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link to="/shop" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
        <ArrowLeft size={16} />
        {t('store.backToShop')}
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
          <img src={img} alt={product.name} className="aspect-square w-full object-cover" />
        </div>

        <div>
          {product.category && (
            <span className="rounded-full bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan">{product.category.name}</span>
          )}
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-1 text-sm text-muted">SKU: {product.sku}</p>
          <p className="mt-4 text-3xl font-bold text-primary">{formatCurrency(product.sellPrice)}</p>
          <p className={`mt-2 text-sm font-medium ${stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {stock > 0 ? `${stock} ${t('store.unitsAvailable')}` : t('store.outOfStock')}
          </p>

          {product.description && (
            <p className="mt-6 leading-relaxed text-slate-600">{product.description}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-xl border border-slate-200">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-3 text-muted hover:text-primary"
              >
                <Minus size={16} />
              </button>
              <span className="w-12 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty(Math.min(stock, qty + 1))}
                disabled={qty >= stock}
                className="p-3 text-muted hover:text-primary disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>

            <Button onClick={handleAdd} disabled={stock <= 0} className="flex-1 sm:flex-none">
              <ShoppingCart size={18} />
              {added ? t('store.addedToCart') : t('store.addToCart')}
            </Button>

            <Link to="/cart">
              <Button variant="outline">{t('store.viewCart')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

