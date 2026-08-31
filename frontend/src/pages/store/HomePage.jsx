import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import storeApi from '../../services/storeApi';
import ProductCard from '../../components/store/ProductCard';
import HeroCarousel from '../../components/store/HeroCarousel';
import { LoadingState } from '../../components/ui';
import { useLanguage } from '../../i18n';
import { useStockUpdates } from '../../utils/useStockUpdates';
import { getImageUrl } from '../../utils/imageUrl';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=80',
];

export default function HomePage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const heroSlides = [
    {
      image: HERO_IMAGES[0],
      eyebrow: 'store.buildingStore',
      title: 'store.heroTitle',
      subtitle: 'store.heroSubtitle',
    },
    {
      image: HERO_IMAGES[1],
      eyebrow: 'store.buildingStore',
      title: 'store.heroSlide2Title',
      subtitle: 'store.heroSlide2Subtitle',
    },
    {
      image: HERO_IMAGES[2],
      eyebrow: 'store.buildingStore',
      title: 'store.heroSlide3Title',
      subtitle: 'store.heroSlide3Subtitle',
    },
  ];

  useEffect(() => {
    Promise.all([storeApi.get('/store/products?limit=8'), storeApi.get('/store/categories')])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data.data.items);
        setCategories(catRes.data.data.tree || catRes.data.data.items || catRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStockUpdate = useCallback((productId, quantity) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: quantity, inStock: quantity > 0 } : p)));
  }, []);
  useStockUpdates(handleStockUpdate);

  return (
    <div>
      <HeroCarousel slides={heroSlides} />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <h2 className="mb-6 text-2xl font-semibold">{t('store.shopByCategory')}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                {cat.imageUrl ? (
                  <img
                    src={getImageUrl(cat.imageUrl)}
                    alt={cat.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-3xl font-bold text-primary">
                    {cat.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium">{cat.name}</p>
                <p className="text-sm text-muted">{cat._count?.products || 0} {t('store.products')}</p>
              </div>
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
