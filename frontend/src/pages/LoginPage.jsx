import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useLanguage } from '../i18n';
import BrandLogo from '../components/BrandLogo';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('admin@inventra.com');
  const [password, setPassword] = useState('Admin@1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo
            variant="admin"
            imageClassName="h-16 w-auto"
            showSubtitle={false}
            className="flex-col items-center gap-3"
            textClassName="text-2xl font-bold text-navy"
          />
          <p className="mt-2 text-sm text-muted">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <a href="/" className="text-primary hover:underline">{t('auth.backToStore')}</a>
        </p>
      </div>
    </div>
  );
}

