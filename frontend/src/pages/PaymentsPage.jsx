import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../i18n';
import { getImageUrl } from '../utils/imageUrl';
import { formatCurrency, formatDateTime } from '../utils/format';
import { PageHeader, LoadingState } from '../components/ui';
import { Modal, Button, Textarea, Alert, Select } from '../components/crud';

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function PaymentsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const statusLabels = {
    PENDING: t('admin.payments.pending'),
    VERIFIED: t('admin.payments.verified'),
    REJECTED: t('admin.payments.rejected'),
  };

  const load = useCallback(() => {
    setLoading(true);
    const q = status ? `?status=${status}` : '';
    api
      .get(`/payments${q}`)
      .then((r) => setItems(r.data.data.items))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (id) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/payments/${id}/verify`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/payments/${rejecting.id}/reject`, { note: reason });
      setRejecting(null);
      setReason('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('admin.payments.title')}
        subtitle={t('admin.payments.subtitle')}
        action={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!mb-0 w-auto">
            <option value="">{t('common.all')}</option>
            <option value="PENDING">{t('admin.payments.pending')}</option>
            <option value="VERIFIED">{t('admin.payments.verified')}</option>
            <option value="REJECTED">{t('admin.payments.rejected')}</option>
          </Select>
        }
      />

      <Alert message={error} />

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-muted shadow-sm">
          {t('admin.payments.noPayments')}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <div key={p.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setPreviewUrl(getImageUrl(p.slipUrl))}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
              >
                <img src={getImageUrl(p.slipUrl)} alt="slip" className="h-full w-full object-cover" />
              </button>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{p.order?.orderNo}</p>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[p.status]}`}>
                    {statusLabels[p.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{p.order?.customer?.name}</p>
                <p className="text-sm font-medium text-primary">{formatCurrency(p.order?.total)}</p>
                <p className="mt-1 text-xs text-muted">{formatDateTime(p.createdAt)}</p>
                {p.status === 'REJECTED' && p.note && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {t('store.paymentRejectedReason')}: {p.note}
                  </p>
                )}
              </div>

              {p.status === 'PENDING' && (
                <div className="flex shrink-0 gap-2">
                  <Button onClick={() => handleVerify(p.id)} loading={saving}>{t('admin.payments.verify')}</Button>
                  <Button variant="danger" onClick={() => { setRejecting(p); setReason(''); }}>{t('admin.payments.reject')}</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={t('admin.payments.reject')} size="sm">
        <Textarea
          label={t('admin.payments.rejectReason')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('admin.payments.rejectPlaceholder')}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRejecting(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleReject} loading={saving}>{t('admin.payments.reject')}</Button>
        </div>
      </Modal>

      <Modal open={!!previewUrl} onClose={() => setPreviewUrl(null)} title={t('admin.payments.viewSlip')}>
        {previewUrl && <img src={previewUrl} alt="slip preview" className="w-full rounded-xl object-contain" />}
      </Modal>
    </div>
  );
}
