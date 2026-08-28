import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Delete', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    </Modal>
  );
}

export function Button({ children, variant = 'primary', type = 'button', loading, disabled, className = '', ...props }) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-muted hover:bg-slate-100',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', value, ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
      <input
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-300' : 'border-slate-200'}`}
        {...props}
        value={value ?? ''}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
      <select
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-300' : 'border-slate-200'}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        rows={3}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-300' : 'border-slate-200'}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  );
}

export function ActionButtons({ onEdit, onDelete, extra }) {
  return (
    <div className="flex items-center gap-2">
      {extra}
      {onEdit && (
        <button onClick={onEdit} className="rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-blue-50">
          Edit
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
          Delete
        </button>
      )}
    </div>
  );
}

export function Alert({ type = 'error', message }) {
  if (!message) return null;
  const styles = type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600';
  return <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${styles}`}>{message}</div>;
}
