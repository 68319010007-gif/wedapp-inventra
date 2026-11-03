import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStoreAuth } from '../../store/StoreAuthContext';
import { useLanguage } from '../../i18n';
import { LanguageSwitcherLight } from '../../components/LanguageSwitcher';
import { Input, Button, Alert } from '../../components/crud';
import BrandLogo from '../../components/BrandLogo';

export default function StoreLoginPage() {
  const { login, isAuthenticated } = useStoreAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col gap-4">
          <BrandLogo imageClassName="h-12 w-auto" showText={false} />
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-navy">{t('store.login')}</h1>
            <LanguageSwitcherLight />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert message={error} />
          <Input label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" loading={loading} className="w-full">{t('auth.signIn')}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {t('store.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">{t('store.register')}</Link>
        </p>
      </div>
    </div>
  );
}
