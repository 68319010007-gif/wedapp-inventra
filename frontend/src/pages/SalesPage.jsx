import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Eye, Package, MapPin, User, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n';
import { getImageUrl, getProductPlaceholder } from '../utils/imageUrl';
import { parseOrderNote, getProductImage, getShippingDetailRows } from '../utils/orderNote';
import { PageHeader, DataTable, StatusBadge, LoadingState } from '../components/ui';
import { Modal, Button, Input, Select, Textarea, ConfirmDialog, ActionButtons, Alert, SearchBar } from '../components/crud';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';

const emptyItem = { productId: '', quantity: 1, unitPrice: '' };

const paymentStyles = {
  PENDING: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function SalesPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ customerId: '', discount: 0, note: '', status: 'PENDING', orderItems: [{ ...emptyItem }] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    Promise.all([
      api.get(`/sales/orders${q}`),
      api.get('/customers?limit=100'),
      api.get('/products?limit=100'),
    ])
      .then(([orders, cust, prod]) => {
        setItems(orders.data.data.items);
        setCustomers(cust.data.data.items);
        setProducts(prod.data.data.items);
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!viewId) {
      setViewOrder(null);
      return;
    }
    setViewLoading(true);
    api
      .get(`/sales/orders/${viewId}`)
      .then((res) => setViewOrder(res.data.data))
      .catch(() => setViewOrder(null))
      .finally(() => setViewLoading(false));
  }, [viewId]);

  const openCreate = () => {
    setForm({ customerId: '', discount: 0, note: '', status: 'PENDING', orderItems: [{ ...emptyItem }] });
    setError('');
    setModal('create');
  };

  const addLine = () => setForm({ ...form, orderItems: [...form.orderItems, { ...emptyItem }] });
  const removeLine = (i) => setForm({ ...form, orderItems: form.orderItems.filter((_, idx) => idx !== i) });
  const updateLine = (i, field, val) => {
    const orderItems = [...form.orderItems];
    orderItems[i] = { ...orderItems[i], [field]: val };
    if (field === 'productId') {
      const p = products.find((x) => x.id === val);
      if (p) orderItems[i].unitPrice = Number(p.sellPrice);
    }
    setForm({ ...form, orderItems });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        customerId: form.customerId,
        discount: Number(form.discount),
        note: form.note,
        status: form.status,
        items: form.orderItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      };
      await api.post('/sales/orders', payload);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/sales/orders/${id}/status`, { status });
    load();
    if (viewId === id) {
      setViewOrder((prev) => (prev ? { ...prev, status } : prev));
    }
  };

  const parsedView = viewOrder ? parseOrderNote(viewOrder.note) : null;
  const shippingRows = parsedView?.shipping ? getShippingDetailRows(parsedView.shipping, t) : [];

  const columns = [
    { key: 'orderNo', label: t('store.orderNo') },
    { key: 'customer', label: t('nav.customers'), render: (r) => r.customer?.name },
    {
      key: 'items',
      label: t('admin.sales.itemCount'),
      render: (r) => `${r.items?.length || 0} ${t('store.products')}`,
    },
    { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total', label: t('store.total'), render: (r) => formatCurrency(r.total) },
    { key: 'date', label: t('store.orderDate'), render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (r) => (
        <ActionButtons
          onDelete={() => setDeleteId(r.id)}
          extra={
            <>
              <button
                type="button"
                onClick={() => setViewId(r.id)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-blue-50"
              >
                <Eye size={14} /> {t('admin.sales.viewDetail')}
              </button>
              <Select
                value={r.status}
                onChange={(e) => updateStatus(r.id, e.target.value)}
                className="!mb-0 w-auto text-xs"
              >
                {['PENDING', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </>
          }
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('admin.sales.title')}
        subtitle={t('admin.sales.subtitle')}
        action={
          <div className="flex gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
            <Button onClick={openCreate}><Plus size={16} /> {t('admin.sales.newOrder')}</Button>
          </div>
        }
      />
      {loading ? <LoadingState /> : <DataTable columns={columns} data={items} emptyMessage={t('common.noData')} />}

      <Modal open={!!viewId} onClose={() => setViewId(null)} title={t('admin.sales.orderDetail')} size="xl">
        {viewLoading ? (
          <LoadingState />
        ) : !viewOrder ? (
          <p className="text-sm text-muted">{t('common.noData')}</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{viewOrder.orderNo}</p>
                <p className="text-sm text-muted">{formatDateTime(viewOrder.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={viewOrder.status} />
                {viewOrder.payment && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStyles[viewOrder.payment.status] || ''}`}>
                    {t('store.payment')}: {viewOrder.payment.status}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <User size={16} /> {t('admin.sales.customerInfo')}
                </h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted">{t('common.name')}: </span>{viewOrder.customer?.name}</p>
                  <p className="flex items-center gap-1">
                    <Mail size={14} className="text-muted" />
                    {viewOrder.customer?.email || '-'}
                  </p>
                  <p className="flex items-center gap-1">
                    <Phone size={14} className="text-muted" />
                    {viewOrder.customer?.phone || '-'}
                  </p>
                  {viewOrder.customer?.code && (
                    <p><span className="text-muted">{t('admin.sales.customerCode')}: </span>{viewOrder.customer.code}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MapPin size={16} /> {t('admin.sales.shippingInfo')}
              </h3>
              {shippingRows.length > 0 ? (
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  {shippingRows.map(([label, value]) => (
                    <div key={label} className={label === t('auth.address') || label === t('account.pinLocation') ? 'sm:col-span-2 lg:col-span-3' : ''}>
                      <dt className="text-muted">{label}</dt>
                      <dd className="mt-0.5 font-medium text-slate-900 whitespace-pre-wrap">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted">{t('admin.sales.noShippingInfo')}</p>
              )}
            </div>

            {parsedView?.customerNote && (
              <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                <p className="mb-1 font-medium text-slate-900">{t('store.orderNotes')}</p>
                <p className="whitespace-pre-wrap text-muted">{parsedView.customerNote}</p>
              </div>
            )}

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Package size={16} /> {t('admin.sales.orderItems')}
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3">{t('nav.products')}</th>
                      <th className="px-4 py-3">{t('store.quantity')}</th>
                      <th className="px-4 py-3">{t('admin.sales.unitPrice')}</th>
                      <th className="px-4 py-3 text-right">{t('store.total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewOrder.items || []).map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={getImageUrl(getProductImage(line.product)) || getProductPlaceholder(line.product?.name)}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium text-slate-900">{line.product?.name}</p>
                              <p className="text-xs text-muted">SKU: {line.product?.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{line.quantity}</td>
                        <td className="px-4 py-3">{formatCurrency(line.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(line.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted">{t('store.subtotal')}</span>
                <span>{formatCurrency(viewOrder.subtotal)}</span>
              </div>
              {Number(viewOrder.discount) > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-muted">{t('store.discount')}</span>
                  <span>-{formatCurrency(viewOrder.discount)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                <span>{t('store.total')}</span>
                <span className="text-primary">{formatCurrency(viewOrder.total)}</span>
              </div>
            </div>

            {viewOrder.payment?.slipUrl && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-900">{t('admin.payments.viewSlip')}</p>
                <a href={getImageUrl(viewOrder.payment.slipUrl)} target="_blank" rel="noreferrer">
                  <img
                    src={getImageUrl(viewOrder.payment.slipUrl)}
                    alt="payment slip"
                    className="max-h-48 rounded-xl border border-slate-200 object-contain"
                  />
                </a>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Select
                label={t('common.status')}
                value={viewOrder.status}
                onChange={(e) => updateStatus(viewOrder.id, e.target.value)}
                className="!mb-0 w-auto min-w-[160px]"
              >
                {['PENDING', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Button variant="ghost" onClick={() => setViewId(null)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!modal} onClose={() => setModal(null)} title={t('admin.sales.newOrder')} size="xl">
        <form onSubmit={handleSave}>
          <Alert message={error} />
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <Select label={`${t('nav.customers')} *`} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
              <option value="">{t('admin.sales.selectCustomer')}</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
            <Select label={t('common.status')} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['PENDING', 'PROCESSING', 'SHIPPING', 'COMPLETED'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label={t('store.discount')} type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
            <Textarea label={t('common.note')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="sm:col-span-2" />
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">{t('admin.sales.orderItems')}</h3>
            <Button type="button" variant="secondary" onClick={addLine}><Plus size={14} /> {t('common.add')}</Button>
          </div>
          {form.orderItems.map((line, i) => (
            <div key={i} className="mb-3 grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
              <Select value={line.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)} required>
                <option value="">{t('nav.products')}</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} placeholder={t('store.quantity')} />
              <Input type="number" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(i, 'unitPrice', e.target.value)} placeholder={t('admin.sales.unitPrice')} />
              <button type="button" onClick={() => removeLine(i)} className="flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={saving}>{t('admin.sales.newOrder')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          setSaving(true);
          await api.delete(`/sales/orders/${deleteId}`);
          setDeleteId(null);
          if (viewId === deleteId) setViewId(null);
          load();
          setSaving(false);
        }}
        title={t('admin.sales.title')}
        message={t('common.confirmDelete')}
        loading={saving}
      />
    </div>
  );
}
