// Frontera exceso ↔ venta perdida: un punto por z ya calculado, modelo frente a línea base.
// Los títulos de los ejes van en HTML fuera del SVG y la leyenda arriba, para que nada se encime.
import { CartesianGrid, ComposedChart, Legend, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNumber, fmtPct } from '../../format';
import { AXIS, COLOR, GRID, LEGEND, TOOLTIP } from '../../theme';
import type { CurvePoint } from '../../types';

interface Pt {
  x: number;
  y: number;
  z: number;
  service: number;
  series: string;
}

const toM = (c: CurvePoint[], series: string): Pt[] => c.map((p) => ({ x: p.excess / 1e6, y: p.lost / 1e6, z: p.z, service: p.service, series }));

function CurveTooltip({ active, payload }: { active?: boolean; payload?: { payload: Pt }[] }) {
  const p = active && payload?.[0]?.payload;
  if (!p) return null;
  return (
    <div style={{ ...TOOLTIP.contentStyle, padding: '8px 10px', fontSize: 13 }}>
      <div style={{ color: COLOR.textMuted }}>{p.series} · z = {fmtNumber(p.z, 2)} · servicio {fmtPct(p.service * 100)}</div>
      <div>Exceso {fmtNumber(p.x, 2)} M US$</div>
      <div>Venta perdida {fmtNumber(p.y, 2)} M US$</div>
    </div>
  );
}

export function ImpactCurve({ model, naive, index, modelLabel }: { model: CurvePoint[]; naive: CurvePoint[]; index: number; modelLabel: string }) {
  const modelName = `Modelo · ${modelLabel}`;
  const m = toM(model, modelName);
  const n = toM(naive, 'Línea base');
  const pm = m[index];
  const pn = n[index];
  return (
    <div>
      <div className="axis-title">Venta perdida (M US$)</div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid {...GRID} />
          <XAxis {...AXIS} dataKey="x" type="number" domain={[0, 'auto']} tickFormatter={(v) => fmtNumber(v, 1)} />
          <YAxis {...AXIS} dataKey="y" type="number" domain={[0, 'auto']} tickFormatter={(v) => fmtNumber(v, 1)} width={48} />
          <Tooltip content={<CurveTooltip />} />
          <Legend {...LEGEND} verticalAlign="top" align="right" height={32} />
          <Line data={m} dataKey="y" name={modelName} stroke={COLOR.cyan} strokeWidth={2} dot={{ r: 3, fill: COLOR.cyan }} isAnimationActive={false} />
          <Line data={n} dataKey="y" name="Línea base" stroke={COLOR.plum} strokeWidth={2} dot={{ r: 3, fill: COLOR.plum }} isAnimationActive={false} />
          {pm && <ReferenceDot x={pm.x} y={pm.y} r={8} fill={COLOR.cyan} stroke={COLOR.text} strokeWidth={2} />}
          {pn && <ReferenceDot x={pn.x} y={pn.y} r={8} fill={COLOR.plum} stroke={COLOR.text} strokeWidth={2} />}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="axis-title" style={{ textAlign: 'right' }}>Exceso en anaquel (M US$)</div>
    </div>
  );
}
