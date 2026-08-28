import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import storeApi from '../../services/storeApi';
import ProductCard from '../../components/store/ProductCard';
import { LoadingState } from '../../components/ui';
import { SearchBar } from '../../components/crud';
import { useLanguage } from '../../i18n';
import { useStockUpdates } from '../../utils/useStockUpdates';
import { buildCategoryTree, flattenCategoryTree, getCategoryPath } from '../../utils/categoryTree';

export default function ShopPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categoryItems, setCategoryItems] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const categoryId = searchParams.get('category') || '';

  useEffect(() => {
    storeApi.get('/store/categories').then((res) => {
      setCategoryItems(res.data.data.items || []);
      setCategoryTree(res.data.data.tree || []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (search) params.set('search', search);
    params.set('limit', '24');

    storeApi
      .get(`/store/products?${params}`)
      .then((res) => setProducts(res.data.data.items))
      .finally(() => setLoading(false));
  }, [categoryId, search]);

  const setCategory = (id) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set('category', id);
    else p.delete('category');
    setSearchParams(p);
  };

  const handleStockUpdate = useCallback((productId, quantity) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: quantity, inStock: quantity > 0 } : p)));
  }, []);
  useStockUpdates(handleStockUpdate);

  const flatTree = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);
  const breadcrumb = useMemo(
    () => (categoryId ? getCategoryPath(categoryId, categoryItems) : []),
    [categoryId, categoryItems]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('store.shop')}</h1>
          <p className="mt-1 text-muted">{t('store.catalogSubtitle')}</p>
          {breadcrumb.length > 0 && (
            <nav className="mt-2 flex flex-wrap items-center gap-1 text-sm text-muted">
              <button type="button" onClick={() => setCategory('')} className="hover:text-primary">{t('common.all')}</button>
              {breadcrumb.map((cat) => (
                <span key={cat.id} className="inline-flex items-center gap-1">
                  <span>/</span>
                  <button type="button" onClick={() => setCategory(cat.id)} className="hover:text-primary">{cat.name}</button>
                </span>
              ))}
            </nav>
          )}
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">{t('store.productCategories')}</p>
            <ul className="space-y-1 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className={`w-full rounded-lg px-3 py-2 text-left ${!categoryId ? 'bg-primary/10 font-medium text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {t('common.all')}
                </button>
              </li>
              {flatTree.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`w-full rounded-lg py-2 text-left ${categoryId === cat.id ? 'bg-primary/10 font-medium text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                    style={{ paddingLeft: `${12 + cat.depth * 14}px`, paddingRight: '12px' }}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
            <button
              onClick={() => setCategory('')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${!categoryId ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary'}`}
            >
              {t('common.all')}
            </button>
            {buildCategoryTree(categoryItems).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${categoryId === cat.id ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingState />
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-muted">{t('common.noData')}</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
