import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, X, Upload, Copy, Check, ZoomIn, ZoomOut } from 'lucide-react';
import storeApi from '../../services/storeApi';
import { getImageUrl, getProductPlaceholder } from '../../utils/imageUrl';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { LoadingState } from '../../components/ui';
import { Button, ConfirmDialog, Alert, Modal } from '../../components/crud';
import { useLanguage } from '../../i18n';

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPING: 'bg-cyan-100 text-cyan-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const paymentStyles = {
  PENDING: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const cancellableStatuses = ['PENDING', 'PROCESSING'];

function formatOrderDateTime(val) {
  if (!val) return '-';
  return new Date(val).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrZoom, setQrZoom] = useState(1);

  const statusLabels = {
    PENDING: t('store.statusPending'),
    PROCESSING: t('store.statusProcessing'),
    SHIPPING: t('store.statusShipping'),
    COMPLETED: t('store.statusCompleted'),
    CANCELLED: t('store.statusCancelled'),
  };

  const paymentLabels = {
    PENDING: t('store.paymentPending'),
    VERIFIED: t('store.paymentVerified'),
    REJECTED: t('store.paymentRejected'),
  };

  const load = useCallback(() => {
    setLoading(true);
    storeApi
      .get('/store/orders')
      .then((res) => setOrders(res.data.data.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!payingOrderId) return;
    setChannelsLoading(true);
    storeApi
      .get('/payment-channels/public')
      .then((res) => setChannels(res.data.data.items || []))
      .catch(() => setChannels([]))
      .finally(() => setChannelsLoading(false));
  }, [payingOrderId]);

  const handleCancel = async () => {
    setCancelling(true);
    setError('');
    try {
      await storeApi.patch(`/store/orders/${cancelId}/cancel`);
      setCancelId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('store.cannotCancel'));
      setCancelId(null);
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!slipFile || !payingOrderId) return;
    setUploadingSlip(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('slip', slipFile);
      await storeApi.post(`/store/orders/${payingOrderId}/payment`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPayingOrderId(null);
      setSlipFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingSlip(false);
    }
  };

  const copyAccount = async (ch) => {
    try {
      await navigator.clipboard.writeText(ch.accountNumber);
      setCopiedId(ch.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const closePayModal = () => {
    setPayingOrderId(null);
    setSlipFile(null);
    setQrPreview(null);
    setQrZoom(1);
  };

  const openQrPreview = (url, name) => {
    setQrZoom(1);
    setQrPreview({ url, name });
  };

  const payingOrder = orders.find((o) => o.id === payingOrderId) || null;

  if (loading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-slate-900">{t('store.myOrders')}</h1>
      <Alert message={error && !payingOrderId ? error : ''} />

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
          <Package size={40} className="mx-auto text-slate-300" />
          <p className="mt-4 text-muted">{t('store.noOrders')}</p>
          <Link to="/shop" className="mt-6 inline-block">
            <Button>{t('store.continueShopping')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="font-semibold text-slate-900">{t('store.orderNo')}: {order.orderNo}</p>
                  <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[order.status] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                  {order.payment && (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${paymentStyles[order.payment.status]}`}>
                      {t('store.payment')}: {paymentLabels[order.payment.status]}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <img
                      src={item.product?.image ? getImageUrl(item.product.image) : getProductPlaceholder(item.product?.name)}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{item.product?.name}</p>
                      <p className="text-xs text-muted">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <p className="font-medium text-slate-700">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>

              {order.payment?.status === 'REJECTED' && order.payment.note && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {t('store.paymentRejectedReason')}: {order.payment.note}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="font-semibold text-primary">{t('store.total')}: {formatCurrency(order.total)}</p>
                <div className="flex flex-wrap gap-2">
                  {order.status !== 'CANCELLED' && (!order.payment || order.payment.status === 'REJECTED') && (
                    <Button onClick={() => { setError(''); setPayingOrderId(order.id); }}>
                      <Upload size={14} /> {t('store.notifyPayment')}
                    </Button>
                  )}
                  {cancellableStatuses.includes(order.status) && (
                    <Button variant="danger" onClick={() => setCancelId(order.id)}>
                      <X size={14} /> {t('store.cancelOrder')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title={t('store.cancelOrder')}
        message={t('store.cancelOrderConfirm')}
        confirmText={t('store.cancelOrder')}
        loading={cancelling}
      />

      <Modal open={!!payingOrderId} onClose={closePayModal} title={t('store.notifyPayment')} size="lg">
        <Alert message={error} />
        <p className="mb-4 text-sm text-muted">{t('store.uploadSlipHint')}</p>

        <div className="mb-5">
          <h4 className="mb-2 text-sm font-semibold text-slate-900">{t('store.payTo')}</h4>
          {channelsLoading ? (
            <p className="text-sm text-muted">{t('common.loading')}</p>
          ) : channels.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{t('store.noPaymentChannels')}</p>
          ) : (
            <div className="space-y-3">
              {channels.map((ch) => (
                <div key={ch.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">{ch.name}</p>
                  {ch.bankName && <p className="text-xs text-muted">{ch.bankName}</p>}
                  <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    {ch.qrImageUrl && (
                      <button
                        type="button"
                        onClick={() => openQrPreview(getImageUrl(ch.qrImageUrl), ch.name)}
                        className="group relative shrink-0 rounded-xl border border-white bg-white p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        title={t('store.zoomQr')}
                      >
                        <img
                          src={getImageUrl(ch.qrImageUrl)}
                          alt={`QR ${ch.name}`}
                          className="h-56 w-56 object-contain sm:h-64 sm:w-64"
                        />
                        <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-lg bg-navy/75 px-2 py-1 text-xs text-white opacity-90 group-hover:opacity-100">
                          <ZoomIn size={14} /> {t('store.zoomQr')}
                        </span>
                      </button>
                    )}
                    <div className="min-w-0 flex-1 space-y-1 text-sm sm:pt-1">
                      <p>
                        <span className="text-muted">{t('store.accountName')}: </span>
                        {ch.accountName}
                      </p>
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-muted">{t('store.accountNumber')}: </span>
                        <span className="font-mono font-semibold tracking-wide">{ch.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyAccount(ch)}
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs text-primary shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                          {copiedId === ch.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === ch.id ? t('store.copied') : t('store.copyAccount')}
                        </button>
                      </p>
                      {ch.note && <p className="text-xs text-muted">{ch.note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {payingOrder && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p>
              <span className="text-muted">{t('store.orderNo')}: </span>
              <span className="font-semibold text-slate-900">{payingOrder.orderNo}</span>
            </p>
            <p className="mt-1">
              <span className="text-muted">{t('store.orderDateTime')}: </span>
              <span className="font-medium text-slate-800">{formatOrderDateTime(payingOrder.createdAt)}</span>
            </p>
            <p className="mt-1">
              <span className="text-muted">{t('store.total')}: </span>
              <span className="font-semibold text-primary">{formatCurrency(payingOrder.total)}</span>
            </p>
          </div>
        )}

        <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-muted hover:border-primary hover:text-primary">
          {slipFile ? (
            <img src={URL.createObjectURL(slipFile)} alt="slip preview" className="h-full w-full rounded-xl object-contain p-2" />
          ) : (
            <>
              <Upload size={22} />
              <span className="text-sm">{t('admin.products.addImage')}</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={closePayModal}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmitPayment} loading={uploadingSlip} disabled={!slipFile}>{t('store.submitPayment')}</Button>
        </div>
      </Modal>

      {qrPreview && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-navy/90"
          role="dialog"
          aria-modal="true"
          aria-label={t('store.zoomQr')}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="truncate text-sm font-medium">{qrPreview.name}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                onClick={() => setQrZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                aria-label="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="min-w-[3rem] text-center text-xs tabular-nums">{Math.round(qrZoom * 100)}%</span>
              <button
                type="button"
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                onClick={() => setQrZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                aria-label="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
              <button
                type="button"
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                onClick={() => { setQrPreview(null); setQrZoom(1); }}
                aria-label={t('common.cancel')}
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div
            className="flex flex-1 items-center justify-center overflow-auto p-4"
            onClick={() => { setQrPreview(null); setQrZoom(1); }}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.15 : 0.15;
              setQrZoom((z) => Math.min(3, Math.max(1, Number((z + delta).toFixed(2)))));
            }}
          >
            <img
              src={qrPreview.url}
              alt={`QR ${qrPreview.name}`}
              className="max-h-none origin-center rounded-xl bg-white object-contain p-3 shadow-2xl transition-transform"
              style={{ width: `${Math.round(280 * qrZoom)}px`, height: `${Math.round(280 * qrZoom)}px` }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="pb-4 text-center text-xs text-white/70">{t('store.zoomQrHint')}</p>
        </div>
      )}
    </div>
  );
}
