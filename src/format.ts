// Formato único de números y dinero (es-ES). Ninguna vista formatea por su cuenta.

export const MONEY_LABEL = 'a precio de venta, no es margen';
export const NOT_AVAILABLE = 'no disponible';

const isMissing = (v: number | null | undefined): v is null | undefined =>
  v === null || v === undefined || !Number.isFinite(v);

/** Número con punto de miles y coma decimal; ausente → "no disponible". */
export function fmtNumber(v: number | null | undefined, decimals = 0): string {
  if (isMissing(v)) return NOT_AVAILABLE;
  // Agrupación manual: es-ES no agrupa números de 4 cifras y Node 18 no admite useGrouping 'always'
  const [int, frac] = Math.abs(v).toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = v < 0 && Number(Math.abs(v).toFixed(decimals)) !== 0 ? '−' : '';
  return `${sign}${grouped}${frac ? `,${frac}` : ''}`;
}

/** Dinero en US$; desde 100.000 se abrevia en millones, como en la presentación ("0,91 M US$"). */
export function fmtMoney(v: number | null | undefined): string {
  if (isMissing(v)) return NOT_AVAILABLE;
  if (Math.abs(v) >= 1e5) return `${fmtNumber(v / 1e6, 2)} M US$`;
  return `${fmtNumber(v, 2)} US$`;
}

/** Porcentaje que ya viene en escala 0–100. */
export function fmtPct(v: number | null | undefined, decimals = 1): string {
  if (isMissing(v)) return NOT_AVAILABLE;
  return `${fmtNumber(v, decimals)} %`;
}

/** Ratio bloque / anterior; anterior en cero o ausente → "no disponible". */
export function fmtRatio(cur: number | null | undefined, prev: number | null | undefined): string {
  if (isMissing(cur) || isMissing(prev) || prev === 0) return NOT_AVAILABLE;
  return fmtNumber(cur / prev, 3);
}

/** Totales en millones con dos decimales ("3,28 M US$"); escala fija para todo un bloque. */
export function fmtM(v: number | null | undefined): string {
  if (isMissing(v)) return NOT_AVAILABLE;
  return `${fmtNumber(v / 1e6, 2)} M US$`;
}

/** Tablas y fichas en miles sin centavos ("122 mil US$"); `bare` omite la unidad (va en el encabezado). */
export function fmtK(v: number | null | undefined, bare = false): string {
  if (isMissing(v)) return NOT_AVAILABLE;
  return bare ? fmtNumber(v / 1e3) : `${fmtNumber(v / 1e3)} mil US$`;
}

/** Etiqueta global de dinero (constitución II.4): una sola vez, en la barra superior. */
export const MONEY_NOTE = 'Cifras a precio de venta · no es margen';
