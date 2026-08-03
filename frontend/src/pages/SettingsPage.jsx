import { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader, LoadingState } from '../components/ui';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setSettings(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await api.put('/settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration and branding" />

      <form onSubmit={handleSave} className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">App Name</label>
          <input
            value={settings.app_name || ''}
            onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tagline</label>
          <input
            value={settings.app_tagline || ''}
            onChange={(e) => setSettings({ ...settings, app_tagline: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary"
          />
        </div>
        <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
          Save Settings
        </button>
        {saved && <span className="ml-3 text-sm text-emerald-600">Saved!</span>}
      </form>
    </div>
  );
}
