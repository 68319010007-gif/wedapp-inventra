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

function parseHeroSlides(raw) {
  if (!raw?.trim()) return DEFAULT_HERO_SLIDES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_HERO_SLIDES;
    const slides = parsed
      .filter((s) => s?.image?.trim())
      .map((s) => ({
        image: String(s.image).trim(),
        eyebrow: s.eyebrow?.trim() || '',
        title: s.title?.trim() || '',
        subtitle: s.subtitle?.trim() || '',
      }));
    return slides.length ? slides : DEFAULT_HERO_SLIDES;
  } catch {
    return DEFAULT_HERO_SLIDES;
  }
}

function buildPublicSettings(settingsMap) {
  return {
    app_name: settingsMap.app_name || 'Inventra',
    app_tagline: settingsMap.app_tagline || '',
    app_logo: settingsMap.app_logo?.trim() || '',
    admin_logo: settingsMap.admin_logo?.trim() || '',
    store_tagline: settingsMap.store_tagline?.trim() || '',
    hero_slides: parseHeroSlides(settingsMap.hero_slides),
  };
}

module.exports = {
  DEFAULT_HERO_SLIDES,
  parseHeroSlides,
  buildPublicSettings,
};
