import { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader, LoadingState } from '../components/ui';

export default function ReportsPage() {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/reports/sales'), api.get('/reports/inventory')])
      .then(([salesRes, invRes]) => {
        setSales(salesRes.data.data);
        setInventory(invRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const totalSales = sales.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Sales and inventory analytics" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-muted">Total Sales (All Time)</p>
          <p className="mt-2 text-2xl font-semibold">${totalSales.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-muted">Total Orders</p>
          <p className="mt-2 text-2xl font-semibold">{sales.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-muted">Products Tracked</p>
          <p className="mt-2 text-2xl font-semibold">{inventory.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold">Inventory Summary</h3>
        <div className="space-y-2">
          {inventory.slice(0, 10).map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
              <span>{p.name}</span>
              <span className="font-medium">{p.inventoryItems?.quantity ?? 0} {p.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
