// Distribución de las unidades por bloque (8 intervalos de igual ancho, del exportador).
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNumber } from '../../format';
import { t } from '../../i18n';
import { AXIS, COLOR, GRID, TOOLTIP } from '../../theme';
import type { Descriptive } from '../../types';

export function UnitsHistogram({ bins }: { bins: Descriptive['histogram'] }) {
  const data = bins.map((b) => ({ range: `${fmtNumber(b.from)}–${fmtNumber(b.to)}`, count: b.count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 24 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis {...AXIS} dataKey="range" interval={0} angle={-30} textAnchor="end" height={50} tick={{ ...AXIS.tick, fontSize: 11 }} />
        <YAxis {...AXIS} allowDecimals={false} width={36} />
        <Tooltip {...TOOLTIP} cursor={{ fill: COLOR.border, fillOpacity: 0.4 }} formatter={(v: number) => [t().chart.histCount(fmtNumber(v)), t().chart.histFreq]} labelFormatter={(l) => t().common.units(String(l))} />
        <Bar dataKey="count" fill={COLOR.slate} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
