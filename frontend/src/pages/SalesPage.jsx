import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import { PageHeader, DataTable, StatusBadge, LoadingState } from '../components/ui';
import { Modal, Button, Input, Select, Textarea, ConfirmDialog, ActionButtons, Alert, SearchBar } from '../components/crud';
import { formatCurrency, formatDate } from '../utils/format';

const emptyItem = { productId: '', quantity: 1, unitPrice: '' };

export default function SalesPage() {
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

  useEffect(() => { load(); }, [load]);

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
  };

  const columns = [
    { key: 'orderNo', label: 'Order No' },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.name },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total', label: 'Total', render: (r) => formatCurrency(r.total) },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt) },
    { key: 'actions', label: 'Actions', render: (r) => (
      <ActionButtons
        onDelete={() => setDeleteId(r.id)}
        extra={
          <Select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className="!mb-0 w-auto text-xs">
            {['PENDING', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        }
      />
    )},
  ];

  return (
    <div>
      <PageHeader title="Sales Orders" subtitle="Manage orders" action={
        <div className="flex gap-3">
          <SearchBar value={search} onChange={setSearch} />
          <Button onClick={openCreate}><Plus size={16} /> New Order</Button>
        </div>
      } />
      {loading ? <LoadingState /> : <DataTable columns={columns} data={items} />}

      <Modal open={!!modal} onClose={() => setModal(null)} title="Create Sales Order" size="xl">
        <form onSubmit={handleSave}>
          <Alert message={error} />
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <Select label="Customer *" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['PENDING', 'PROCESSING', 'SHIPPING', 'COMPLETED'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Discount" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
            <Textarea label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="sm:col-span-2" />
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Order Items</h3>
            <Button type="button" variant="secondary" onClick={addLine}><Plus size={14} /> Add Line</Button>
          </div>
          {form.orderItems.map((line, i) => (
            <div key={i} className="mb-3 grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
              <Select value={line.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)} required>
                <option value="">Product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} placeholder="Qty" />
              <Input type="number" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(i, 'unitPrice', e.target.value)} placeholder="Price" />
              <button type="button" onClick={() => removeLine(i)} className="flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Order</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => {
        setSaving(true);
        await api.delete(`/sales/orders/${deleteId}`);
        setDeleteId(null);
        load();
        setSaving(false);
      }} title="Delete Order" message="Delete this order?" loading={saving} />
    </div>
  );
}
