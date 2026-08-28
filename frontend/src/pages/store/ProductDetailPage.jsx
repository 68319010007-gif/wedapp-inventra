import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import storeApi from '../../services/storeApi';
import { useCart } from '../../store/CartContext';
import { getProductImage } from '../../utils/orderNote';
import { getCategoryPathFromProduct } from '../../utils/categoryTree';
import { formatCurrency } from '../../utils/format';
import { LoadingState } from '../../components/ui';
import ProductGallery from '../../components/store/ProductGallery';
import ProductPurchaseSidebar from '../../components/store/ProductPurchaseSidebar';
import ProductReviews from '../../components/store/ProductReviews';
import ProductCard from '../../components/store/ProductCard';
import { useLanguage } from '../../i18n';
import { useStockUpdates } from '../../utils/useStockUpdates';
import { addRecentlyViewed, getRecentlyViewedIds } from '../../utils/recentlyViewed';

function buildImageList(product) {
  const fromGallery = (product.images || [])
    .slice()
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return b.isPrimary ? 1 : -1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .map((img) => img.url);
  if (fromGallery.length) return fromGallery;
  const primary = getProductImage(product);
  return primary ? [primary] : [];
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    setLoading(true);
    storeApi
      .get(`/store/products/${id}`)
      .then((res) => {
        const p = res.data.data;
        setProduct(p);
        addRecentlyViewed(p.id);

        const recentIds = getRecentlyViewedIds(p.id);
        if (recentIds.length) {
          Promise.all(
            recentIds.slice(0, 4).map((pid) =>
              storeApi.get(`/store/products/${pid}`).then((r) => r.data.data).catch(() => null)
            )
          ).then((items) => setRecentProducts(items.filter(Boolean)));
        } else {
          setRecentProducts([]);
        }

        if (p.categoryId) {
          storeApi
            .get(`/store/products?categoryId=${p.categoryId}&limit=8`)
            .then((r) => setRelated((r.data.data.items || []).filter((item) => item.id !== p.id).slice(0, 4)))
            .catch(() => setRelated([]));
        } else {
          setRelated([]);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStockUpdate = useCallback((productId, quantity) => {
    setProduct((prev) => (prev && prev.id === productId ? { ...prev, stock: quantity } : prev));
  }, []);
  useStockUpdates(handleStockUpdate);

  const images = useMemo(() => (product ? buildImageList(product) : []), [product]);
  const categoryPath = useMemo(() => getCategoryPathFromProduct(product?.category), [product]);

  const specRows = useMemo(() => {
    if (!product) return [];
    return [
      [t('store.skuLabel'), product.sku],
      product.barcode && [t('store.barcode'), product.barcode],
      categoryPath.length && [t('store.category'), categoryPath.map((c) => c.name).join(' › ')],
      [t('store.unit'), product.unit || 'pcs'],
      product.stock != null && [t('store.inStock'), `${product.stock} ${t('store.unitsAvailable')}`],
    ].filter(Boolean);
  }, [product, categoryPath, t]);

  if (loading) return <LoadingState />;
  if (!product) return <div className="p-8 text-center">{t('store.productNotFound')}</div>;

  const stock = product.stock ?? 0;

  const handleAdd = () => {
    addItem({ ...product, stock, image: getProductImage(product) }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const tabs = [
    { id: 'details', label: t('store.productDetails') },
    { id: 'shipping', label: t('store.shippingPolicy') },
    { id: 'reviews', label: t('store.reviews') },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link to="/shop" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
        <ArrowLeft size={16} />
        {t('store.backToShop')}
      </Link>

      {categoryPath.length > 0 && (
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted">
          <Link to="/shop" className="hover:text-primary">{t('store.shop')}</Link>
          {categoryPath.map((cat) => (
            <span key={cat.id} className="inline-flex items-center gap-1">
              <span>/</span>
              <Link to={`/shop?category=${cat.id}`} className="hover:text-primary">{cat.name}</Link>
            </span>
          ))}
        </nav>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_280px]">
        <ProductGallery images={images} productName={product.name} />

        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-snug text-slate-900 lg:text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-muted">{t('store.skuLabel')}: {product.sku}</p>

          {product.description && (
            <p className="mt-5 leading-relaxed text-slate-600">{product.description}</p>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 lg:hidden">
            <p className="text-2xl font-bold text-primary">{formatCurrency(product.sellPrice)}</p>
          </div>
        </div>

        <ProductPurchaseSidebar
          product={product}
          stock={stock}
          qty={qty}
          setQty={setQty}
          added={added}
          onAdd={handleAdd}
        />
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-center text-xl font-bold text-slate-900">{t('store.aboutProduct')}</h2>
        <div className="border-b border-slate-200">
          <div className="flex justify-center gap-6 sm:gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 pb-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          {activeTab === 'details' && (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="text-sm leading-relaxed text-slate-700">
                {product.description ? (
                  <p className="whitespace-pre-wrap">{product.description}</p>
                ) : (
                  <p className="text-muted">{t('common.noData')}</p>
                )}
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-900">{t('store.specifications')}</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {specRows.map(([label, value]) => (
                      <tr key={label} className="border-b border-slate-100">
                        <th className="w-2/5 bg-slate-50 px-4 py-3 text-left font-medium text-muted">{label}</th>
                        <td className="px-4 py-3 text-slate-900">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm leading-relaxed text-slate-700">
              <ul className="list-disc space-y-2 pl-5">
                <li>{t('store.shippingPolicyLine1')}</li>
                <li>{t('store.shippingPolicyLine2')}</li>
                <li>{t('store.shippingPolicyLine3')}</li>
              </ul>
            </div>
          )}

          {activeTab === 'reviews' && (
            <ProductReviews productId={product.id} />
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-center text-xl font-bold text-slate-900">{t('store.relatedProducts')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {recentProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-center text-xl font-bold text-slate-900">{t('store.recentlyViewed')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
