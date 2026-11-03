import { useCallback, useEffect, useState } from 'react';
import { Plus, QrCode, Copy, Check } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n';
import { getImageUrl } from '../utils/imageUrl';
import { PageHeader, LoadingState } from '../components/ui';
import { Modal, Button, Input, Textarea, ConfirmDialog, Alert } from '../components/crud';

const empty = {
  name: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
  qrImageUrl: '',
  note: '',
  isActive: true,
  sortOrder: 0,
};

export default function PaymentChannelsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/payment-channels')
      .then((r) => setItems(r.data.data.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(empty);
    setError('');
    setModal('create');
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      bankName: row.bankName || '',
      accountName: row.accountName,
      accountNumber: row.accountNumber,
      qrImageUrl: row.qrImageUrl || '',
      note: row.note || '',
      isActive: row.isActive,
      sortOrder: row.sortOrder ?? 0,
    });
    setError('');
    setModal({ type: 'edit', id: row.id });
  };

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [k]: value }));
  };

  const handleUploadQr = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, qrImageUrl: res.data.data.url }));
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (modal === 'create') await api.post('/payment-channels', payload);
      else await api.put(`/payment-channels/${modal.id}`, payload);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    await api.patch(`/payment-channels/${id}/toggle`);
    load();
  };

  const copyAccount = async (row) => {
    try {
      await navigator.clipboard.writeText(row.accountNumber);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <PageHeader
        title={t('admin.paymentChannels.title')}
        subtitle={t('admin.paymentChannels.subtitle')}
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> {t('admin.paymentChannels.add')}
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-muted">
          {t('admin.paymentChannels.empty')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((ch) => (
            <div
              key={ch.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${ch.isActive ? 'border-slate-200' : 'border-slate-100 opacity-70'}`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-navy">{ch.name}</h3>
                  {ch.bankName && <p className="text-sm text-muted">{ch.bankName}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ch.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {ch.isActive ? t('common.active') : t('common.inactive')}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted">{t('admin.paymentChannels.accountName')}: </span>
                  {ch.accountName}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-muted">{t('admin.paymentChannels.accountNumber')}: </span>
                  <span className="font-mono font-medium tracking-wide">{ch.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => copyAccount(ch)}
                    className="rounded p-1 text-muted hover:bg-slate-100 hover:text-primary"
                    title={t('admin.paymentChannels.copy')}
                  >
                    {copiedId === ch.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </p>
                {ch.note && <p className="text-muted">{ch.note}</p>}
              </div>

              {ch.qrImageUrl ? (
                <div className="mt-4 flex justify-center rounded-xl bg-slate-50 p-3">
                  <img
                    src={getImageUrl(ch.qrImageUrl)}
                    alt={`QR ${ch.name}`}
                    className="h-36 w-36 object-contain"
                  />
                </div>
              ) : (
                <div className="mt-4 flex h-24 items-center justify-center gap-2 rounded-xl bg-slate-50 text-sm text-muted">
                  <QrCode size={18} /> {t('admin.paymentChannels.noQr')}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button variant="ghost" type="button" onClick={() => openEdit(ch)}>
                  {t('common.edit')}
                </Button>
                <Button variant="ghost" type="button" onClick={() => handleToggle(ch.id)}>
                  {ch.isActive ? t('admin.paymentChannels.disable') : t('admin.paymentChannels.enable')}
                </Button>
                <Button variant="danger" type="button" onClick={() => setDeleteId(ch.id)}>
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'create' ? t('admin.paymentChannels.add') : t('admin.paymentChannels.edit')}
      >
        <form onSubmit={handleSave}>
          <Alert message={error} />
          <Input
            label={`${t('admin.paymentChannels.name')} *`}
            value={form.name}
            onChange={set('name')}
            required
            className="mb-3"
            placeholder={t('admin.paymentChannels.namePlaceholder')}
          />
          <Input
            label={t('admin.paymentChannels.bankName')}
            value={form.bankName}
            onChange={set('bankName')}
            className="mb-3"
            placeholder={t('admin.paymentChannels.bankPlaceholder')}
          />
          <Input
            label={`${t('admin.paymentChannels.accountName')} *`}
            value={form.accountName}
            onChange={set('accountName')}
            required
            className="mb-3"
          />
          <Input
            label={`${t('admin.paymentChannels.accountNumber')} *`}
            value={form.accountNumber}
            onChange={set('accountNumber')}
            required
            className="mb-3"
          />
          <Input
            label={t('admin.paymentChannels.sortOrder')}
            type="number"
            value={form.sortOrder}
            onChange={set('sortOrder')}
            className="mb-3"
          />
          <Textarea
            label={t('common.note')}
            value={form.note}
            onChange={set('note')}
            className="mb-3"
          />

          <div className="mb-3">
            <p className="mb-2 text-sm font-medium text-navy">{t('admin.paymentChannels.qrCode')}</p>
            {form.qrImageUrl ? (
              <div className="mb-2 flex items-center gap-3">
                <img
                  src={getImageUrl(form.qrImageUrl)}
                  alt="QR preview"
                  className="h-28 w-28 rounded-lg border border-slate-200 object-contain bg-white p-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setForm((prev) => ({ ...prev, qrImageUrl: '' }))}
                >
                  {t('admin.paymentChannels.removeQr')}
                </Button>
              </div>
            ) : null}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-muted hover:border-primary hover:text-primary">
              <QrCode size={16} />
              {uploading ? t('common.loading') : t('admin.paymentChannels.uploadQr')}
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadQr} disabled={uploading} />
            </label>
          </div>

          <label className="mb-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
            {t('admin.paymentChannels.showToCustomers')}
          </label>

          <div className="mt-2 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          setSaving(true);
          try {
            await api.delete(`/payment-channels/${deleteId}`);
            setDeleteId(null);
            load();
          } finally {
            setSaving(false);
          }
        }}
        title={t('admin.paymentChannels.title')}
        message={t('common.confirmDelete')}
        loading={saving}
      />
    </div>
  );
}
