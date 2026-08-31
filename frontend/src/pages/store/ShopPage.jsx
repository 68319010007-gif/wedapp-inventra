import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import storeApi from '../../services/storeApi';
import ProductCard from '../../components/store/ProductCard';
import CategoryBreadcrumb from '../../components/store/CategoryBreadcrumb';
import CategoryExpandableText from '../../components/store/CategoryExpandableText';
import CategoryGroupCards, { CategorySubTiles } from '../../components/store/CategoryGroupCards';
import { LoadingState } from '../../components/ui';
import { SearchBar } from '../../components/crud';
import { useLanguage } from '../../i18n';
import { useStockUpdates } from '../../utils/useStockUpdates';
import {
  buildCategoryTree,
  flattenCategoryTree,
  getCategoryPath,
  getDirectChildren,
} from '../../utils/categoryTree';

export default function ShopPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categoryItems, setCategoryItems] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const categoryId = searchParams.get('category') || '';
  const isSearchMode = !!search.trim();

  useEffect(() => {
    storeApi.get('/store/categories').then((res) => {
      const items = res.data.data.items || [];
      setCategoryItems(items);
      setCategoryTree(res.data.data.tree || buildCategoryTree(items));
    });
  }, []);

  const currentCategory = useMemo(
    () => categoryItems.find((c) => c.id === categoryId) || null,
    [categoryId, categoryItems]
  );

  const childCategories = useMemo(
    () => (categoryId ? getDirectChildren(categoryId, categoryItems) : getDirectChildren(null, categoryItems)),
    [categoryId, categoryItems]
  );

  const categoryDepth = useMemo(
    () => (categoryId ? getCategoryPath(categoryId, categoryItems).length - 1 : -1),
    [categoryId, categoryItems]
  );

  const isHubView = !isSearchMode && childCategories.length > 0;
  const isRootHub = isHubView && !categoryId;
  const isGroupHub = isHubView && categoryDepth === 0;
  const isSubHub = isHubView && categoryDepth >= 1;

  useEffect(() => {
    if (isHubView) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (search) params.set('search', search);
    params.set('limit', '24');

    storeApi
      .get(`/store/products?${params}`)
      .then((res) => setProducts(res.data.data.items))
      .finally(() => setLoading(false));
  }, [categoryId, search, isHubView]);

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

  const pageTitle = currentCategory?.name || t('store.shop');
  const pageIntro = currentCategory?.description || (isRootHub ? t('store.catalogSubtitle') : '');

  const seoTitle = currentCategory?.name?.split(' / ')[0] || currentCategory?.name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <CategoryBreadcrumb categoryId={categoryId} categories={categoryItems} onNavigate={setCategory} />
          <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">{pageTitle}</h1>
          {pageIntro && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{pageIntro}</p>}
          {!isHubView && products.length > 0 && (
            <p className="mt-2 text-sm text-muted">
              {t('store.productListCount', { count: products.length })}
            </p>
          )}
        </div>
        <div className="w-full lg:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
        </div>
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
          {loading ? (
            <LoadingState />
          ) : isSearchMode ? (
            products.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-muted">{t('common.noData')}</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )
          ) : isRootHub || isGroupHub ? (
            <CategoryGroupCards
              parentId={categoryId || null}
              categories={categoryItems}
              allCategories={categoryItems}
            />
          ) : isSubHub ? (
            <CategorySubTiles parentId={categoryId} categories={categoryItems} />
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-muted">{t('common.noData')}</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {!isSearchMode && currentCategory?.longDescription && (
            <CategoryExpandableText title={seoTitle} text={currentCategory.longDescription} />
          )}
        </div>
      </div>
    </div>
  );
}
