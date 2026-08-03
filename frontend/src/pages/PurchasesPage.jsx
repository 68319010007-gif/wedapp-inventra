import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import { PageHeader, DataTable, StatusBadge, LoadingState } from '../components/ui';
import { Modal, Button, Input, Select, Textarea, ConfirmDialog, ActionButtons, Alert } from '../components/crud';
import { formatCurrency, formatDate } from '../utils/format';

const emptyLine = { productId: '', quantity: 1, unitCost: '' };

export default function PurchasesPage() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ supplierId: '', note: '', lines: [{ ...emptyLine }] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/purchases'),
      api.get('/suppliers?limit=100'),
      api.get('/products?limit=100'),
    ])
      .then(([po, sup, prod]) => {
        setItems(po.data.data.items);
        setSuppliers(sup.data.data.items);
        setProducts(prod.data.data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateLine = (i, field, val) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [field]: val };
    if (field === 'productId') {
      const p = products.find((x) => x.id === val);
      if (p) lines[i].unitCost = Number(p.costPrice);
    }
    setForm({ ...form, lines });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/purchases', {
        supplierId: form.supplierId,
        note: form.note,
        items: form.lines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitCost: Number(l.unitCost),
        })),
      });
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const receivePO = async (id) => {
    await api.patch(`/purchases/${id}/receive`);
    load();
  };

  const columns = [
    { key: 'poNo', label: 'PO No' },
    { key: 'supplier', label: 'Supplier', render: (r) => r.supplier?.name },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total', label: 'Total', render: (r) => formatCurrency(r.total) },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt) },
    { key: 'actions', label: 'Actions', render: (r) => (
      <ActionButtons
        onDelete={r.status !== 'RECEIVED' ? () => setDeleteId(r.id) : undefined}
        extra={r.status !== 'RECEIVED' && (
          <button onClick={() => receivePO(r.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
            Receive
          </button>
        )}
      />
    )},
  ];

  return (
    <div>
      <PageHeader title="Purchases" subtitle="Purchase orders and receiving" action={
        <Button onClick={() => { setForm({ supplierId: '', note: '', lines: [{ ...emptyLine }] }); setError(''); setModal(true); }}>
          <Plus size={16} /> New PO
        </Button>
      } />
      {loading ? <LoadingState /> : <DataTable columns={columns} data={items} />}

      <Modal open={modal} onClose={() => setModal(false)} title="Create Purchase Order" size="xl">
        <form onSubmit={handleSave}>
          <Alert message={error} />
          <Select label="Supplier *" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required className="mb-4">
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Textarea label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mb-4" />

          <div className="mb-2 flex justify-between">
            <h3 className="font-medium">Items</h3>
            <Button type="button" variant="secondary" onClick={() => setForm({ ...form, lines: [...form.lines, { ...emptyLine }] })}>
              <Plus size={14} /> Add
            </Button>
          </div>
          {form.lines.map((line, i) => (
            <div key={i} className="mb-3 grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
              <Select value={line.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)} required>
                <option value="">Product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} placeholder="Qty" />
              <Input type="number" step="0.01" value={line.unitCost} onChange={(e) => updateLine(i, 'unitCost', e.target.value)} placeholder="Cost" />
              <button type="button" onClick={() => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) })} className="text-red-500">
                <Trash2 size={16} className="mx-auto" />
              </button>
            </div>
          ))}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create PO</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => {
        setSaving(true);
        await api.delete(`/purchases/${deleteId}`);
        setDeleteId(null);
        load();
        setSaving(false);
      }} title="Delete PO" message="Delete this purchase order?" loading={saving} />
    </div>
  );
}
