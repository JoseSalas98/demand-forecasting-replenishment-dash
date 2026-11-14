// Perfil de segmentos: mediana de cada eje normalizada por la mediana global (1,0 = global).
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { fmtNumber } from '../../format';
import { CELL_COLOR, COLOR, LEGEND, TOOLTIP } from '../../theme';
import type { Segmentation } from '../../types';

export const AXIS_LABEL: Record<string, string> = {
  spend: 'Gasto (train)',
  usage_units: 'Unidades',
  cv: 'CV',
  zero_share: '% días en cero',
  velocity: 'Velocidad',
};

const MAIN = ['AX', 'AY', 'AZ'];

export function SegmentRadar({ data, selected }: { data: Segmentation; selected: string }) {
  const { axes, cells } = data.radar;
  const shown = MAIN.includes(selected) ? MAIN : [selected];
  const rows = axes.map((a) => {
    const row: Record<string, number | string> = { axis: AXIS_LABEL[a] ?? a, global: 1 };
    for (const c of shown) row[c] = cells[c]?.[a]?.median_norm ?? 0;
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={rows} outerRadius="72%">
        <PolarGrid stroke={COLOR.border} />
        <PolarAngleAxis dataKey="axis" tick={{ fill: COLOR.textMuted, fontSize: 12 }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Tooltip {...TOOLTIP} formatter={(v: number, name: string) => [fmtNumber(v, 2), name]} />
        <Legend {...LEGEND} />
        <Radar name="Mediana global (1,0)" dataKey="global" stroke={COLOR.grey} strokeDasharray="4 4" fill="none" isAnimationActive={false} />
        {shown.map((c) => {
          const color = CELL_COLOR[c] ?? COLOR.slate;
          const dim = MAIN.includes(selected) && c !== selected;
          return (
            <Radar
              key={c}
              name={c}
              dataKey={c}
              stroke={color}
              strokeWidth={2}
              strokeOpacity={dim ? 0.25 : 1}
              fill={color}
              fillOpacity={dim ? 0.04 : 0.18}
              isAnimationActive={false}
            />
          );
        })}
      </RadarChart>
    </ResponsiveContainer>
  );
}
