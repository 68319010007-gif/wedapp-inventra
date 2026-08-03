import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { PageHeader, DataTable, LoadingState } from '../components/ui';
import { Modal, Button, Input, Select, ConfirmDialog, ActionButtons, Alert, SearchBar } from '../components/crud';

const empty = { email: '', password: '', name: '', role: 'STAFF', phone: '' };

export default function UsersPage() {
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
    api.get(`/users${q}`).then((r) => setItems(r.data.data.items)).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(empty); setError(''); setModal('create'); };
  const openEdit = (row) => {
    setForm({ email: row.email, password: '', name: row.name, role: row.role, phone: row.phone || '', isActive: row.isActive });
    setError('');
    setModal({ type: 'edit', id: row.id });
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') {
        await api.post('/users', form);
      } else {
        const payload = { name: form.name, role: form.role, phone: form.phone, isActive: form.isActive };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${modal.id}`, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'phone', label: 'Phone' },
    { key: 'isActive', label: 'Status', render: (r) => r.isActive ? 'Active' : 'Inactive' },
    { key: 'actions', label: 'Actions', render: (r) => (
      <ActionButtons onEdit={() => openEdit(r)} onDelete={() => setDeleteId(r.id)} />
    )},
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="Staff and access management" action={
        <div className="flex gap-3">
          <SearchBar value={search} onChange={setSearch} />
          <Button onClick={openCreate}><Plus size={16} /> Add User</Button>
        </div>
      } />
      {loading ? <LoadingState /> : <DataTable columns={columns} data={items} />}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add User' : 'Edit User'}>
        <form onSubmit={handleSave}>
          <Alert message={error} />
          <Input label="Name *" value={form.name} onChange={set('name')} required className="mb-4" />
          <Input label="Email *" value={form.email} onChange={set('email')} required disabled={modal !== 'create'} className="mb-4" />
          <Input label={modal === 'create' ? 'Password *' : 'New Password (leave blank to keep)'} type="password" value={form.password} onChange={set('password')} required={modal === 'create'} className="mb-4" />
          <Select label="Role" value={form.role} onChange={set('role')} className="mb-4">
            {['ADMIN', 'MANAGER', 'STAFF', 'VIEWER'].map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Input label="Phone" value={form.phone} onChange={set('phone')} className="mb-4" />
          {modal !== 'create' && (
            <Select label="Status" value={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => {
        setSaving(true);
        try {
          await api.delete(`/users/${deleteId}`);
          setDeleteId(null);
          load();
        } catch (err) {
          setError(err.response?.data?.message);
        } finally {
          setSaving(false);
        }
      }} title="Delete User" message="Delete this user account?" loading={saving} />
    </div>
  );
}
