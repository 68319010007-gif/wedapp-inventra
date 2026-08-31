import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ImagePreviewModal({ open, onClose, src, alt = '' }) {
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

  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] max-w-4xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] w-full rounded-2xl object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
