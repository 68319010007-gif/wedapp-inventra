import { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n';
import { PageHeader, LoadingState } from '../components/ui';
import { Button, Input, Textarea, Alert } from '../components/crud';
import { getImageUrl } from '../utils/imageUrl';
import { DEFAULT_HERO_SLIDES, DEFAULT_LOGO, useSiteSettings } from '../store/SiteSettingsContext';

const emptySlide = () => ({ image: '', eyebrow: '', title: '', subtitle: '' });

function parseHeroSlides(raw) {
  if (!raw) return [...DEFAULT_HERO_SLIDES];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_HERO_SLIDES];
  } catch {
    return [...DEFAULT_HERO_SLIDES];
  }
}

export default function SettingsPage() {
  const { t } = useLanguage();
  const { refresh } = useSiteSettings();
  const [settings, setSettings] = useState({});
  const [heroSlides, setHeroSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        const data = res.data.data;
        setSettings(data);
        setHeroSlides(parseHeroSlides(data.hero_slides));
      })
      .finally(() => setLoading(false));
  }, []);

  const uploadFile = async (file, target) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = res.data.data.url;
    if (target === 'logo') {
      setSettings((prev) => ({ ...prev, app_logo: url }));
    } else {
      setHeroSlides((prev) =>
        prev.map((slide, i) => (i === target ? { ...slide, image: url } : slide))
      );
    }
  };

  const handleUpload = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(String(target));
    setError('');
    try {
      await uploadFile(file, target);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading('');
      e.target.value = '';
    }
  };

  const moveSlide = (index, delta) => {
    setHeroSlides((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...settings,
        hero_slides: JSON.stringify(
          heroSlides.filter((slide) => slide.image?.trim())
        ),
      };
      await api.put('/settings', payload);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const logoPreview = settings.app_logo ? getImageUrl(settings.app_logo) : DEFAULT_LOGO;

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin.settings.title')} subtitle={t('admin.settings.subtitle')} />

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('admin.settings.general')}</h2>
          <Input
            label={t('admin.settings.appName')}
            value={settings.app_name || ''}
            onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
          />
          <Input
            label={t('admin.settings.tagline')}
            value={settings.app_tagline || ''}
            onChange={(e) => setSettings({ ...settings, app_tagline: e.target.value })}
          />
        </section>

        <section className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('admin.settings.branding')}</h2>
          <p className="text-sm text-muted">{t('admin.settings.logoHint')}</p>
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-24 w-40 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3">
              <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                <Upload size={16} />
                {uploading === 'logo' ? t('common.uploading') : t('admin.settings.uploadLogo')}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'logo')} disabled={!!uploading} />
              </label>
              <Button type="button" variant="ghost" onClick={() => setSettings((prev) => ({ ...prev, app_logo: '' }))}>
                {t('admin.settings.resetLogo')}
              </Button>
            </div>
          </div>
          <Input
            label={t('admin.settings.storeTagline')}
            value={settings.store_tagline || ''}
            onChange={(e) => setSettings({ ...settings, store_tagline: e.target.value })}
            placeholder={t('admin.settings.storeTaglinePlaceholder')}
          />
          <p className="text-sm text-muted">{t('admin.settings.storeTaglineHint')}</p>
        </section>

        <section className="max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('admin.settings.heroSlides')}</h2>
              <p className="text-sm text-muted">{t('admin.settings.heroSlidesHint')}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => setHeroSlides((prev) => [...prev, emptySlide()])}>
              <Plus size={16} /> {t('admin.settings.addSlide')}
            </Button>
          </div>

          <div className="space-y-4">
            {heroSlides.map((slide, index) => (
              <div key={index} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-800">{t('admin.settings.slide')} {index + 1}</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveSlide(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                      <ChevronUp size={18} />
                    </button>
                    <button type="button" onClick={() => moveSlide(index, 1)} disabled={index === heroSlides.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                      <ChevronDown size={18} />
                    </button>
                    <button type="button" onClick={() => setHeroSlides((prev) => prev.filter((_, i) => i !== index))} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
                  <div className="space-y-2">
                    <div className="aspect-[16/10] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {slide.image ? (
                        <img src={getImageUrl(slide.image) || slide.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted">{t('admin.settings.noImage')}</div>
                      )}
                    </div>
                    <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">
                      <Upload size={16} />
                      {uploading === String(index) ? t('common.uploading') : t('admin.settings.uploadSlide')}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, index)} disabled={!!uploading} />
                    </label>
                  </div>
                  <div className="space-y-3">
                    <Input
                      label={t('admin.settings.slideEyebrow')}
                      value={slide.eyebrow || ''}
                      onChange={(e) => setHeroSlides((prev) => prev.map((s, i) => (i === index ? { ...s, eyebrow: e.target.value } : s)))}
                    />
                    <Input
                      label={t('admin.settings.slideTitle')}
                      value={slide.title || ''}
                      onChange={(e) => setHeroSlides((prev) => prev.map((s, i) => (i === index ? { ...s, title: e.target.value } : s)))}
                    />
                    <Textarea
                      label={t('admin.settings.slideSubtitle')}
                      value={slide.subtitle || ''}
                      onChange={(e) => setHeroSlides((prev) => prev.map((s, i) => (i === index ? { ...s, subtitle: e.target.value } : s)))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>{t('common.save')}</Button>
          {saved && <span className="text-sm text-emerald-600">{t('common.success')}</span>}
        </div>
      </form>
    </div>
  );
}
