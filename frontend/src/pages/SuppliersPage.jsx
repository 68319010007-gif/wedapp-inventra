import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { PageHeader, DataTable, LoadingState } from '../components/ui';
import { Modal, Button, Input, ConfirmDialog, ActionButtons, Alert, SearchBar } from '../components/crud';

const empty = { code: '', name: '', email: '', phone: '', address: '', contact: '' };

export default function SuppliersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/suppliers${q}`).then((r) => setItems(r.data.data.items)).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(empty); setError(''); setModal('create'); };
  const openEdit = (row) => { setForm({ code: row.code, name: row.name, email: row.email || '', phone: row.phone || '', address: row.address || '', contact: row.contact || '' }); setError(''); setModal({ type: 'edit', id: row.id }); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') await api.post('/suppliers', form);
      else await api.put(`/suppliers/${modal.id}`, form);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'actions', label: 'Actions', render: (r) => (
      <ActionButtons onEdit={() => openEdit(r)} onDelete={() => setDeleteId(r.id)} />
    )},
  ];

  return (
    <div>
      <PageHeader title="Suppliers" subtitle="Vendor management" action={
        <div className="flex gap-3">
          <SearchBar value={search} onChange={setSearch} />
          <Button onClick={openCreate}><Plus size={16} /> Add Supplier</Button>
        </div>
      } />
      {loading ? <LoadingState /> : <DataTable columns={columns} data={items} />}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Supplier' : 'Edit Supplier'} size="lg">
        <form onSubmit={handleSave}>
          <Alert message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Code *" value={form.code} onChange={set('code')} required disabled={modal !== 'create'} />
            <Input label="Name *" value={form.name} onChange={set('name')} required />
            <Input label="Contact Person" value={form.contact} onChange={set('contact')} />
            <Input label="Email" value={form.email} onChange={set('email')} />
            <Input label="Phone" value={form.phone} onChange={set('phone')} />
            <Input label="Address" value={form.address} onChange={set('address')} className="sm:col-span-2" />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => {
        setSaving(true);
        await api.delete(`/suppliers/${deleteId}`);
        setDeleteId(null);
        load();
        setSaving(false);
      }} title="Delete Supplier" message="Delete this supplier?" loading={saving} />
    </div>
  );
}
