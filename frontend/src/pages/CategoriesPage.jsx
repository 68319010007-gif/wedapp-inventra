import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n';
import { PageHeader, DataTable, LoadingState } from '../components/ui';
import { Modal, Button, Input, Textarea, ConfirmDialog, ActionButtons, Alert } from '../components/crud';

const empty = { name: '', description: '' };

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/categories').then((r) => setItems(r.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(empty); setError(''); setModal('create'); };
  const openEdit = (row) => { setForm({ name: row.name, description: row.description || '' }); setError(''); setModal({ type: 'edit', id: row.id }); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') await api.post('/categories', form);
      else await api.put(`/categories/${modal.id}`, form);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: t('common.name') },
    { key: 'description', label: t('common.description'), render: (r) => r.description || '-' },
    { key: 'count', label: t('nav.products'), render: (r) => r._count?.products ?? 0 },
    { key: 'actions', label: t('common.actions'), render: (r) => (
      <ActionButtons onEdit={() => openEdit(r)} onDelete={() => setDeleteId(r.id)} />
    )},
  ];

  return (
    <div>
      <PageHeader title={t('admin.categories.title')} subtitle={t('admin.categories.subtitle')} action={<Button onClick={openCreate}><Plus size={16} /> {t('admin.categories.add')}</Button>} />
      {loading ? <LoadingState /> : <DataTable columns={columns} data={items} emptyMessage={t('common.noData')} />}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? t('admin.categories.add') : t('common.edit')}>
        <form onSubmit={handleSave}>
          <Alert message={error} />
          <Input label={`${t('common.name')} *`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mb-4" />
          <Textarea label={t('common.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={saving}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => {
        setSaving(true);
        await api.delete(`/categories/${deleteId}`);
        setDeleteId(null);
        load();
        setSaving(false);
      }} title={t('admin.categories.title')} message={t('common.confirmDelete')} loading={saving} />
    </div>
  );
}

