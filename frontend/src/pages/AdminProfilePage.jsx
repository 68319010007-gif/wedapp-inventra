import { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useLanguage } from '../i18n';
import api from '../services/api';
import { AvatarUpload } from '../components/Avatar';
import { PageHeader } from '../components/ui';
import { Input, Button, Alert } from '../components/crud';

export default function AdminProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data.url;
      setForm((f) => ({ ...f, avatar: url }));
      await api.put('/auth/profile', { ...form, avatar: url });
      refreshUser();
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/auth/profile', form);
      refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/auth/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AvatarUpload src={form.avatar} name={form.name} onUpload={handleAvatar} uploading={uploading} label={t('profile.uploadAvatar')} />

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <Alert message={error} />
          {saved && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{t('profile.saved')}</div>}
          <Input label={t('auth.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('auth.email')} value={user?.email || ''} disabled />
          <Input label={t('auth.phone')} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <p className="text-xs text-muted">{t('profile.adminOnly')}</p>
          <Button type="submit" loading={saving}>{t('common.save')}</Button>
        </form>
      </div>

      <div className="mt-6 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">{t('auth.changePassword')}</h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <Input label={t('auth.currentPassword')} type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
          <Input label={t('auth.newPassword')} type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
          <Button type="submit" variant="secondary" loading={saving}>{t('auth.changePassword')}</Button>
        </form>
      </div>
    </div>
  );
}
