import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { PageHeader, DataTable, LoadingState } from '../components/ui';
import { Modal, Button, Input, Select, Textarea, Alert, SearchBar } from '../components/crud';
import { useStockUpdates } from '../utils/useStockUpdates';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'IN', quantity: '', reference: '', note: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    Promise.all([
      api.get(`/inventory/stock${q}`),
      api.get('/inventory/movements?limit=20'),
      api.get('/products?limit=100'),
    ])
      .then(([stock, mov, prod]) => {
        setItems(stock.data.data.items);
        setMovements(mov.data.data.items);
        setProducts(prod.data.data.items);
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleStockUpdate = useCallback((productId, quantity) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity, isLowStock: quantity <= i.minStock } : i)));
  }, []);
  useStockUpdates(handleStockUpdate);

  const handleMovement = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/inventory/movements', { ...form, quantity: Number(form.quantity) });
      setModal(false);
      setForm({ productId: '', type: 'IN', quantity: '', reference: '', note: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const stockColumns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Qty', render: (r) => (
      <span className={r.isLowStock ? 'font-semibold text-orange-600' : ''}>{r.quantity}</span>
    )},
    { key: 'minStock', label: 'Min' },
    { key: 'status', label: 'Status', render: (r) => r.isLowStock ? 'Low Stock' : 'OK' },
  ];

  const movColumns = [
    { key: 'product', label: 'Product', render: (r) => r.product?.name },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Qty' },
    { key: 'reference', label: 'Ref' },
    { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock levels and movements"
        action={
          <div className="flex gap-3">
            <SearchBar value={search} onChange={setSearch} />
            <Button onClick={() => { setError(''); setModal(true); }}><Plus size={16} /> Stock Movement</Button>
          </div>
        }
      />
      <h3 className="mb-3 font-semibold">Current Stock</h3>
      <div className="mb-8"><DataTable columns={stockColumns} data={items} /></div>
      <h3 className="mb-3 font-semibold">Recent Movements</h3>
      <DataTable columns={movColumns} data={movements} emptyMessage="No movements yet" />

      <Modal open={modal} onClose={() => setModal(false)} title="Record Stock Movement">
        <form onSubmit={handleMovement}>
          <Alert message={error} />
          <Select label="Product *" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required className="mb-4">
            <option value="">Select product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
          </Select>
          <Select label="Type *" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mb-4">
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="ADJUST">Adjust</option>
          </Select>
          <Input label="Quantity *" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className="mb-4" />
          <Input label="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="mb-4" />
          <Textarea label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
