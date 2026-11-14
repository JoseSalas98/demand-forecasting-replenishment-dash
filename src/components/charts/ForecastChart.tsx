import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNumber, NOT_AVAILABLE } from '../../format';
import type { Scenario, SeriesRow } from '../../types';
import { AXIS, COLOR, GRID, LEGEND, TOOLTIP } from '../../theme';
import { SCENARIO_LABEL } from '../Pill';

/** Bloques de test: venta completada, pronóstico del escenario activo y línea base. Nunca A y B juntos. */
export function ForecastChart({ rows, scenario, startDates }: { rows: SeriesRow[]; scenario: Scenario; startDates: Map<number, string> }) {
  const data = rows.map((r) => ({
    block: r.block,
    completed: r.units_completed,
    forecast: r.forecast ? r.forecast[scenario] : null,
    baseline: r.baseline,
  }));
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ left: 10, right: 20, top: 10 }}>
          <CartesianGrid {...GRID} />
          <XAxis {...AXIS} dataKey="block" />
          <YAxis {...AXIS} tickFormatter={(v) => fmtNumber(v)} width={70} />
          <Tooltip
            {...TOOLTIP}
            labelFormatter={(b) => `Bloque ${b} · inicia ${startDates.get(Number(b)) ?? NOT_AVAILABLE}`}
            formatter={(v) => (v === null || v === undefined ? NOT_AVAILABLE : `${fmtNumber(Number(v))} u.`)}
          />
          <Legend {...LEGEND} />
          <Line dataKey="completed" name="Venta completada (quiebres tratados)" stroke={COLOR.silver} strokeWidth={2} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="forecast" name={`Pronóstico ${SCENARIO_LABEL[scenario]}`} stroke={COLOR.cyan} strokeWidth={2} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="baseline" name="Seasonal naive (línea base)" stroke={COLOR.plum} strokeWidth={2} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="small muted">Unidades por bloque de 28 días, suma de las 10 tiendas.</p>
    </div>
  );
}
