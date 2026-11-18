// Curva sobrante vs. ventas perdidas del total (pronóstico y línea base) con los dos puntos del
// % de demanda atendida elegido y la línea del sobrante evitado (detalle de Impacto, FR-043).
import { fmtM, fmtNumber } from '../../format';
import type { CurveReading } from '../../impactMath';
import { COLOR } from '../../theme';
import type { CurvePoint } from '../../types';

export function TradeoffCurve({ model, naive, m, n }: { model: CurvePoint[]; naive: CurvePoint[]; m: CurveReading; n: CurveReading }) {
  const W = 1200, H = 420, mg = { l: 70, r: 16, t: 26, b: 30 }, XM = 12e6, YM = 4e6;
  const X = (v: number) => mg.l + (v / XM) * (W - mg.l - mg.r);
  const Y = (v: number) => H - mg.b - (v / YM) * (H - mg.t - mg.b);
  const d = (c: CurvePoint[]) => c.filter((p) => p.excess <= XM && p.lost <= YM).map((p, i) => `${i ? 'L' : 'M'}${X(p.excess).toFixed(1)},${Y(p.lost).toFixed(1)}`).join('');
  return (
    <svg className="tradeoff" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Curva de mercancía sobrante frente a ventas perdidas">
      {[0, 1e6, 2e6, 3e6, 4e6].map((v) => (
        <g key={v}>
          <line x1={mg.l} x2={W - mg.r} y1={Y(v)} y2={Y(v)} stroke={COLOR.border} />
          <text x={mg.l - 8} y={Y(v) + 4} textAnchor="end" className="tick">{v ? `${fmtNumber(v / 1e6)} M` : '0'}</text>
        </g>
      ))}
      {[0, 3e6, 6e6, 9e6, 12e6].map((v) => <text key={v} x={X(v)} y={H - mg.b + 18} textAnchor="middle" className="tick">{v ? `${fmtNumber(v / 1e6)} M` : '0'}</text>)}
      <text x={mg.l} y={14} className="axis-label">ventas perdidas (US$) ↑ · mercancía sobrante (US$) →</text>
      <path d={d(naive)} fill="none" stroke={COLOR.coral} strokeWidth={2} />
      <path d={d(model)} fill="none" stroke={COLOR.cyan} strokeWidth={2.4} />
      <line x1={X(m.excess)} x2={X(n.excess)} y1={Y(m.lost)} y2={Y(m.lost)} stroke={COLOR.good} strokeWidth={2} strokeDasharray="4 3" />
      <circle cx={X(m.excess)} cy={Y(m.lost)} r={6} fill={COLOR.cyan} />
      <circle cx={X(n.excess)} cy={Y(n.lost)} r={6} fill={COLOR.coral} />
      <text x={X(m.excess) + 12} y={Y(m.lost) - 10} className="axis-label">sobrante evitado {fmtM(n.excess - m.excess)}</text>
    </svg>
  );
}
