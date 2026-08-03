import { useLanguage } from '../i18n';

export default function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={`inline-flex overflow-hidden rounded-full border border-slate-700 bg-black ${className}`}>
      <button
        type="button"
        onClick={() => setLocale('th')}
        className={`px-3 py-1 text-xs font-bold transition ${
          locale === 'th' ? 'bg-yellow-400 text-black' : 'bg-transparent text-white hover:bg-white/10'
        }`}
      >
        TH
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-3 py-1 text-xs font-bold transition ${
          locale === 'en' ? 'bg-yellow-400 text-black' : 'bg-transparent text-white hover:bg-white/10'
        }`}
      >
        EN
      </button>
    </div>
  );
}

export function LanguageSwitcherLight({ className = '' }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={`inline-flex overflow-hidden rounded-full border border-slate-200 bg-white ${className}`}>
      <button
        type="button"
        onClick={() => setLocale('th')}
        className={`px-3 py-1 text-xs font-bold transition ${
          locale === 'th' ? 'bg-yellow-400 text-black' : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        TH
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-3 py-1 text-xs font-bold transition ${
          locale === 'en' ? 'bg-yellow-400 text-black' : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        EN
      </button>
    </div>
  );
}
