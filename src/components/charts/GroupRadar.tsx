// Radar de un grupo frente a los tres grupos Vitales y el artículo típico (1×). Sin marcadores fijos:
// al pasar el cursor por un eje se resalta y un recuadro muestra el valor real de cada grupo (FR-023).
import { useState } from 'react';
import { cellName } from '../../naming';
import { COLOR, LEVEL_COLOR } from '../../theme';
import type { Segmentation } from '../../types';
import { ChartTip, TipRow, useChartTip } from './ChartTip';

export const AXIS_LABEL: Record<string, string> = {
  spend: 'Venta',
  usage_units: 'Unidades',
  cv: 'Variabilidad',
  zero_share: 'Días sin venta',
  velocity: 'Unidades por día',
};

const W = 480, H = 330, CX = W / 2, CY = H / 2 + 4, R = 118, MAX = 5;
const VITALS = ['AX', 'AY', 'AZ'];

/** Color del grupo elegido: el de su regularidad si es Vital; si no, texto (para no confundirlo con un Vital). */
export function groupColor(cell: string): string {
  return VITALS.includes(cell) ? LEVEL_COLOR[cell[1]] : COLOR.text;
}

export function GroupRadar({ data, selected, visible, formatRaw }: {
  data: Segmentation;
  selected: string;
  /** Vitales visibles además del elegido. */
  visible: Record<string, boolean>;
  formatRaw: (axis: string, v: number) => string;
}) {
  const axes = data.radar.axes;
  const { box, tip, show, hide } = useChartTip();
  const [axisHover, setAxisHover] = useState<number | null>(null);
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
  const pt = (i: number, v: number) => {
    const k = (R * Math.min(v, MAX)) / MAX;
    return [CX + Math.cos(ang(i)) * k, CY + Math.sin(ang(i)) * k];
  };
  const ring = (v: number) => axes.map((_, i) => pt(i, v).join(',')).join(' ');
  const poly = (cell: string) => axes.map((a, i) => pt(i, data.radar.cells[cell]?.[a]?.median_norm ?? 0).join(',')).join(' ');
  const series = [selected, ...VITALS.filter((v) => v !== selected && visible[v])];
  const step = (2 * Math.PI) / axes.length;
  const RR = R * 1.25;

  return (
    <div className="radar" ref={box} onMouseLeave={() => { hide(); setAxisHover(null); }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Radar de ${cellName(selected)} frente a los grupos Vitales`}>
        {[1, 2, 3, 4, 5].map((k) => <polygon key={k} points={ring(k)} fill="none" stroke={COLOR.border} />)}
        {axes.map((a, i) => {
          const [x, y] = pt(i, MAX);
          const [lx, ly] = pt(i, MAX * (i === 0 ? 1.22 : 1.16));
          return (
            <g key={a}>
              <line x1={CX} y1={CY} x2={x} y2={y} stroke={axisHover === i ? COLOR.text : COLOR.border} strokeOpacity={axisHover === i ? 0.6 : 1} />
              <text x={lx} y={ly + 4} className="axis-label" textAnchor={Math.abs(lx - CX) < 12 ? 'middle' : lx < CX ? 'end' : 'start'}>{AXIS_LABEL[a] ?? a}</text>
            </g>
          );
        })}
        {[1, 3].map((k) => <text key={k} x={CX + 5} y={CY - (R * k) / MAX - 3} className="tick">{k}×</text>)}
        <polygon points={ring(1)} fill="none" stroke={COLOR.text} strokeOpacity={0.55} strokeDasharray="3 3" strokeWidth={1.4} />
        {series.slice(1).map((v) => <polygon key={v} points={poly(v)} fill="none" stroke={LEVEL_COLOR[v[1]]} strokeWidth={1.8} />)}
        <polygon points={poly(selected)} fill={groupColor(selected)} fillOpacity={0.28} stroke={groupColor(selected)} strokeWidth={2.8} strokeLinejoin="round" />
        {axisHover !== null && series.map((v) => {
          const [x, y] = pt(axisHover, data.radar.cells[v]?.[axes[axisHover]]?.median_norm ?? 0);
          return <circle key={v} cx={x} cy={y} r={4} fill={v === selected ? groupColor(v) : LEVEL_COLOR[v[1]]} stroke={COLOR.bg} strokeWidth={1.5} />;
        })}
        {axes.map((a, i) => {
          const a0 = ang(i) - step / 2, a1 = ang(i) + step / 2;
          return (
            <path
              key={a}
              d={`M${CX},${CY} L${CX + Math.cos(a0) * RR},${CY + Math.sin(a0) * RR} A${RR},${RR} 0 0 1 ${CX + Math.cos(a1) * RR},${CY + Math.sin(a1) * RR} Z`}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseMove={(e) => {
                setAxisHover(i);
                show(e, (
                  <>
                    <strong>{AXIS_LABEL[a] ?? a}</strong>
                    {series.map((v) => {
                      const c = data.radar.cells[v]?.[a];
                      return <TipRow key={v} color={v === selected ? groupColor(v) : LEVEL_COLOR[v[1]]} label={cellName(v)} value={c ? `${formatRaw(a, c.median_raw)} · ${c.median_norm.toFixed(1).replace('.', ',')}×` : 'no disponible'} />;
                    })}
                    <span className="tip-foot">Artículo típico del catálogo: {formatRaw(a, data.radar.global_median[a])} (1×)</span>
                  </>
                ));
              }}
            />
          );
        })}
      </svg>
      <ChartTip tip={tip} width={box.current?.clientWidth ?? 480} />
    </div>
  );
}
