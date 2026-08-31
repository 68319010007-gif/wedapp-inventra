import { createContext, useContext, useState, useCallback } from 'react';
import th from './th';
import en from './en';

const translations = { th, en };
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => localStorage.getItem('inventra_lang') || 'th');

  const setLocale = useCallback((lang) => {
    localStorage.setItem('inventra_lang', lang);
    setLocaleState(lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key, vars) => {
    const keys = key.split('.');
    let val = translations[locale];
    for (const k of keys) {
      val = val?.[k];
    }
    if (typeof val === 'string' && vars) {
      return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
    }
    return val ?? key;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
