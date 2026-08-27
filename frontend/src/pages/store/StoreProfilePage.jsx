import { useState } from 'react';
import { useStoreAuth } from '../../store/StoreAuthContext';
import { useLanguage } from '../../i18n';
import storeApi from '../../services/storeApi';
import { AvatarUpload } from '../../components/Avatar';
import { Input, Button, Alert } from '../../components/crud';

export default function StoreProfilePage() {
  const { customer, updateProfile, updatePassword } = useStoreAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    taxId: customer?.taxId || '',
    avatar: customer?.avatar || '',
    marketingConsent: !!customer?.marketingConsent,
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await storeApi.post('/store/auth/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.data.url;
      setForm((f) => ({ ...f, avatar: url }));
      await updateProfile({ ...form, avatar: url });
      flashSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
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
      flashSaved();
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
      flashSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">{t('account.editProfile')}</h2>

        <AvatarUpload
          src={form.avatar}
          name={form.name}
          onUpload={handleAvatar}
          uploading={uploading}
          label={t('profile.uploadAvatar')}
        />

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <Alert message={error} />
          {saved && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              {t('profile.saved')}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('auth.name')}
              value={form.name}
              onChange={set('name')}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('auth.email')}</label>
              <div className="flex gap-2">
                <input
                  value={customer?.email || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-muted"
                />
                <span className="inline-flex shrink-0 items-center rounded-xl bg-primary/10 px-3 text-xs font-medium text-primary">
                  {t('account.verified')}
                </span>
              </div>
            </div>
            <Input
              label={t('auth.phone')}
              value={form.phone}
              onChange={set('phone')}
            />
            <Input
              label={t('account.memberCode')}
              value={customer?.code || ''}
              disabled
            />
            <Input
              label={t('account.taxId')}
              value={form.taxId}
              onChange={set('taxId')}
              className="sm:col-span-2"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={set('marketingConsent')}
              className="mt-1"
            />
            <span>{t('account.marketingConsent')}</span>
          </label>

          <p className="text-xs text-muted">
            <a href="#" className="text-primary hover:underline" onClick={(e) => e.preventDefault()}>
              {t('account.privacyPolicy')}
            </a>
          </p>

          <Button type="submit" loading={saving}>{t('common.save')}</Button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">{t('auth.changePassword')}</h2>
        <form onSubmit={handlePassword} className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('auth.currentPassword')}
            type="password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required
          />
          <Input
            label={t('auth.newPassword')}
            type="password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            required
          />
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" loading={saving}>
              {t('auth.changePassword')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
