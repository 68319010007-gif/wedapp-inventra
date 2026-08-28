import { useCallback, useEffect, useState } from 'react';
import { Plus, Upload, Star, Trash2 } from 'lucide-react';
import { flattenCategoryTree, buildCategoryTree } from '../utils/categoryTree';
import { PageHeader, DataTable, LoadingState } from '../components/ui';
import { Modal, Button, Input, Select, Textarea, ConfirmDialog, ActionButtons, Alert, SearchBar } from '../components/crud';
import { formatCurrency } from '../utils/format';
import { getImageUrl, getProductPlaceholder } from '../utils/imageUrl';
import { useLanguage } from '../i18n';
import { useStockUpdates } from '../utils/useStockUpdates';

const emptyForm = {
  sku: '', name: '', categoryId: '', unit: 'pcs', costPrice: '', sellPrice: '',
  minStock: 0, barcode: '', description: '', isActive: true,
};

export default function ProductsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    Promise.all([api.get(`/products${q}`), api.get('/categories')])
      .then(([p, c]) => {
        setItems(p.data.data.items);
        const items = c.data.data.items || c.data.data || [];
        setCategories(items);
        setCategoryTree(c.data.data.tree || buildCategoryTree(items));
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleStockUpdate = useCallback((productId, quantity) => {
    setItems((prev) => prev.map((p) => (
      p.id === productId ? { ...p, inventoryItems: { ...(p.inventoryItems || {}), quantity } } : p
    )));
  }, []);
  useStockUpdates(handleStockUpdate);

  const openCreate = () => { setForm(emptyForm); setImages([]); setError(''); setModal('create'); };
  const openEdit = (row) => {
    setForm({
      sku: row.sku, name: row.name, categoryId: row.categoryId || '',
      unit: row.unit, costPrice: Number(row.costPrice), sellPrice: Number(row.sellPrice),
      minStock: row.minStock, barcode: row.barcode || '', description: row.description || '',
      isActive: row.isActive,
    });
    setImages(row.images || []);
    setError('');
    setModal({ type: 'edit', id: row.id });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        costPrice: Number(form.costPrice),
        sellPrice: Number(form.sellPrice),
        minStock: Number(form.minStock),
        categoryId: form.categoryId || null,
        isActive: form.isActive === true || form.isActive === 'true',
      };
      if (modal === 'create') {
        await api.post('/products', payload);
      } else {
        await api.put(`/products/${modal.id}`, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/products/${deleteId}`);
      setDeleteId(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !modal?.id) return;
    setUploadingImage(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/products/${modal.id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prev) => [...prev, res.data.data]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!modal?.id) return;
    await api.delete(`/products/${modal.id}/images/${imageId}`);
    setImages((prev) => {
      const remaining = prev.filter((img) => img.id !== imageId);
      const removed = prev.find((img) => img.id === imageId);
      if (removed?.isPrimary && remaining.length) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return remaining;
    });
  };

  const handleSetPrimary = async (imageId) => {
    if (!modal?.id) return;
    await api.patch(`/products/${modal.id}/images/${imageId}/primary`);
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === imageId })));
  };

  const columns = [
    { key: 'image', label: '', render: (r) => (
      <img
        src={r.image ? getImageUrl(r.image) : getProductPlaceholder(r.name)}
        alt=""
        className="h-10 w-10 rounded-lg object-cover"
      />
    )},
    { key: 'sku', label: t('admin.products.sku') },
    { key: 'name', label: t('admin.products.name') },
    { key: 'category', label: t('admin.products.category'), render: (r) => r.category?.name || '-' },
    { key: 'sellPrice', label: t('admin.products.sellPrice'), render: (r) => formatCurrency(r.sellPrice) },
    { key: 'stock', label: t('admin.products.stock'), render: (r) => r.inventoryItems?.quantity ?? 0 },
    { key: 'minStock', label: t('admin.products.minStock'), render: (r) => (
      <span className={(r.inventoryItems?.quantity ?? 0) <= r.minStock ? 'font-semibold text-orange-600' : ''}>{r.minStock}</span>
    )},
    { key: 'actions', label: t('common.actions'), render: (r) => (
      <ActionButtons onEdit={() => openEdit(r)} onDelete={() => setDeleteId(r.id)} />
    )},
  ];

  return (
    <div>
      <PageHeader
        title={t('admin.products.title')}
        subtitle={t('admin.products.subtitle')}
        action={
          <div className="flex gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder={t('admin.products.searchPlaceholder')} />
            <Button onClick={openCreate}><Plus size={16} /> {t('admin.products.add')}</Button>
          </div>
        }
      />
      {loading ? <LoadingState /> : <DataTable columns={columns} data={items} emptyMessage={t('common.noData')} />}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? t('admin.products.add') : t('admin.products.edit')} size="lg">
        <form onSubmit={handleSave}>
          <Alert message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={`${t('admin.products.sku')} *`} value={form.sku} onChange={set('sku')} required disabled={modal !== 'create'} />
            <Input label={t('admin.products.barcode')} value={form.barcode} onChange={set('barcode')} />
            <Input label={t('admin.products.productName')} value={form.name} onChange={set('name')} required className="sm:col-span-2" />
            <Select label={t('admin.products.category')} value={form.categoryId} onChange={set('categoryId')}>
              <option value="">{t('admin.products.none')}</option>
              {flattenCategoryTree(categoryTree).map((c) => (
                <option key={c.id} value={c.id}>{'\u00A0'.repeat(c.depth * 2)}{c.name}</option>
              ))}
            </Select>
            <Input label={t('admin.products.unit')} value={form.unit} onChange={set('unit')} />
            <Input label={t('admin.products.costPrice')} type="number" step="0.01" value={form.costPrice} onChange={set('costPrice')} />
            <Input label={`${t('admin.products.sellPrice')} *`} type="number" step="0.01" value={form.sellPrice} onChange={set('sellPrice')} required />
            <Input label={t('admin.products.minStock')} type="number" value={form.minStock} onChange={set('minStock')} />
            {modal !== 'create' && (
              <Select label={t('admin.products.status')} value={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                <option value="true">{t('common.active')}</option>
                <option value="false">{t('common.inactive')}</option>
              </Select>
            )}
            <Textarea label={t('admin.products.description')} value={form.description} onChange={set('description')} className="sm:col-span-2" />
          </div>

          {modal !== 'create' && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-sm font-medium text-slate-700">{t('admin.products.images')}</p>
              <div className="flex flex-wrap gap-3">
                {images.map((img) => (
                  <div key={img.id} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                    <img src={getImageUrl(img.url)} alt="" className="h-full w-full object-cover" />
                    {img.isPrimary && (
                      <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {t('common.primary')}
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition group-hover:opacity-100">
                      {!img.isPrimary && (
                        <button type="button" onClick={() => handleSetPrimary(img.id)} title={t('admin.products.setPrimary')}
                          className="rounded-full bg-white/90 p-1.5 text-slate-700 hover:text-primary">
                          <Star size={14} />
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeleteImage(img.id)} title={t('admin.products.deleteImage')}
                        className="rounded-full bg-white/90 p-1.5 text-red-600 hover:text-red-700">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-muted hover:border-primary hover:text-primary">
                  {uploadingImage ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Upload size={18} />
                      <span className="text-[11px]">{t('admin.products.addImage')}</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={uploadingImage} />
                </label>
              </div>
              {images.length === 0 && (
                <p className="mt-2 text-xs text-muted">{t('admin.products.none')}</p>
              )}
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={saving}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('admin.products.title')}
        message={t('admin.products.confirmDelete')}
        loading={saving}
      />
    </div>
  );
}
