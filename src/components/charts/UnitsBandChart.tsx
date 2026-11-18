// Unidades por bloque desde el lanzamiento, con la media y las bandas ±3σ; para los 517, el tramo
// de test con el pronóstico del escenario activo, la línea base y la venta completada.
// Recharts 2 no recorre fragmentos: cada elemento del gráfico va como hijo directo.
import { CartesianGrid, ComposedChart, Legend, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNumber, NOT_AVAILABLE } from '../../format';
import { AXIS, COLOR, GRID, LEGEND, TOOLTIP } from '../../theme';
import type { Descriptive, Scenario, SeriesRow } from '../../types';

/** Margen sobre el valor más alto para que las bandas y los rótulos no queden pegados al borde. */
export const Y_HEADROOM = 0.08;

export interface TestOverlay {
  from: number;
  to: number;
  rows: SeriesRow[];
  scenario: Scenario;
  /** Último bloque revelado (playground); sin valor, todo el tramo de test. */
  revealUpTo?: number;
}

/** Tope "redondo" del eje Y que contiene todos los elementos del gráfico. */
export function niceMax(values: (number | null | undefined)[], headroom = Y_HEADROOM): number {
  const max = Math.max(0, ...values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)));
  if (max === 0) return 1;
  const target = max * (1 + headroom);
  const step = 10 ** Math.floor(Math.log10(target));
  for (const m of [1, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10]) if (m * step >= target) return m * step;
  return 10 * step;
}

export function UnitsBandChart({ data, test, startDates, height = 340 }: { data: Descriptive; test?: TestOverlay; startDates?: Map<number, string>; height?: number }) {
  const { stats } = data;
  const byBlock = new Map((test?.rows ?? []).map((r) => [r.block, r]));
  const reveal = test?.revealUpTo ?? Infinity;
  const rows = data.rows.map((r) => {
    const s = byBlock.get(r.block);
    const inTest = test !== undefined && r.block >= test.from && r.block <= test.to;
    const shown = r.block <= reveal;
    return {
      block: r.block,
      units: shown ? r.units_observed : null,
      forecast: inTest && shown && s?.forecast ? s.forecast[test.scenario] : null,
      baseline: inTest && shown ? s?.baseline ?? null : null,
      completed: inTest && shown ? s?.units_completed ?? null : null,
    };
  });
  const lowerBelowZero = stats.band_lower !== null && stats.band_lower < 0;
  const lower = stats.band_lower === null ? null : Math.max(0, stats.band_lower);
  const first = data.rows[0]?.block ?? 1;
  const last = data.rows[data.rows.length - 1]?.block ?? 65;
  // El tope incluye las bandas y el pronóstico aunque todavía no se hayan revelado: la escala no salta al avanzar
  const yMax = niceMax([
    stats.band_upper,
    stats.mean,
    ...data.rows.map((r) => r.units_observed),
    ...(test?.rows ?? []).flatMap((r) => [r.forecast?.[test!.scenario], r.baseline, r.units_completed]),
  ]);
  const label = (value: string, fill: string = COLOR.textMuted) => ({ value, position: 'insideTopRight' as const, fill, fontSize: 12 });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ left: 0, right: 16, top: 28, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis {...AXIS} dataKey="block" type="number" domain={[first, last]} allowDecimals={false} />
        <YAxis {...AXIS} domain={[0, yMax]} allowDataOverflow tickFormatter={(v) => fmtNumber(v)} width={64} />
        <Tooltip
          {...TOOLTIP}
          labelFormatter={(b) => `Periodo ${b}${startDates?.get(Number(b)) ? ` · inicia ${startDates.get(Number(b))}` : ''}`}
          formatter={(v) => (v === null || v === undefined ? NOT_AVAILABLE : `${fmtNumber(Number(v))} u.`)}
        />
        <Legend {...LEGEND} />
        {test && test.from > first && (
          <ReferenceArea x1={first} x2={test.from} fill="none" ifOverflow="extendDomain" label={{ value: 'Historia', position: 'insideTop', fill: COLOR.textMuted, fontSize: 12 }} />
        )}
        {test && (
          <ReferenceArea
            x1={test.from}
            x2={test.to}
            fill={COLOR.cyan}
            fillOpacity={0.1}
            label={{ value: `Año de prueba (${test.to - test.from + 1} periodos)`, position: 'insideTop', fill: COLOR.cyan, fontSize: 12 }}
          />
        )}
        {stats.band_upper !== null && <ReferenceLine y={stats.band_upper} stroke={COLOR.slate} strokeDasharray="5 4" label={label('+3σ')} />}
        {lower !== null && (
          <ReferenceLine y={lower} stroke={COLOR.slate} strokeDasharray="5 4" label={{ ...label(lowerBelowZero ? '−3σ < 0 (se dibuja en 0)' : '−3σ'), position: 'insideBottomRight' }} />
        )}
        <ReferenceLine y={stats.mean} stroke={COLOR.grey} strokeWidth={2} label={label('media')} />
        <Line dataKey="units" name="Lo que se vendió" stroke={COLOR.silver} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
        {test && (
          <Line dataKey="completed" name="Venta sin faltantes (estimada)" stroke={COLOR.silver} strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls={false} isAnimationActive={false} />
        )}
        {test && (
          <Line dataKey="forecast" name="Pronóstico" stroke={COLOR.cyan} strokeWidth={2} dot={{ r: 3, fill: COLOR.cyan }} connectNulls={false} isAnimationActive={false} />
        )}
        {test && (
          <Line dataKey="baseline" name="Línea base" stroke={COLOR.coral} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: COLOR.coral }} connectNulls={false} isAnimationActive={false} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
