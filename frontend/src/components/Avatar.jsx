import { getImageUrl, getProductPlaceholder } from '../utils/imageUrl';

export default function Avatar({ src, name = 'U', size = 'md', className = '' }) {
  const sizes = { sm: 'h-8 w-8 text-sm', md: 'h-16 w-16 text-xl', lg: 'h-24 w-24 text-3xl', xl: 'h-32 w-32 text-4xl' };
  const img = src ? getImageUrl(src) : null;

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full bg-slate-200 ${sizes[size]} ${className}`}>
      {img ? (
        <img src={img} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary/10 font-semibold text-primary">
          {(name || 'U').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function AvatarUpload({ src, name, onUpload, uploading, label }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar src={src} name={name} size="xl" />
      <label className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
        {uploading ? '...' : label}
        <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
      </label>
    </div>
  );
}
