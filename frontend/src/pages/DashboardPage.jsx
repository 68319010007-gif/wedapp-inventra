import { useEffect, useState } from 'react';
import { Package, AlertTriangle, ShoppingCart, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../services/api';
import { StatCard, PageHeader, DataTable, StatusBadge, LoadingState } from '../components/ui';

const COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#f59e0b'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/summary')
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

  const salesChart = (data?.recentOrders || []).slice().reverse().map((o, i) => ({
    name: `Order ${i + 1}`,
    total: Number(o.total),
  }));

  const orderColumns = [
    { key: 'orderNo', label: 'Order ID' },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.name },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total', label: 'Total', render: (r) => formatCurrency(Number(r.total)) },
    {
      key: 'createdAt',
      label: 'Date',
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of inventory and sales performance"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Products" value={data?.totalProducts ?? 0} icon={Package} accent="primary" />
        <StatCard title="Low Stock Items" value={data?.lowStockItems ?? 0} icon={AlertTriangle} accent="warning" alert />
        <StatCard title="Total Orders" value={data?.totalOrders ?? 0} icon={ShoppingCart} accent="cyan" />
        <StatCard title="Total Sales" value={formatCurrency(data?.totalSales)} icon={DollarSign} accent="success" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Sales Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Top Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.topCategories || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {(data?.topCategories || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Recent Orders</h3>
        <DataTable columns={orderColumns} data={data?.recentOrders || []} />
      </div>
    </div>
  );
}
