// Carga de los JSON exportados (solo public/data; constitución I.7).
import { useEffect, useState } from 'react';
import { t } from './i18n';

const cache = new Map<string, Promise<unknown>>();

/** Lee `data/<path>` relativo a la base del sitio; falla con la ruta si no existe. */
export function loadJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const url = `${import.meta.env.BASE_URL}data/${path}`;
    const p = fetch(url).then((res) => {
      if (!res.ok) throw new Error(t().common.loadFail(path, res.status));
      return res.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return cache.get(path) as Promise<T>;
}

export type DataState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: T };

/** Hook de carga con estados explícitos (nunca un blanco silencioso). */
export function useData<T>(path: string | null): DataState<T> {
  const [state, setState] = useState<DataState<T>>({ status: 'loading' });
  useEffect(() => {
    if (path === null) return;
    let alive = true;
    setState({ status: 'loading' });
    loadJson<T>(path).then(
      (data) => alive && setState({ status: 'ready', data }),
      (error: Error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [path]);
  return state;
}
