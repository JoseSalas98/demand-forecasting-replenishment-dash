// Venta en dinero por bloque desde el lanzamiento (a precio de venta, no es margen).
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtMoney } from '../../format';
import { AXIS, COLOR, GRID, TOOLTIP } from '../../theme';
import type { DescriptiveRow } from '../../types';

export function MoneyChart({ rows }: { rows: DescriptiveRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows} margin={{ left: 0, right: 24, top: 10 }}>
        <CartesianGrid {...GRID} />
        <XAxis {...AXIS} dataKey="block" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false} />
        <YAxis {...AXIS} domain={[0, 'auto']} tickFormatter={(v) => fmtMoney(v)} width={96} />
        <Tooltip {...TOOLTIP} labelFormatter={(b) => `Bloque ${b}`} formatter={(v: number) => [fmtMoney(v), 'Venta en dinero']} />
        <Line dataKey="money_observed" name="Venta en dinero" stroke={COLOR.silver} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
