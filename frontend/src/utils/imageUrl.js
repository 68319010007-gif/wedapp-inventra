const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const SERVER_BASE = API_BASE.replace(/\/api\/v1\/?$/, '');

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getProductPlaceholder(name = 'Product') {
  const letter = (name || 'P').charAt(0).toUpperCase();
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="#e2e8f0" width="400" height="400"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="80" font-family="sans-serif">${letter}</text></svg>`
  )}`;
}
