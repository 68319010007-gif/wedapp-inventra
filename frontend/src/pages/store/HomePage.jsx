import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import storeApi from '../../services/storeApi';
import ProductCard from '../../components/store/ProductCard';
import HeroCarousel from '../../components/store/HeroCarousel';
import { LoadingState } from '../../components/ui';
import { useLanguage } from '../../i18n';
import { useStockUpdates } from '../../utils/useStockUpdates';
import { getImageUrl } from '../../utils/imageUrl';
import { useSiteSettings } from '../../store/SiteSettingsContext';
import { ArrowRight, Boxes, Headphones, ShieldCheck, Truck } from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();
  const { heroSlides } = useSiteSettings();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-primary">เลือกได้ตรงงาน</p><h2 className="text-3xl font-semibold tracking-[-.025em] text-navy lg:text-4xl">{t('store.shopByCategory')}</h2></div>
          <Link to="/shop" className="hidden items-center gap-2 text-sm font-semibold text-navy hover:text-primary sm:flex">{t('store.viewAll')} <ArrowRight size={17} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              className="group overflow-hidden rounded-[22px] border border-[#dde3de] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#b8c6bd] hover:shadow-[0_18px_40px_-28px_rgba(16,37,31,.5)]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#ecefea]">
                {cat.imageUrl ? (
                  <img
                    src={getImageUrl(cat.imageUrl)}
                    alt={cat.name}
                    className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-primary/70">
                    {cat.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between p-4 lg:p-5">
                <div><p className="font-semibold text-navy">{cat.name}</p><p className="mt-1 text-xs text-muted">{cat.productCount ?? cat._count?.products ?? 0} {t('store.products')}</p></div>
                <ArrowRight size={18} className="text-muted transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-9 flex items-end justify-between">
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-primary">คัดสรรเพื่อมืออาชีพ</p><h2 className="text-3xl font-semibold tracking-[-.025em] text-navy lg:text-4xl">{t('store.featured')}</h2></div>
            <Link to="/shop" className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-primary">{t('store.viewAll')} <ArrowRight size={17} /></Link>
          </div>
          {loading ? (
            <LoadingState />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-px bg-white/10 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {[
            [Boxes, 'สต็อกแม่นยำ', 'เช็กจำนวนพร้อมขายได้ทันที'],
            [Truck, 'จัดส่งทั่วประเทศ', 'วางแผนส่งตรงถึงหน้างาน'],
            [ShieldCheck, 'สินค้ามาตรฐาน', 'มั่นใจกับแบรนด์ที่ช่างเลือกใช้'],
            [Headphones, 'ทีมงานพร้อมช่วย', 'ให้คำแนะนำก่อนตัดสินใจ'],
          ].map(([Icon, title, detail]) => (
            <div key={title} className="flex gap-4 bg-navy px-5 py-8 lg:px-7">
              <Icon className="shrink-0 text-[#49d7a8]" size={25} />
              <div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-white/55">{detail}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
