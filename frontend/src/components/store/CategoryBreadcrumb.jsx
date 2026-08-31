import { useSearchParams, Link } from 'react-router-dom';
import { getCategoryPath } from '../../utils/categoryTree';
import { useLanguage } from '../../i18n';

export default function CategoryBreadcrumb({ categoryId, categories, onNavigate }) {
  const { t } = useLanguage();
  const [, setSearchParams] = useSearchParams();
  const path = categoryId ? getCategoryPath(categoryId, categories) : [];

  const go = (id) => {
    if (onNavigate) onNavigate(id);
    else {
      const p = new URLSearchParams();
      if (id) p.set('category', id);
      setSearchParams(p);
    }
  };

  if (!path.length) return null;

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted">
      <Link to="/shop" className="hover:text-primary">{t('store.shop')}</Link>
      {path.map((cat) => (
        <span key={cat.id} className="inline-flex items-center gap-1">
          <span className="text-slate-300">/</span>
          <button type="button" onClick={() => go(cat.id)} className="hover:text-primary">
            {cat.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
