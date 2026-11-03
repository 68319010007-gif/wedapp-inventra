import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import storeApi from '../../services/storeApi';
import { useLanguage } from '../../i18n';
import { Button, Input, Alert, ConfirmDialog } from '../../components/crud';
import MapPinModal from '../../components/store/MapPinModal';
import { LoadingState } from '../../components/ui';

const emptyForm = {
  label: '',
  firstName: '',
  lastName: '',
  phone: '',
  phoneAlt: '',
  houseNo: '',
  moo: '',
  village: '',
  floor: '',
  room: '',
  soi: '',
  road: '',
  postalCode: '',
  subdistrict: '',
  district: '',
  province: '',
  residenceType: '',
  residenceOther: '',
  hasElevator: null,
  vehicleAccess: '',
  lat: null,
  lng: null,
  mapAddress: '',
  isDefaultShipping: false,
  isDefaultTax: false,
};

const TEXT_FIELDS = [
  'label', 'firstName', 'lastName', 'phone', 'phoneAlt', 'houseNo', 'moo', 'village',
  'floor', 'room', 'soi', 'road', 'postalCode', 'subdistrict', 'district', 'province',
  'residenceType', 'residenceOther', 'vehicleAccess', 'mapAddress',
];

function addressToForm(addr) {
  const form = { ...emptyForm, ...addr };
  for (const key of TEXT_FIELDS) {
    if (form[key] == null) form[key] = '';
  }
  return form;
}

function formatAddress(a) {
  if (a.formatted) return a.formatted;
  return [
    a.houseNo,
    a.moo ? `ม.${a.moo}` : null,
    a.village,
    a.soi ? `ซ.${a.soi}` : null,
    a.road ? `ถ.${a.road}` : null,
    a.subdistrict,
    a.district,
    a.province,
    a.postalCode,
  ].filter(Boolean).join(' ');
}

