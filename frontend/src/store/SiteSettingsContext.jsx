import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import storeApi from '../services/storeApi';
import { getImageUrl } from '../utils/imageUrl';

const DEFAULT_LOGO = '/inventra-logo.png';
const DEFAULT_ADMIN_LOGO = '/inventra-logo-admin.png';

const DEFAULT_HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80',
    eyebrow: 'BUILDING MATERIALS STORE',
    title: 'Quality Products for Every Construction Project',
    subtitle: 'Cement, steel, tiles, sanitary ware — delivered with real-time stock availability.',
  },
  {
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80',
    eyebrow: 'BUILDING MATERIALS STORE',
    title: 'Cement, Steel, Tiles — All in One Place',
    subtitle: 'Easy ordering, fast delivery, real-time stock checks.',
  },
  {
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=80',
    eyebrow: 'BUILDING MATERIALS STORE',
    title: 'Quality Materials at Fair Prices',
    subtitle: 'Full catalog, ready to ship — order online anytime.',
  },
];

const SiteSettingsContext = createContext({
  logoUrl: DEFAULT_LOGO,
  adminLogoUrl: DEFAULT_ADMIN_LOGO,
  heroSlides: DEFAULT_HERO_SLIDES,
  appName: 'Inventra',
  storeTagline: '',
  loading: true,
  refresh: () => {},
});

function resolveLogoUrl(path, fallback = DEFAULT_LOGO) {
  if (!path?.trim()) return fallback;
  return getImageUrl(path) || fallback;
}

function resolveSlideImage(image) {
  if (!image) return '';
  return getImageUrl(image) || image;
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    app_name: 'Inventra',
    app_tagline: '',
    app_logo: '',
    admin_logo: '',
    store_tagline: '',
    hero_slides: DEFAULT_HERO_SLIDES,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return storeApi
      .get('/store/settings')
      .then((res) => setSettings(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logoUrl = useMemo(() => resolveLogoUrl(settings.app_logo), [settings.app_logo]);
  const adminLogoUrl = useMemo(
    () => resolveLogoUrl(settings.admin_logo, DEFAULT_ADMIN_LOGO),
    [settings.admin_logo]
  );

  const heroSlides = useMemo(
    () =>
      (settings.hero_slides?.length ? settings.hero_slides : DEFAULT_HERO_SLIDES).map((slide) => ({
        ...slide,
        image: resolveSlideImage(slide.image),
      })),
    [settings.hero_slides]
  );

  useEffect(() => {
    const link = document.querySelector("link[rel='icon']");
    if (link) link.href = logoUrl;
  }, [logoUrl]);

  useEffect(() => {
    const name = settings.app_name?.trim() || 'Inventra';
    const tagline = settings.app_tagline?.trim();
    document.title = tagline ? `${name} - ${tagline}` : name;
  }, [settings.app_name, settings.app_tagline]);

  const value = useMemo(
    () => ({
      logoUrl,
      adminLogoUrl,
      heroSlides,
      appName: settings.app_name || 'Inventra',
      appTagline: settings.app_tagline || '',
      storeTagline: settings.store_tagline || '',
      loading,
      refresh: load,
    }),
    [logoUrl, adminLogoUrl, heroSlides, settings.app_name, settings.app_tagline, settings.store_tagline, loading, load]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export { DEFAULT_LOGO, DEFAULT_ADMIN_LOGO, DEFAULT_HERO_SLIDES };
