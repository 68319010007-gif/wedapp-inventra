import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useStoreAuth } from '../../store/StoreAuthContext';
import { useLanguage } from '../../i18n';
import { LanguageSwitcherLight } from '../../components/LanguageSwitcher';
import { Input, Button, Alert } from '../../components/crud';

export default function StoreRegisterPage() {
  const { register, isAuthenticated } = useStoreAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy">{t('store.register')}</h1>
          <LanguageSwitcherLight />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert message={error} />
          <Input label={t('auth.name')} value={form.name} onChange={set('name')} required />
          <Input label={t('auth.email')} type="email" value={form.email} onChange={set('email')} required />
          <Input label={t('auth.phone')} value={form.phone} onChange={set('phone')} required />
          <Input label={t('auth.password')} type="password" value={form.password} onChange={set('password')} required />
          <Input label={t('auth.address')} value={form.address} onChange={set('address')} />
          <Button type="submit" loading={loading} className="w-full">{t('auth.signUp')}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {t('store.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">{t('store.login')}</Link>
        </p>
      </div>
    </div>
  );
}