export default function AddressesPage() {
  const { t } = useLanguage();
  const [data, setData] = useState({ items: [], shippingDefault: null, taxDefault: null });
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // list | form
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    storeApi
      .get('/store/addresses')
      .then((res) => setData(res.data.data))
      .catch(() => setData({ items: [], shippingDefault: null, taxDefault: null }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  /** ตามตัวอย่าง: กดเพิ่มที่อยู่ / ปักหมุด → เปิด popup แผนที่ก่อน แล้วค่อยฟอร์ม */
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, isDefaultShipping: data.items.length === 0 });
    setError('');
    setMode('form');
    setMapOpen(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr.id);
    setForm(addressToForm(addr));
    setError('');
    setMode('form');
  };

  const openPinOnly = () => {
    if (data.shippingDefault) {
      openEdit(data.shippingDefault);
      setMapOpen(true);
    } else {
      openCreate();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        residenceType: form.residenceType || null,
        vehicleAccess: form.vehicleAccess || null,
      };
      if (editingId) {
        await storeApi.put(`/store/addresses/${editingId}`, payload);
      } else {
        await storeApi.post('/store/addresses', payload);
      }
      setMapOpen(false);
      setMode('list');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await storeApi.delete(`/store/addresses/${deleteId}`);
    setDeleteId(null);
    load();
  };

  const handleCancelForm = () => {
    setMapOpen(false);
    setMode('list');
    setError('');
  };

  const residenceOptions = useMemo(
    () => [
      { value: 'HOUSE', label: t('account.residence.house') },
      { value: 'CONDO', label: t('account.residence.condo') },
      { value: 'TOWNHOUSE', label: t('account.residence.townhouse') },
      { value: 'APARTMENT', label: t('account.residence.apartment') },
      { value: 'OTHER', label: t('account.residence.other') },
    ],
    [t]
  );

  const vehicleOptions = useMemo(
    () => [
      { value: 'TRUCK_4_AND_6', label: t('account.vehicle.both') },
      { value: 'TRUCK_4_ONLY', label: t('account.vehicle.truck4') },
      { value: 'TRUCK_6_ONLY', label: t('account.vehicle.truck6') },
      { value: 'NONE', label: t('account.vehicle.none') },
    ],
    [t]
  );

  const mapModal = (
    <MapPinModal
      open={mapOpen}
      onClose={() => setMapOpen(false)}
      initial={{ lat: form.lat, lng: form.lng, mapAddress: form.mapAddress }}
      onConfirm={(pin) => {
        setForm((f) => ({
          ...f,
          lat: pin.lat,
          lng: pin.lng,
          mapAddress: pin.mapAddress,
        }));
        setMapOpen(false);
        if (mode !== 'form') setMode('form');
      }}
    />
  );

  if (loading && mode === 'list') {
    return (
      <>
        <LoadingState />
        {mapModal}
      </>
    );
  }

  if (mode === 'form') {
    return (
      <>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">
            {editingId ? t('account.editAddress') : t('account.addAddress')}
          </h2>
          <Alert message={error} />

          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t('account.pinLocation')}</p>
                  <p className="mt-1 text-sm text-muted">
                    {form.mapAddress || t('account.pleasePin')}
                  </p>
                </div>
                <Button type="button" onClick={() => setMapOpen(true)}>
                  <MapPin size={16} /> {form.lat ? t('account.editPin') : t('account.pleasePin')}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={`${t('account.firstName')} *`} value={form.firstName} onChange={set('firstName')} required />
              <Input label={`${t('account.lastName')} *`} value={form.lastName} onChange={set('lastName')} required />
              <Input label={`${t('account.recipientPhone')} *`} value={form.phone} onChange={set('phone')} required />
              <Input label={t('account.recipientPhoneAlt')} value={form.phoneAlt} onChange={set('phoneAlt')} />
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin size={16} className="text-primary" /> {t('account.addressDetails')}
              </div>
              <div className="grid gap-4 sm:grid-cols-6">
                <Input label={`${t('account.houseNo')} *`} value={form.houseNo} onChange={set('houseNo')} required className="sm:col-span-2" />
                <Input label={t('account.moo')} value={form.moo} onChange={set('moo')} className="sm:col-span-1" />
                <Input label={t('account.village')} value={form.village} onChange={set('village')} className="sm:col-span-3" />
                <Input label={t('account.floor')} value={form.floor} onChange={set('floor')} className="sm:col-span-2" />
                <Input label={t('account.room')} value={form.room} onChange={set('room')} className="sm:col-span-2" />
                <Input label={t('account.soi')} value={form.soi} onChange={set('soi')} className="sm:col-span-2" />
                <Input label={t('account.road')} value={form.road} onChange={set('road')} className="sm:col-span-3" />
                <Input label={`${t('account.postalCode')} *`} value={form.postalCode} onChange={set('postalCode')} required className="sm:col-span-3" />
                <Input label={t('account.subdistrict')} value={form.subdistrict} onChange={set('subdistrict')} className="sm:col-span-2" />
                <Input label={t('account.district')} value={form.district} onChange={set('district')} className="sm:col-span-2" />
                <Input label={t('account.province')} value={form.province} onChange={set('province')} className="sm:col-span-2" />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <p className="mb-2 text-sm font-medium">{t('account.residenceType')}</p>
                <div className="space-y-2">
                  {residenceOptions.map((o) => (
                    <label key={o.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="residenceType"
                        checked={form.residenceType === o.value}
                        onChange={() => setForm((f) => ({ ...f, residenceType: o.value }))}
                      />
                      {o.label}
                    </label>
                  ))}
                  {form.residenceType === 'OTHER' && (
                    <Input
                      value={form.residenceOther}
                      onChange={set('residenceOther')}
                      placeholder={t('account.residence.other')}
                    />
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">{t('account.hasElevator')}</p>
                <div className="space-y-2">
                  {[true, false].map((v) => (
                    <label key={String(v)} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="hasElevator"
                        checked={form.hasElevator === v}
                        onChange={() => setForm((f) => ({ ...f, hasElevator: v }))}
                      />
                      {v ? t('common.yes') : t('account.no')}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">{t('account.vehicleAccess')}</p>
                <div className="space-y-2">
                  {vehicleOptions.map((o) => (
                    <label key={o.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="vehicleAccess"
                        checked={form.vehicleAccess === o.value}
                        onChange={() => setForm((f) => ({ ...f, vehicleAccess: o.value }))}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isDefaultShipping} onChange={set('isDefaultShipping')} />
                {t('account.setDefaultShipping')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isDefaultTax} onChange={set('isDefaultTax')} />
                {t('account.setDefaultTax')}
              </label>
            </div>

            <Input label={`${t('account.addressLabel')} *`} value={form.label} onChange={set('label')} required />

            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={saving}>
                {editingId ? t('common.save') : t('account.addAddress')}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancelForm}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </div>
        {mapModal}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">{t('account.manageAddresses')}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={openPinOnly}
            className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-primary hover:bg-primary/5"
          >
            <p className="text-sm font-semibold text-primary">{t('account.shippingAddress')}</p>
            {data.shippingDefault ? (
              <div className="mt-3 text-sm text-slate-700">
                <p className="font-medium">
                  {data.shippingDefault.firstName} {data.shippingDefault.lastName}
                </p>
                <p className="mt-1 text-muted">{formatAddress(data.shippingDefault)}</p>
                {data.shippingDefault.mapAddress ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                    <MapPin size={12} /> {t('account.pinned')}
                  </p>
                ) : (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                    <MapPin size={12} /> {t('account.pleasePin')}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-6 text-center text-sm text-primary">
                <MapPin size={18} className="mx-auto mb-2" />
                {t('account.pleasePin')}
              </p>
            )}
          </button>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-primary">{t('account.taxAddress')}</p>
            {data.taxDefault ? (
              <div className="mt-3 text-sm text-slate-700">
                <p className="font-medium">
                  {data.taxDefault.firstName} {data.taxDefault.lastName}
                </p>
                <p className="mt-1 text-muted">{formatAddress(data.taxDefault)}</p>
              </div>
            ) : (
              <p className="mt-8 text-center text-sm text-muted">—</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold">{t('account.allAddresses')}</h3>

        {data.items.length === 0 ? (
          <button
            type="button"
            onClick={openCreate}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-12 text-primary hover:border-primary hover:bg-primary/5"
          >
            <Plus size={22} />
            <span className="font-medium">{t('account.addAddress')}</span>
          </button>
        ) : (
          <div className="space-y-3">
            {data.items.map((addr) => (
              <div
                key={addr.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{addr.label}</p>
                    {addr.isDefaultShipping && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {t('account.shippingAddress')}
                      </span>
                    )}
                    {addr.isDefaultTax && (
                      <span className="rounded-full bg-cyan/10 px-2 py-0.5 text-[10px] font-medium text-cyan">
                        {t('account.taxAddress')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm">
                    {addr.firstName} {addr.lastName} · {addr.phone}
                  </p>
                  <p className="mt-1 text-sm text-muted">{formatAddress(addr)}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => openEdit(addr)}>
                    <Pencil size={14} /> {t('common.edit')}
                  </Button>
                  <Button type="button" variant="danger" onClick={() => setDeleteId(addr.id)}>
                    <Trash2 size={14} /> {t('common.delete')}
                  </Button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={openCreate}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-primary hover:border-primary hover:bg-primary/5"
            >
              <Plus size={16} /> {t('account.addAddress')}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('account.deleteAddressConfirm')}
        confirmText={t('common.delete')}
      />

      {mapModal}
    </div>
  );
}
