// Idioma de la interfaz (spec 003): español por defecto, inglés a elección. Fuente única del idioma
// activo; los textos viven en src/i18n/es.ts y src/i18n/en.ts, que deben tener la misma forma.
import { useEffect, useState } from 'react';
import { en } from './i18n/en';
import { es, type Dict } from './i18n/es';

export type Lang = 'es' | 'en';
export const LANGS: Lang[] = ['es', 'en'];

const STORAGE_KEY = 'ddr-lang';
const DICTS: Record<Lang, Dict> = { es, en };
const listeners = new Set<(l: Lang) => void>();
let current: Lang = 'es';

const isLang = (v: unknown): v is Lang => v === 'es' || v === 'en';

/** `?lang=en` en el hash (enlace para compartir); null si no viene. */
export function langFromHash(hash: string): Lang | null {
  const query = hash.replace(/^#/, '').split('?')[1] ?? '';
  const v = new URLSearchParams(query).get('lang');
  return isLang(v) ? v : null;
}

/** Idioma al abrir: el del enlace, si no el recordado en el navegador, si no español. */
export function initialLang(): Lang {
  if (typeof window === 'undefined') return 'es';
  const fromHash = langFromHash(window.location.hash);
  if (fromHash) return fromHash;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Almacenamiento no disponible: se queda en memoria
  }
  return 'es';
}

export const getLang = (): Lang => current;

/** Cambia el idioma, lo recuerda en el navegador y lo aplica a toda la interfaz. */
export function setLang(lang: Lang, remember = true): void {
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  if (remember && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // sin almacenamiento: el idioma vale para esta visita
    }
    // El idioma elegido manda sobre un `?lang=` del enlace (sin agregar historial)
    const hash = window.location.hash;
    if (langFromHash(hash)) {
      const [path, query = ''] = hash.split('?');
      const q = new URLSearchParams(query);
      q.delete('lang');
      const rest = q.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${path}${rest ? `?${rest}` : ''}`);
    }
  }
  for (const fn of listeners) fn(lang);
}

/** Textos del idioma activo. */
export const t = (): Dict => DICTS[current];

/** Elige el valor del idioma activo en una tabla { es, en }. */
export const pick = <T,>(v: Record<Lang, T>): T => v[current];

/** Idioma activo como estado de React: la vista se vuelve a dibujar al cambiarlo. */
export function useLang(): Lang {
  const [lang, set] = useState<Lang>(current);
  useEffect(() => {
    listeners.add(set);
    set(current);
    return () => {
      listeners.delete(set);
    };
  }, []);
  return lang;
}
