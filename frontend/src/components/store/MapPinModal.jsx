import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Search } from 'lucide-react';
import { Button, Input } from '../crud';
import { useLanguage } from '../../i18n';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 };

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=th`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

async function searchAddress(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=th&limit=5&accept-language=th`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default function MapPinModal({ open, onClose, onConfirm, initial }) {
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [pin, setPin] = useState({
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    mapAddress: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const startLat = initial?.lat != null ? Number(initial.lat) : DEFAULT_CENTER.lat;
    const startLng = initial?.lng != null ? Number(initial.lng) : DEFAULT_CENTER.lng;
    const startAddress = initial?.mapAddress || '';

    setQuery('');
    setResults([]);
    setPin({ lat: startLat, lng: startLng, mapAddress: startAddress });

    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled || !mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current, { scrollWheelZoom: true }).setView([startLat, startLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true, icon: markerIcon }).addTo(map);
      marker.bindTooltip(t('account.pinYourAddress'), {
        permanent: true,
        direction: 'top',
        offset: [0, -12],
      });

      const updateFromLatLng = async (latlng) => {
        setLoading(true);
        const address = await reverseGeocode(latlng.lat, latlng.lng);
        if (cancelled) return;
        setPin({
          lat: latlng.lat,
          lng: latlng.lng,
          mapAddress: address || `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
        });
        setLoading(false);
      };

      marker.on('dragend', () => updateFromLatLng(marker.getLatLng()));
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        updateFromLatLng(e.latlng);
      });

      mapInstance.current = map;
      markerRef.current = marker;

      // Leaflet needs a size refresh after the modal becomes visible
      requestAnimationFrame(() => {
        map.invalidateSize();
        setTimeout(() => map.invalidateSize(), 200);
      });

      if (!startAddress) {
        reverseGeocode(startLat, startLng).then((address) => {
          if (!cancelled && address) {
            setPin((p) => ({ ...p, mapAddress: address }));
          }
        });
      }
    }, 80);

    document.body.style.overflow = 'hidden';

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.body.style.overflow = '';
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      markerRef.current = null;
    };
  }, [open, initial?.lat, initial?.lng, initial?.mapAddress, t]);

  if (!open) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const found = await searchAddress(query.trim());
    setResults(found);
    setLoading(false);
  };

  const pickResult = (item) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    setPin({ lat, lng, mapAddress: item.display_name });
    setResults([]);
    setQuery(item.display_name);
    if (mapInstance.current && markerRef.current) {
      mapInstance.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold">{t('account.pinLocation')}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('account.searchAddress')}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <div className="flex gap-2">
              <Button type="button" onClick={handleSearch} loading={loading}>
                <Search size={16} /> {t('common.search').replace('...', '')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
              >
                {t('account.clear')}
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <ul className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white text-sm">
              {results.map((r) => (
                <li key={`${r.place_id}`}>
                  <button
                    type="button"
                    className="w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50 last:border-0"
                    onClick={() => pickResult(r)}
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div ref={mapRef} className="h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100" />

          <p className="text-sm text-slate-700">
            {loading ? t('common.loading') : pin.mapAddress || '—'}
          </p>
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <Button
            type="button"
            className="w-full"
            onClick={() => onConfirm(pin)}
            disabled={!pin.lat || !pin.lng}
          >
            {t('account.confirmPin')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
