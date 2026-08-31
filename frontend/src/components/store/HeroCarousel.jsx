import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    <section className="bg-surface px-3 pb-5 sm:px-5 lg:px-8">
      <div className="relative mx-auto h-[560px] max-w-[1500px] overflow-hidden rounded-[28px] bg-navy text-white lg:h-[650px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <img
              src={slide.image}
              alt=""
              className="h-full w-full object-cover transition duration-[6000ms] ease-out motion-safe:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,26,21,.94)_0%,rgba(8,26,21,.72)_45%,rgba(8,26,21,.14)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,26,21,.55)_0%,transparent_45%)]" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
                <div className="max-w-3xl pb-16">
                  <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-[#49d7a8]">
                    <span className="h-px w-8 bg-[#49d7a8]" />
                    {slide.eyebrow || t('store.buildingStore')}
                  </p>
                  <h1 className="max-w-2xl text-4xl font-semibold leading-[1.06] tracking-[-.035em] sm:text-5xl lg:text-7xl">
                    {slide.title || t('store.heroTitle')}
                  </h1>
                  <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                    {slide.subtitle || t('store.heroSubtitle')}
                  </p>
                  <div className="mt-9 flex flex-wrap gap-3">
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary-dark"
                    >
                      {t('store.shopNow')}
                      <ArrowRight size={18} />
                    </Link>
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 py-3.5 font-medium backdrop-blur transition hover:bg-white/12"
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
            <div className="absolute bottom-5 left-5 z-10 hidden items-center gap-6 rounded-2xl border border-white/15 bg-navy/75 px-5 py-3 text-sm backdrop-blur-md sm:flex lg:left-8">
              <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-[#49d7a8]" /> ตรวจสอบสต็อกเรียลไทม์</span>
              <span className="h-5 w-px bg-white/20" />
              <span className="text-white/65">พร้อมส่งทั่วประเทศ</span>
            </div>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-navy/30 p-2.5 backdrop-blur transition hover:bg-white/20 lg:left-6"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-navy/30 p-2.5 backdrop-blur transition hover:bg-white/20 lg:right-6"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-8 right-8 z-10 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-[#49d7a8]' : 'w-4 bg-white/35 hover:bg-white/70'}`}
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
