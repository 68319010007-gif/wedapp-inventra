import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import storeApi from '../../services/storeApi';
import ProductCard from '../../components/store/ProductCard';
import { LoadingState } from '../../components/ui';
import { SearchBar } from '../../components/crud';
import { useLanguage } from '../../i18n';
import { useStockUpdates } from '../../utils/useStockUpdates';

export default function ShopPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const categoryId = searchParams.get('category') || '';

  useEffect(() => {
    storeApi.get('/store/categories').then((res) => setCategories(res.data.data));
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('store.shop')}</h1>
          <p className="mt-1 text-muted">{t('store.catalogSubtitle')}</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${!categoryId ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary'}`}
        >
          {t('common.all')}
        </button>
        {categories.map((cat) => (
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

