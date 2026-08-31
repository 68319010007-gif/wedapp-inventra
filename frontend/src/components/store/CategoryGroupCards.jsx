import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getDirectChildren } from '../../utils/categoryTree';
import { getImageUrl } from '../../utils/imageUrl';
import { useLanguage } from '../../i18n';

function CategoryThumb({ category }) {
  if (category.imageUrl) {
    return (
      <img src={getImageUrl(category.imageUrl)} alt="" className="h-full w-full object-cover" />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-bold text-slate-400">
      {category.name.charAt(0)}
    </div>
  );
}

export default function CategoryGroupCards({ parentId, categories, allCategories }) {
  const { t } = useLanguage();
  const children = getDirectChildren(parentId, categories);

  if (!children.length) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {children.map((cat) => {
        const subcats = getDirectChildren(cat.id, allCategories);
        return (
          <article
            key={cat.id}
            className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-primary/30 hover:shadow-md"
          >
            <div className="h-auto w-36 shrink-0 sm:w-44">
              <CategoryThumb category={cat} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
              <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
              {subcats.length > 0 && (
                <ul className="mt-2 flex-1 space-y-0.5 text-sm text-slate-600">
                  {subcats.slice(0, 6).map((sub) => (
                    <li key={sub.id}>{sub.name}</li>
                  ))}
                </ul>
              )}
              {cat.description && (
                <p className="mt-2 line-clamp-2 text-xs text-muted">{cat.description}</p>
              )}
              <Link
                to={`/shop?category=${cat.id}`}
                className="mt-4 inline-flex w-fit items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                {t('store.shopNow')}
                <ChevronRight size={16} />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function CategorySubTiles({ parentId, categories }) {
  const children = getDirectChildren(parentId, categories);
  if (!children.length) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {children.map((cat) => (
        <Link
          key={cat.id}
          to={`/shop?category=${cat.id}`}
          className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-primary hover:shadow-md"
        >
          <div className="mb-3 h-24 w-24 overflow-hidden rounded-xl border border-slate-100">
            <CategoryThumb category={cat} />
          </div>
          <span className="text-sm font-medium text-slate-800 group-hover:text-primary">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
