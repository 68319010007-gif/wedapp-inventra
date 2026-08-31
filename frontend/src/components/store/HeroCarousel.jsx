import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../i18n';

export default function HeroCarousel({ slides }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (delta) => setIndex((i) => (i + delta + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => go(1), 6000);
    return () => clearInterval(timer);
  }, [go, slides.length]);

  if (!slides.length) return null;

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="relative h-[420px] lg:h-[480px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <img
              src={slide.image}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/30" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
                <div className="max-w-2xl">
                  <p className="mb-3 text-sm font-medium uppercase tracking-widest text-cyan">
                    {t(slide.eyebrow)}
                  </p>
                  <h1 className="text-4xl font-bold leading-tight lg:text-5xl">{t(slide.title)}</h1>
                  <p className="mt-4 text-lg text-white/80">{t(slide.subtitle)}</p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium hover:bg-primary-dark"
                    >
                      <ShoppingBag size={18} />
                      {t('store.shopNow')}
                    </Link>
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-medium hover:bg-white/10"
                    >
                      {t('store.browseCatalog')}
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/25 lg:left-8"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/25 lg:right-8"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
