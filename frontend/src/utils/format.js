export const formatCurrency = (val, currency = 'THB') =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(val) || 0);

export const formatDate = (val) => (val ? new Date(val).toLocaleDateString('th-TH') : '-');

export const formatDateTime = (val) => (val ? new Date(val).toLocaleString('th-TH') : '-');
