const STORAGE_KEY = 'inventra_recently_viewed';
const MAX_ITEMS = 8;

export function getRecentlyViewedIds(excludeId = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return ids.filter((id) => id !== excludeId).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function addRecentlyViewed(productId) {
  if (!productId) return;
  try {
    const ids = getRecentlyViewedIds().filter((id) => id !== productId);
    ids.unshift(productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ITEMS)));
  } catch {
    /* ignore */
  }
}
