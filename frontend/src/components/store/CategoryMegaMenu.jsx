import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Grid3X3 } from 'lucide-react';
import storeApi from '../../services/storeApi';
import { buildCategoryTree } from '../../utils/categoryTree';
import { useLanguage } from '../../i18n';

export default function CategoryMegaMenu() {
  const { t } = useLanguage();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState([]);
  const [activeRootId, setActiveRootId] = useState(null);

  useEffect(() => {
    storeApi.get('/store/categories').then((res) => {
      const items = res.data.data.items || [];
      const data = res.data.data.tree?.length ? res.data.data.tree : buildCategoryTree(items);
      const roots = data.filter((c) => !c.parentId);
      setTree(roots.length ? roots : data);
      if (data.length) setActiveRootId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const activeRoot = useMemo(
    () => tree.find((c) => c.id === activeRootId) || tree[0] || null,
    [tree, activeRootId]
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${open ? 'border-primary bg-primary text-white' : 'border-[#cfdad6] bg-white text-navy hover:border-primary hover:text-primary'}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Grid3X3 size={16} />
        {t('store.productCategories')}
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && tree.length > 0 && (
        <div className="absolute left-0 top-full z-50 pt-1">
          <div className="w-[min(920px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#dbe4e1] bg-white shadow-2xl">
            <div className="grid grid-cols-[240px_1fr] min-h-[280px]">
              <div className="border-r border-slate-100 bg-slate-50 py-2">
                {tree.map((root) => (
                  <button
                    key={root.id}
                    type="button"
                    onMouseEnter={() => setActiveRootId(root.id)}
                    onFocus={() => setActiveRootId(root.id)}
                    className={`block w-full px-4 py-2.5 text-left text-sm font-bold transition ${
                      activeRoot?.id === root.id
                        ? 'bg-white text-primary'
                        : 'text-slate-800 hover:bg-white/80'
                    }`}
                  >
                    {root.name}
                  </button>
                ))}
              </div>

              <div className="grid content-start gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {(activeRoot?.children || []).length ? (
                  activeRoot.children.map((group) => (
                    <div key={group.id}>
                      <Link
                        to={`/shop?category=${group.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-primary"
                        onClick={() => setOpen(false)}
                      >
                        {group.name}
                      </Link>
                      <ul className="mt-2 space-y-1.5">
                        {(group.children || []).map((leaf) => (
                          <li key={leaf.id}>
                            <Link
                              to={`/shop?category=${leaf.id}`}
                              className="text-sm font-normal text-slate-600 hover:text-primary"
                              onClick={() => setOpen(false)}
                            >
                              {leaf.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div>
                    <Link
                      to={`/shop?category=${activeRoot.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-primary"
                      onClick={() => setOpen(false)}
                    >
                      {t('store.viewAllInCategory')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
