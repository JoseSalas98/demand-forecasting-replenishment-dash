// Formato único de números, dinero y fechas. Español: 1.234,5 · 3,28 M US$ · 52 % · 25 may 2015.
// Inglés (estilo EE. UU.): 1,234.5 · US$3.28M · 52% · May 25, 2015. Ninguna vista formatea por su cuenta.
import { getLang, t } from './i18n';

const isMissing = (v: number | null | undefined): v is null | undefined =>
  v === null || v === undefined || !Number.isFinite(v);

/** Texto para un dato ausente ("no disponible" / "not available"). */
export const na = (): string => t().common.na;

/** Número con separadores del idioma; ausente → "no disponible". */
export function fmtNumber(v: number | null | undefined, decimals = 0): string {
  if (isMissing(v)) return na();
  const en = getLang() === 'en';
  // Agrupación manual: es-ES no agrupa números de 4 cifras y Node 18 no admite useGrouping 'always'
  const [int, frac] = Math.abs(v).toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : '.');
  const sign = v < 0 && Number(Math.abs(v).toFixed(decimals)) !== 0 ? '−' : '';
  return `${sign}${grouped}${frac ? `${en ? '.' : ','}${frac}` : ''}`;
}

/** Monto con la unidad en la posición de cada idioma: "11.558,54 US$" / "US$11,558.54". */
function usd(body: string, suffix = ''): string {
  if (getLang() === 'en') return body.startsWith('−') ? `−US$${body.slice(1)}${suffix}` : `US$${body}${suffix}`;
  return `${body}${suffix ? ` ${suffix}` : ''} US$`;
}

/** Dinero en US$; desde 100.000 se abrevia en millones ("0,91 M US$" / "US$0.91M"). */
export function fmtMoney(v: number | null | undefined): string {
  if (isMissing(v)) return na();
  if (Math.abs(v) >= 1e5) return fmtM(v);
  return usd(fmtNumber(v, 2));
}

/** Dinero entero ("11.559 US$" / "US$11,559"). */
export function fmtUsd(v: number | null | undefined): string {
  if (isMissing(v)) return na();
  return usd(fmtNumber(v));
}

/** Porcentaje que ya viene en escala 0–100 ("52 %" / "52%"). */
export function fmtPct(v: number | null | undefined, decimals = 1): string {
  if (isMissing(v)) return na();
  return `${fmtNumber(v, decimals)}${getLang() === 'en' ? '' : ' '}%`;
}

/** Ratio bloque / anterior; anterior en cero o ausente → "no disponible". */
export function fmtRatio(cur: number | null | undefined, prev: number | null | undefined): string {
  if (isMissing(cur) || isMissing(prev) || prev === 0) return na();
  return fmtNumber(cur / prev, 3);
}

/** Totales en millones con dos decimales ("3,28 M US$" / "US$3.28M"). */
export function fmtM(v: number | null | undefined): string {
  if (isMissing(v)) return na();
  const body = fmtNumber(v / 1e6, 2);
  return getLang() === 'en' ? usd(body, 'M') : `${body} M US$`;
}

/** Tablas y fichas en miles sin centavos ("122 mil US$" / "US$122K"); `bare` omite la unidad. */
export function fmtK(v: number | null | undefined, bare = false): string {
  if (isMissing(v)) return na();
  const body = fmtNumber(v / 1e3);
  if (bare) return body;
  return getLang() === 'en' ? usd(body, 'K') : `${body} mil US$`;
}

/** Millones sin moneda para ejes y burbujas ("12 M" / "12M"); sin `decimals`, 0 o 1 según haga falta. */
export function fmtAxisM(v: number, decimals?: number): string {
  if (!v && decimals === undefined) return '0';
  return `${fmtNumber(v / 1e6, decimals ?? (v % 1e6 ? 1 : 0))}${getLang() === 'en' ? 'M' : ' M'}`;
}

const MONTHS: Record<'es' | 'en', string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** "2015-05-25" → "25 may 2015" / "May 25, 2015"; ausente → "no disponible". */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return na();
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const mon = MONTHS[getLang()][m - 1];
  return getLang() === 'en' ? `${mon} ${d}, ${y}` : `${d} ${mon} ${y}`;
}

/** "2011-09-02" → "sep 2011" / "Sep 2011". */
export function fmtMonthYear(iso: string | null | undefined): string {
  if (!iso) return na();
  const [y, m] = iso.slice(0, 10).split('-').map(Number);
  return `${MONTHS[getLang()][m - 1]} ${y}`;
}

/** Mes corto para marcas de eje ("may" / "May"). */
export const monthShort = (m: number): string => MONTHS[getLang()][m];
