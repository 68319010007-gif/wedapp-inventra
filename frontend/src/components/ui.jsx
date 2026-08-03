const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPING: 'bg-cyan-100 text-cyan-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-slate-100 text-slate-700',
  ORDERED: 'bg-blue-100 text-blue-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export function StatCard({ title, value, icon: Icon, accent = 'primary', alert = false }) {
  const accents = {
    primary: 'text-primary bg-blue-50',
    cyan: 'text-cyan bg-cyan/10',
    warning: 'text-orange-600 bg-orange-50',
    success: 'text-emerald-600 bg-emerald-50',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className={`mt-2 text-2xl font-semibold ${alert ? 'text-orange-600' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`rounded-xl p-3 ${accents[accent]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function DataTable({ columns, data, emptyMessage = 'No data found' }) {
  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-muted shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id || idx} className="border-t border-slate-100 hover:bg-slate-50/70">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
