// Embudo centrado: cada etapa es un trapecio que se angosta hacia la siguiente (funnel.json).
// Entre 30.490 y 517 hay casi dos órdenes de magnitud, así que el ancho sigue una escala
// logarítmica: indica el orden y el estrechamiento; las cifras escritas son las reales.
import { fmtNumber } from '../../format';
import type { FunnelStage } from '../../types';

const MIN_W = 34; // % del ancho para la etapa más chica: la cifra debe caber dentro
const MAX_W = 100;

export function funnelWidths(counts: number[]): number[] {
  const logs = counts.map((c) => Math.log10(Math.max(c, 1)));
  const hi = Math.max(...logs);
  const lo = Math.min(...logs);
  return logs.map((l) => (hi === lo ? MAX_W : MIN_W + ((MAX_W - MIN_W) * (l - lo)) / (hi - lo)));
}

export function FunnelBar({ stages }: { stages: FunnelStage[] }) {
  const widths = funnelWidths(stages.map((s) => s.count));
  return (
    <div className="funnel" role="list">
      {stages.map((s, i) => {
        const top = widths[i];
        const bottom = i < widths.length - 1 ? widths[i + 1] : top * 0.92;
        const clip = `polygon(${50 - top / 2}% 0, ${50 + top / 2}% 0, ${50 + bottom / 2}% 100%, ${50 - bottom / 2}% 100%)`;
        return (
          <div key={s.key} className="funnel-row" role="listitem">
            <div className={`funnel-shape${s.key === 'forecasted' ? ' forecast' : ''}`} style={{ clipPath: clip }}>
              <span className="funnel-count">{fmtNumber(s.count)}</span>
            </div>
            <div className="funnel-label">
              {s.label}
              {s.by_cell && (
                <div className="small">
                  {Object.entries(s.by_cell).map(([c, n]) => `${c} ${fmtNumber(n)}`).join(' · ')}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <p className="legend-note">El ancho de cada etapa sigue una escala logarítmica; las cifras son las reales.</p>
    </div>
  );
}
