// Unidades por periodo del artículo (FR-031/032): lo vendido, la venta sin faltantes, el pronóstico y
// la línea base con marcadores; etiqueta de datos al pasar el cursor; acercamiento al año de prueba.
import { useMemo, useState } from 'react';
import { fmtNumber } from '../../format';
import { COLOR } from '../../theme';
import { Pill } from '../Pill';
import { ChartTip, TipRow, useChartTip } from './ChartTip';
import { niceMax } from './UnitsBandChart';

export interface ArticleRow {
  block: number;
  observed: number | null;
  completed: number | null;
  forecast: number | null;
  baseline: number | null;
}

type Key = 'observed' | 'completed' | 'forecast' | 'baseline';
const SERIES: { key: Key; name: string; color: string; dash?: string; width: number }[] = [
  { key: 'observed', name: 'Lo que se vendió', color: COLOR.silver, width: 1.6 },
  { key: 'completed', name: 'Venta sin faltantes (estimada)', color: COLOR.slate, dash: '3 4', width: 1.4 },
  { key: 'forecast', name: 'Pronóstico', color: COLOR.cyan, width: 2.6 },
  { key: 'baseline', name: 'Línea base', color: COLOR.coral, dash: '6 4', width: 2 },
];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "25 may 2015" a partir de "2015-05-25". */
export function fmtDate(iso: string | undefined): string {
  if (!iso) return 'fecha no disponible';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function ArticleChart({ rows, test, stats, startDates }: {
  rows: ArticleRow[];
  /** Tramo de prueba del artículo (constitución II.7); sin pronóstico, null. */
  test: { from: number; to: number } | null;
  stats: { mean: number; sigma: number | null; band_upper: number | null };
  startDates: Map<number, string>;
}) {
  const [zoom, setZoom] = useState(false);
  const [bands, setBands] = useState(false);
  const [on, setOn] = useState<Record<Key, boolean>>({ observed: true, completed: true, forecast: true, baseline: true });
  const { box, tip, show, hide } = useChartTip();
  const [hover, setHover] = useState<number | null>(null);

  const first = rows[0]?.block ?? 1, last = rows[rows.length - 1]?.block ?? 65;
  const x0 = zoom && test ? Math.max(first, test.from - 2) - 0.5 : first;
  const x1 = zoom && test ? test.to + 0.5 : last;
  const shown = rows.filter((r) => r.block >= Math.ceil(x0) && r.block <= Math.floor(x1));
  const series = SERIES.filter((s) => (test || s.key === 'observed') && on[s.key]);
  const yMax = useMemo(
    () => niceMax([...shown.flatMap((r) => series.map((s) => r[s.key])), ...(bands && !zoom ? [stats.band_upper, stats.mean] : [])]),
    [shown, series, bands, zoom, stats],
  );

  const W = 1200, H = zoom ? 360 : 340, m = { l: 62, r: 16, t: 18, b: 30 };
  const X = (b: number) => m.l + ((b - x0) / (x1 - x0)) * (W - m.l - m.r);
  const Y = (v: number) => H - m.b - (v / yMax) * (H - m.t - m.b);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * yMax);
  const years = new Map<number, number>();
  for (const r of rows) {
    const y = Number(startDates.get(r.block)?.slice(0, 4));
    if (y && ![...years.values()].includes(y)) years.set(r.block, y);
  }
  const xTicks: [number, string][] = zoom
    ? shown.filter((_, i) => i % 2 === 0).map((r) => {
        const d = startDates.get(r.block);
        return [r.block, d ? `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(2, 4)}` : String(r.block)];
      })
    : [...years.entries()].filter(([b]) => b > first).map(([b, y]) => [b, String(y)]);

  const path = (k: Key) => {
    let d = '', pen = false;
    for (const r of shown) {
      const v = r[k];
      if (v === null) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${X(r.block).toFixed(1)},${Y(v).toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  const mr = zoom ? 4 : 2.6;
  const hoverRow = hover === null ? undefined : rows.find((r) => r.block === hover);

  return (
    <div className="article-chart">
      <div className="chart-head">
        <div className="legend" role="group" aria-label="Series">
          {SERIES.filter((s) => test || s.key === 'observed').map((s) => (
            <button key={s.key} type="button" className="lg" aria-pressed={on[s.key]} onClick={() => setOn({ ...on, [s.key]: !on[s.key] })}>
              <i style={{ background: s.color }} />{s.name}
            </button>
          ))}
          <button type="button" className="lg" aria-pressed={bands} onClick={() => setBands(!bands)}><i style={{ background: COLOR.grey }} />Media y ±3σ</button>
        </div>
        {test && (
          <div className="seg-toggle" role="group" aria-label="Rango de la gráfica">
            <Pill small active={!zoom} onClick={() => setZoom(false)}>Toda la historia</Pill>
            <Pill small active={zoom} onClick={() => setZoom(true)}>Año de prueba</Pill>
          </div>
        )}
      </div>
      <div className="chart-box" ref={box} onMouseLeave={() => { hide(); setHover(null); }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Unidades por periodo de 4 semanas">
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={m.l} x2={W - m.r} y1={Y(v)} y2={Y(v)} stroke={COLOR.border} />
              <text x={m.l - 8} y={Y(v) + 4} textAnchor="end" className="tick">{v ? `${fmtNumber(v / 1000, v < 10000 ? 1 : 0)} mil` : '0'}</text>
            </g>
          ))}
          {xTicks.map(([b, l]) => <text key={b} x={X(b)} y={H - m.b + 18} textAnchor="middle" className="tick">{l}</text>)}
          <text x={m.l} y={11} className="axis-label">unidades</text>
          {test && (
            <g>
              <rect x={X(Math.max(x0, test.from - 0.5))} y={m.t} width={X(Math.min(x1, test.to + 0.5)) - X(Math.max(x0, test.from - 0.5))} height={H - m.t - m.b} className="test-shade" />
              <text x={(X(Math.max(x0, test.from - 0.5)) + X(Math.min(x1, test.to + 0.5))) / 2} y={m.t + 14} textAnchor="middle" className="axis-label">año de prueba</text>
            </g>
          )}
          {bands && stats.band_upper !== null && (
            <g>
              <rect x={X(x0)} y={Y(Math.min(stats.band_upper, yMax))} width={X(x1) - X(x0)} height={Y(0) - Y(Math.min(stats.band_upper, yMax))} className="band" />
              <line x1={X(x0)} x2={X(x1)} y1={Y(stats.mean)} y2={Y(stats.mean)} stroke={COLOR.grey} strokeWidth={2} />
              <text x={X(x0) + 6} y={Y(stats.mean) - 5} className="axis-label">media</text>
              {stats.band_upper <= yMax && <text x={X(x0) + 6} y={Y(stats.band_upper) - 5} className="axis-label">+3σ</text>}
            </g>
          )}
          {series.map((s) => <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinejoin="round" />)}
          {on.baseline && test && shown.filter((r) => r.baseline !== null).map((r) => (
            <rect key={`b${r.block}`} x={X(r.block) - mr} y={Y(r.baseline!) - mr} width={2 * mr} height={2 * mr} fill={COLOR.coral} transform={`rotate(45 ${X(r.block)} ${Y(r.baseline!)})`} />
          ))}
          {on.forecast && test && shown.filter((r) => r.forecast !== null).map((r) => (
            <circle key={`f${r.block}`} cx={X(r.block)} cy={Y(r.forecast!)} r={mr + 0.6} fill={COLOR.cyan} stroke={COLOR.bg} strokeWidth={1} />
          ))}
          {hoverRow && (
            <g>
              <line x1={X(hoverRow.block)} x2={X(hoverRow.block)} y1={m.t} y2={H - m.b} stroke={COLOR.text} strokeOpacity={0.35} />
              {series.map((s) => hoverRow[s.key] !== null && <circle key={s.key} cx={X(hoverRow.block)} cy={Y(hoverRow[s.key]!)} r={4} fill={s.color} stroke={COLOR.bg} strokeWidth={1.5} />)}
            </g>
          )}
          <rect
            x={m.l}
            y={m.t}
            width={W - m.l - m.r}
            height={H - m.t - m.b}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseMove={(e) => {
              const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              const sx = ((e.clientX - r.left) * W) / r.width;
              const b = Math.max(Math.ceil(x0), Math.min(Math.floor(x1), Math.round(x0 + ((sx - m.l) / (W - m.l - m.r)) * (x1 - x0))));
              const row = rows.find((q) => q.block === b);
              setHover(b);
              if (!row) return;
              const inTest = test !== null && b >= test.from && b <= test.to;
              const stockout = row.observed !== null && row.completed !== null && row.observed < row.completed * 0.8;
              show(e, (
                <>
                  <strong>Periodo del {fmtDate(startDates.get(b))}</strong>
                  {inTest && <span className="tip-foot" style={{ marginTop: 0 }}>año de prueba</span>}
                  {series.filter((s) => row[s.key] !== null).map((s) => <TipRow key={s.key} color={s.color} label={s.name} value={`${fmtNumber(row[s.key])} u.`} />)}
                  {stockout && <span className="tip-foot">Hubo faltante de producto en este periodo.</span>}
                </>
              ));
            }}
          />
        </svg>
        <ChartTip tip={tip} width={box.current?.clientWidth ?? 800} />
      </div>
    </div>
  );
}
