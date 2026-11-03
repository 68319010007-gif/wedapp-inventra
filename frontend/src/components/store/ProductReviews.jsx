import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import storeApi from '../../services/storeApi';
import { useStoreAuth } from '../../store/StoreAuthContext';
import { useLanguage } from '../../i18n';
import { Button, Alert, Textarea } from '../crud';
import { formatDateTime } from '../../utils/format';

function StarPicker({ value, onChange, size = 22 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="text-amber-400 transition hover:scale-110"
          aria-label={`${n} stars`}
        >
          <Star size={size} fill={n <= value ? 'currentColor' : 'none'} className={n <= value ? '' : 'text-slate-300'} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(rating) ? 'currentColor' : 'none'} className={n <= Math.round(rating) ? '' : 'text-slate-200'} />
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useStoreAuth();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ average: 0, count: 0 });
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      storeApi.get(`/store/products/${productId}/reviews`),
      storeApi.get(`/store/products/${productId}/reviews/eligibility`),
    ])
      .then(([revRes, eligRes]) => {
        setReviews(revRes.data.data.items || []);
        setSummary(revRes.data.data.summary || { average: 0, count: 0 });
        setEligibility(eligRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await storeApi.post(`/store/products/${productId}/reviews`, { rating, comment });
      setComment('');
      setRating(5);
      setSuccess(t('store.reviewSubmitted'));
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('store.reviewSubmitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">{t('common.loading')}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-900">{summary.average || '—'}</p>
          <StarDisplay rating={summary.average} size={16} />
          <p className="mt-1 text-xs text-muted">{summary.count} {t('store.reviewCount')}</p>
        </div>
      </div>

      {eligibility?.canReview && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-slate-900">{t('store.writeReview')}</h3>
          <Alert message={error} />
          {success && <p className="mb-3 text-sm text-emerald-600">{success}</p>}
          <p className="mb-2 text-sm text-muted">{t('store.yourRating')}</p>
          <StarPicker value={rating} onChange={setRating} />
          <Textarea
            label={t('store.reviewComment')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-4"
            placeholder={t('store.reviewCommentPlaceholder')}
          />
          <Button type="submit" loading={submitting} className="mt-4">{t('store.submitReview')}</Button>
        </form>
      )}

      {!eligibility?.canReview && eligibility?.reason === 'login_required' && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-muted">
          <Link to="/login" className="font-medium text-primary hover:underline">{t('store.login')}</Link>
          {' '}{t('store.loginToReview')}
        </p>
      )}

      {!eligibility?.canReview && eligibility?.reason === 'not_purchased' && isAuthenticated && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t('store.purchaseToReview')}</p>
      )}

      {!eligibility?.canReview && eligibility?.reason === 'already_reviewed' && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{t('store.alreadyReviewed')}</p>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
          <Star size={32} className="mx-auto text-slate-300" />
          <p className="mt-3 font-medium text-slate-900">{t('store.noReviewsYet')}</p>
          <p className="mt-1 text-sm text-muted">{t('store.noReviewsHint')}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{r.customerName}</p>
                <p className="text-xs text-muted">{formatDateTime(r.createdAt)}</p>
              </div>
              <div className="mt-1">
                <StarDisplay rating={r.rating} />
              </div>
              {r.comment && <p className="mt-2 text-sm leading-relaxed text-slate-700">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
