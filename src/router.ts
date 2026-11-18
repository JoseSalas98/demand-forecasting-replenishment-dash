// Navegación por hash: funciona en GitHub Pages sin configuración (contracts/ui-routes.md).
import { useEffect, useState } from 'react';
import type { Scenario } from './types';

export type RouteName = 'home' | 'segmentation' | 'segment' | 'item' | 'itemDetail' | 'playground' | 'impact' | 'guide' | 'sources' | 'notFound';

export interface Route {
  route: RouteName;
  params: Record<string, string>;
  scenario: Scenario;
  /** Filtro "Pronóstico" del selector de artículo: true = solo los 517 (por defecto). */
  forecastOnly: boolean;
}

/** Rutas de la iteración 1 que ahora viven en otro lugar (se reemplazan sin dejar historial). */
export function legacyRedirect(hash: string): string | null {
  const raw = hash.replace(/^#/, '');
  const m = raw.match(/^\/segmentos(\/[^?]*)?(\?.*)?$/);
  if (!m) return null;
  return `#/segmentacion${m[1] ?? ''}${m[2] ?? ''}`;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart, query = ''] = raw.split('?');
  const q = new URLSearchParams(query);
  const scenario: Scenario = q.get('esc') === 'B' ? 'B' : 'A';
  const forecastOnly = q.get('pron') !== '0';
  const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  let route: RouteName = 'notFound';
  const params: Record<string, string> = {};
  if (parts.length === 0) route = 'home';
  else if (parts[0] === 'segmentacion' && parts.length === 1) route = 'segmentation';
  else if (parts[0] === 'segmentacion' && parts.length === 2) {
    route = 'segment';
    params.cell = parts[1];
  } else if (parts[0] === 'articulo' && parts.length <= 2) {
    route = 'item';
    if (parts[1]) params.itemId = parts[1];
  } else if (parts[0] === 'articulo' && parts.length === 3 && parts[2] === 'detalle') {
    route = 'itemDetail';
    params.itemId = parts[1];
  } else if (parts[0] === 'articulo' && parts.length === 3 && parts[2] === 'playground') {
    route = 'playground';
    params.itemId = parts[1];
  } else if (parts[0] === 'impacto' && parts.length === 1) route = 'impact';
  else if (parts[0] === 'guia' && (parts.length === 1 || (parts[1] === 'glosario' && parts.length <= 3))) {
    // #/guia, #/guia/glosario y #/guia/glosario/:term
    route = 'guide';
    if (parts[1]) params.section = parts[1];
    if (parts[2]) params.term = parts[2];
  }
  else if (parts[0] === 'datos' && parts.length === 1) route = 'sources';
  return { route, params, scenario, forecastOnly };
}

/** Arma un hash conservando el escenario y el filtro de pronóstico. `path` empieza con "/". */
export function hashFor(path: string, scenario: Scenario, forecastOnly?: boolean): string {
  const pron = forecastOnly === undefined ? currentForecastOnly() : forecastOnly;
  return `#${path}?esc=${scenario}${pron ? '' : '&pron=0'}`;
}

function currentForecastOnly(): boolean {
  if (typeof window === 'undefined') return true;
  return parseHash(window.location.hash).forecastOnly;
}

/** Cambia solo el escenario del hash actual. */
export function withScenario(hash: string, scenario: Scenario): string {
  const r = parseHash(hash);
  const raw = hash.replace(/^#/, '') || '/';
  return hashFor(raw.split('?')[0], scenario, r.forecastOnly);
}

/** Cambia solo el filtro "Pronóstico" del hash actual. */
export function withForecastOnly(hash: string, forecastOnly: boolean): string {
  const r = parseHash(hash);
  const raw = hash.replace(/^#/, '') || '/';
  return hashFor(raw.split('?')[0], r.scenario, forecastOnly);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => {
    const to = legacyRedirect(window.location.hash);
    if (to) window.location.replace(to);
    return parseHash(to ?? window.location.hash);
  });
  useEffect(() => {
    const onChange = () => {
      const to = legacyRedirect(window.location.hash);
      if (to) {
        window.location.replace(to);
        return;
      }
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
