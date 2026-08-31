import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../i18n';

const COLLAPSE_AT = 280;

export default function CategoryExpandableText({ title, text }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const needsToggle = useMemo(() => (text?.length || 0) > COLLAPSE_AT, [text]);

  if (!text?.trim()) return null;

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">
      {title && <h2 className="text-xl font-bold text-slate-900">{title}</h2>}
      <div
        className={`mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 ${!expanded && needsToggle ? 'line-clamp-6' : ''}`}
      >
        {text}
      </div>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {expanded ? t('store.readLess') : t('store.readMore')}
          <ChevronDown size={16} className={`transition ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </section>
  );
}
