import { useState } from 'react';
import { useStoreAuth } from '../../store/StoreAuthContext';
import { useLanguage } from '../../i18n';
import storeApi from '../../services/storeApi';
import { AvatarUpload } from '../../components/Avatar';
import { PageHeader } from '../../components/ui';
import { Input, Textarea, Button, Alert } from '../../components/crud';

export default function StoreProfilePage() {
  const { customer, updateProfile, updatePassword } = useStoreAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    avatar: customer?.avatar || '',
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
      const res = await storeApi.post('/store/auth/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data.url;
      setForm((f) => ({ ...f, avatar: url }));
      await updateProfile({ ...form, avatar: url });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateProfile(form);
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
      await updatePassword(pw.currentPassword, pw.newPassword);
      setPw({ currentPassword: '', newPassword: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AvatarUpload
          src={form.avatar}
          name={form.name}
          onUpload={handleAvatar}
          uploading={uploading}
          label={t('profile.uploadAvatar')}
        />

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <Alert message={error} />
          {saved && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{t('profile.saved')}</div>}
          <Input label={t('auth.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('auth.email')} value={customer?.email || ''} disabled />
          <Input label={t('auth.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Textarea label={t('auth.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Button type="submit" loading={saving}>{t('common.save')}</Button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
