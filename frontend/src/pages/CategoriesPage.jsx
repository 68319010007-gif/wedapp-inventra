import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n';
import { PageHeader, DataTable, LoadingState } from '../components/ui';
import { Modal, Button, Input, Textarea, ConfirmDialog, ActionButtons, Alert } from '../components/crud';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { flattenCategoryTree, buildCategoryTree, getCategoryPath } from '../utils/categoryTree';
import { getImageUrl, getProductPlaceholder } from '../utils/imageUrl';

const empty = { name: '', description: '', longDescription: '', imageUrl: '', parentId: '', sortOrder: 0 };

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/categories').then((r) => {
      setItems(r.data.data.items || r.data.data || []);
      setTree(r.data.data.tree || buildCategoryTree(r.data.data.items || r.data.data || []));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const flatOptions = useMemo(() => flattenCategoryTree(tree), [tree]);

  const openCreate = () => { setForm(empty); setError(''); setModal('create'); };
  const openEdit = (row) => {
    setForm({
      name: row.name,
      description: row.description || '',
      longDescription: row.longDescription || '',
      imageUrl: row.imageUrl || '',
      parentId: row.parentId || '',
      sortOrder: row.sortOrder ?? 0,
    });
    setError('');
    setModal({ type: 'edit', id: row.id });
  };

  const handleUploadImage = async (e) => {
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
      setForm((prev) => ({ ...prev, imageUrl: res.data.data.url }));
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
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (modal === 'create') await api.post('/categories', payload);
      else await api.put(`/categories/${modal.id}`, payload);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const categoryThumb = (row) => getImageUrl(row.imageUrl) || getProductPlaceholder(row.name);

  const columns = [
    {
      key: 'image',
      label: t('admin.categories.image'),
      render: (r) => {
        const src = categoryThumb(r);
        return (
          <button
            type="button"
            onClick={() => setPreviewImage({ src, alt: r.name })}
            className="block h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition hover:ring-2 hover:ring-primary/40"
            title={t('admin.categories.viewImage')}
          >
            <img src={src} alt={r.name} className="h-full w-full object-cover" />
          </button>
        );
      },
    },
    { key: 'name', label: t('common.name') },
    {
      key: 'path',
      label: t('admin.categories.parent'),
      render: (r) => {
        const path = getCategoryPath(r.id, items);
        return path.length > 1 ? path.slice(0, -1).map((c) => c.name).join(' › ') : '—';
      },
    },
    { key: 'description', label: t('common.description'), render: (r) => r.description || '-' },
    { key: 'count', label: t('nav.products'), render: (r) => r._count?.products ?? 0 },
    { key: 'actions', label: t('common.actions'), render: (r) => (
      <ActionButtons onEdit={() => openEdit(r)} onDelete={() => setDeleteId(r.id)} />
    )},
  ];

  const formPreview = form.imageUrl ? getImageUrl(form.imageUrl) : null;

  return (
    <div>
      <PageHeader title={t('admin.categories.title')} subtitle={t('admin.categories.subtitle')} action={<Button onClick={openCreate}><Plus size={16} /> {t('admin.categories.add')}</Button>} />
      {loading ? <LoadingState /> : <DataTable columns={columns} data={items} emptyMessage={t('common.noData')} />}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? t('admin.categories.add') : t('common.edit')}>
        <form onSubmit={handleSave}>
          <Alert message={error} />
          <Input label={`${t('common.name')} *`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mb-4" />
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{t('admin.categories.parent')}</span>
            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <option value="">{t('admin.categories.noParent')}</option>
              {flatOptions
                .filter((c) => modal?.id !== c.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {'\u00A0'.repeat(c.depth * 2)}{c.name}
                  </option>
                ))}
            </select>
          </label>
          <Input label={t('admin.categories.sortOrder')} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="mb-4" />
          <Textarea label={t('common.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mb-4" />
          <Textarea label={t('admin.categories.longDescription')} value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} className="mb-4" />
          <div className="mb-4">
            <span className="mb-2 block text-sm font-medium text-slate-700">{t('admin.categories.image')}</span>
            <div className="flex flex-wrap items-start gap-4">
              <button
                type="button"
                onClick={() => formPreview && setPreviewImage({ src: formPreview, alt: form.name || t('admin.categories.image') })}
                className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={formPreview || getProductPlaceholder(form.name || '?')}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  label={t('admin.categories.imageUrl')}
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Upload size={16} />
                  {uploading ? t('common.uploading') : t('admin.categories.uploadImage')}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={saving}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      <ImagePreviewModal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        src={previewImage?.src}
        alt={previewImage?.alt}
      />

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => {
        setSaving(true);
        try {
          await api.delete(`/categories/${deleteId}`);
          setDeleteId(null);
          load();
        } catch (err) {
          setError(err.response?.data?.message || 'Delete failed');
        } finally {
          setSaving(false);
        }
      }} title={t('admin.categories.title')} message={t('common.confirmDelete')} loading={saving} />
    </div>
  );
}
