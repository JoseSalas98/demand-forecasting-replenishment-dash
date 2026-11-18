// Embudo del catálogo a lo que se pronostica (FR-025); ancho en escala logarítmica.
import { fmtNumber } from '../../format';
import type { FunnelStage } from '../../types';

const LABELS: Record<string, [string, string]> = {
  series: ['combinaciones tienda × artículo', '10 tiendas × 3.049 artículos'],
  items: ['artículos', 'ventas sumadas de las 10 tiendas'],
  segment_a: ['Vitales', 'el primer 60 % de la venta'],
  forecasted: ['con pronóstico', 'los Vitales que pasan los filtros'],
};

export function Funnel({ stages }: { stages: FunnelStage[] }) {
  const W = 700, rowH = 58, H = stages.length * rowH + 8, maxW = 380, minW = 120, cx = 200;
  const counts = stages.map((s) => s.count);
  const lo = Math.log10(Math.min(...counts)) - 0.1, hi = Math.log10(Math.max(...counts));
  const w = (n: number) => minW + ((Math.log10(n) - lo) / (hi - lo)) * (maxW - minW);
  return (
    <svg className="funnel-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Embudo del catálogo a lo que se pronostica">
      {stages.map((s, i) => {
        const y = 4 + i * rowH, w1 = w(s.count), w2 = i < stages.length - 1 ? w(stages[i + 1].count) : w(s.count) * 0.94;
        const last = i === stages.length - 1;
        const [label, sub] = LABELS[s.key] ?? [s.label, ''];
        return (
          <g key={s.key}>
            <path d={`M${cx - w1 / 2},${y} L${cx + w1 / 2},${y} L${cx + w2 / 2},${y + rowH - 6} L${cx - w2 / 2},${y + rowH - 6} Z`} className={last ? 'stage last' : 'stage'} style={{ opacity: last ? 1 : 0.4 + i * 0.15 }} />
            <text x={cx} y={y + rowH / 2 + 3} textAnchor="middle" className="stage-n">{fmtNumber(s.count)}</text>
            <text x={cx + maxW / 2 + 24} y={y + rowH / 2 - 4} className="stage-l">{label}</text>
            <text x={cx + maxW / 2 + 24} y={y + rowH / 2 + 14} className="stage-s">{sub}</text>
          </g>
        );
      })}
    </svg>
  );
}
