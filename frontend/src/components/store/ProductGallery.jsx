import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';
import { getImageUrl, getProductPlaceholder } from '../../utils/imageUrl';
import { useLanguage } from '../../i18n';

export default function ProductGallery({ images = [], productName = '' }) {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const urls = images.length
    ? images.map((img) => getImageUrl(typeof img === 'string' ? img : img.url))
    : [getProductPlaceholder(productName)];

  const current = urls[active] || getProductPlaceholder(productName);

  const prev = () => setActive((i) => (i - 1 + urls.length) % urls.length);
  const next = () => setActive((i) => (i + 1) % urls.length);

  const openZoom = () => {
    setZoom(1);
    setZoomOpen(true);
  };

  const closeZoom = () => {
    setZoomOpen(false);
    setZoom(1);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
          <button type="button" onClick={openZoom} className="block w-full" title={t('store.zoomImage')}>
            <img src={current} alt={productName} className="aspect-square w-full object-cover" />
            <span className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-1 rounded-lg bg-navy/75 px-3 py-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100">
              <ZoomIn size={14} /> {t('store.zoomImage')}
            </span>
          </button>

          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {urls.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {urls.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  i === active ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {zoomOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-navy/90" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="truncate text-sm font-medium">{productName}</p>
            <div className="flex items-center gap-2">
              {urls.length > 1 && (
                <>
                  <button type="button" className="rounded-lg bg-white/10 p-2 hover:bg-white/20" onClick={prev}>
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs tabular-nums">{active + 1}/{urls.length}</span>
                  <button type="button" className="rounded-lg bg-white/10 p-2 hover:bg-white/20" onClick={next}>
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              <button
                type="button"
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
              >
                <ZoomOut size={18} />
              </button>
              <span className="min-w-[3rem] text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
              >
                <ZoomIn size={18} />
              </button>
              <button type="button" className="rounded-lg bg-white/10 p-2 hover:bg-white/20" onClick={closeZoom}>
                <X size={18} />
              </button>
            </div>
          </div>
          <div
            className="flex flex-1 items-center justify-center overflow-auto p-4"
            onClick={closeZoom}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.15 : 0.15;
              setZoom((z) => Math.min(3, Math.max(1, Number((z + delta).toFixed(2)))));
            }}
          >
            <img
              src={current}
              alt={productName}
              className="max-h-none origin-center rounded-xl bg-white object-contain p-3 shadow-2xl transition-transform"
              style={{ width: `${Math.round(360 * zoom)}px`, height: `${Math.round(360 * zoom)}px` }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="pb-4 text-center text-xs text-white/70">{t('store.zoomImageHint')}</p>
        </div>
      )}
    </>
  );
}
