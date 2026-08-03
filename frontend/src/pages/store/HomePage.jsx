import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import storeApi from '../../services/storeApi';
import ProductCard from '../../components/store/ProductCard';
import { LoadingState } from '../../components/ui';
import { useLanguage } from '../../i18n';
import { useStockUpdates } from '../../utils/useStockUpdates';

export default function HomePage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([storeApi.get('/store/products?limit=8'), storeApi.get('/store/categories')])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data.data.items);
        setCategories(catRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStockUpdate = useCallback((productId, quantity) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: quantity, inStock: quantity > 0 } : p)));
  }, []);
  useStockUpdates(handleStockUpdate);

  return (
    <div>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.3),_transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-cyan">{t('store.buildingStore')}</p>
            <h1 className="text-4xl font-bold leading-tight lg:text-5xl">
              {t('store.heroTitle')}
            </h1>
            <p className="mt-4 text-lg text-white/70">
              {t('store.heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium hover:bg-primary-dark">
                <ShoppingBag size={18} />
                {t('store.shopNow')}
              </Link>
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-medium hover:bg-white/10">
                {t('store.browseCatalog')}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <h2 className="mb-6 text-2xl font-semibold">{t('store.shopByCategory')}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary transition group-hover:bg-primary group-hover:text-white">
                {cat.name.charAt(0)}
              </div>
              <p className="font-medium">{cat.name}</p>
              <p className="text-sm text-muted">{cat._count?.products || 0} {t('store.products')}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t('store.featured')}</h2>
            <Link to="/shop" className="text-sm font-medium text-primary hover:underline">{t('store.viewAll')}</Link>
          </div>
          {loading ? (
            <LoadingState />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

