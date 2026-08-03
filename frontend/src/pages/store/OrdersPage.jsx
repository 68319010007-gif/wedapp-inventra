import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, X, Upload } from 'lucide-react';
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

  useEffect(() => { load(); }, [load]);

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

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">{t('store.myOrders')}</h1>
      <Alert message={error} />

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
                    <Button onClick={() => setPayingOrderId(order.id)}>
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

      <Modal open={!!payingOrderId} onClose={() => { setPayingOrderId(null); setSlipFile(null); }} title={t('store.notifyPayment')} size="sm">
        <p className="mb-4 text-sm text-muted">{t('store.uploadSlipHint')}</p>
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
          <Button variant="ghost" onClick={() => { setPayingOrderId(null); setSlipFile(null); }}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmitPayment} loading={uploadingSlip} disabled={!slipFile}>{t('store.submitPayment')}</Button>
        </div>
      </Modal>
    </div>
  );
}