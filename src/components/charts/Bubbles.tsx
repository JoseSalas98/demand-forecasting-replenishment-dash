// Grupos del catálogo como burbujas agrupadas por familia (spec 002, FR-020/021).
// Radio ∝ √valor; Vitales a la izquierda, Útiles arriba a la derecha, Complementarios abajo.
import { useMemo, type CSSProperties } from 'react';
import { fmtM, fmtNumber } from '../../format';
import { cellDefinition, cellName, cellSingular, FAMILIES, FAMILY_DEF, FAMILY_NAME, LEVEL_NAME, LEVELS, type Family } from '../../naming';
import { LEVEL_COLOR } from '../../theme';
import type { MatrixCell } from '../../types';
import { ChartTip, useChartTip } from './ChartTip';

export type SizeMode = 'spend' | 'n';
const W = 760, H = 600, PAD = 5;

interface Placed {
  family: Family;
  cx: number;
  cy: number;
  R: number;
  cells: { cell: string; x: number; y: number; r: number }[];
}

/** Coloca las tres familias y sus tres grupos (triángulo tangente) dentro del lienzo. */
export function bubbleLayout(matrix: MatrixCell[], mode: SizeMode): Placed[] {
  const val = (c: string) => {
    const m = matrix.find((x) => x.cell === c);
    return m ? (mode === 'spend' ? m.spend : m.n_items) : 0;
  };
  const cluster = (f: Family, k: number) => {
    const rs = LEVELS.map((l) => k * Math.sqrt(val(f + l)));
    const [r1, r2, r3] = rs;
    const d = r1 + r2 + PAD, a13 = r1 + r3 + PAD, a23 = r2 + r3 + PAD;
    const x3 = (a13 * a13 - a23 * a23 + d * d) / (2 * d);
    const y3 = Math.sqrt(Math.max(0, a13 * a13 - x3 * x3));
    let pts = [[0, 0], [d, 0], [x3, y3]];
    const minX = Math.min(...pts.map((p, i) => p[0] - rs[i])), maxX = Math.max(...pts.map((p, i) => p[0] + rs[i]));
    const minY = Math.min(...pts.map((p, i) => p[1] - rs[i])), maxY = Math.max(...pts.map((p, i) => p[1] + rs[i]));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    pts = pts.map((p) => [p[0] - cx, p[1] - cy]);
    const R = Math.max(...pts.map((p, i) => Math.hypot(p[0], p[1]) + rs[i])) + 12;
    return { rs, pts, R };
  };
  const P = 14, LAB = 50, LABA = 64;
  let k = 1;
  for (let it = 0; it < 6; it++) {
    const [A, B, C] = FAMILIES.map((f) => cluster(f, k));
    const kw = (W - 3 * P) / (2 * A.R + 2 * Math.max(B.R, C.R));
    const kh1 = (H - LABA - P) / (2 * A.R);
    const kh2 = (H - 2 * LAB - 2 * P) / (2 * B.R + 2 * C.R);
    k *= Math.min(kw, kh1, kh2);
  }
  const [A, B, C] = FAMILIES.map((f) => cluster(f, k));
  const rx = Math.max(B.R, C.R);
  const free = W - 2 * A.R - 2 * rx;
  const restH = H - 2 * B.R - 2 * C.R - 2 * LAB;
  const by = restH / 3 + B.R;
  const pos: Record<Family, [number, number]> = {
    A: [free / 3 + A.R, (H - LABA) / 2],
    B: [W - free / 3 - rx, by],
    C: [W - free / 3 - rx, by + B.R + LAB + restH / 3 + C.R],
  };
  return FAMILIES.map((f, i) => {
    const c = [A, B, C][i];
    const [cx, cy] = pos[f];
    return { family: f, cx, cy, R: c.R, cells: LEVELS.map((l, j) => ({ cell: f + l, x: cx + c.pts[j][0], y: cy + c.pts[j][1], r: c.rs[j] })) };
  });
}

const move = (x: number, y: number): CSSProperties => ({ transform: `translate(${x}px, ${y}px)` });

export function Bubbles({ matrix, selected, onSelect, mode }: { matrix: MatrixCell[]; selected: string; onSelect: (cell: string) => void; mode: SizeMode }) {
  const placed = useMemo(() => bubbleLayout(matrix, mode), [matrix, mode]);
  const { box, tip, show, hide } = useChartTip();
  const byCell = new Map(matrix.map((m) => [m.cell, m]));
  const famTotal = (f: Family) => matrix.filter((m) => m.cell[0] === f).reduce((a, m) => ({ n: a.n + m.n_items, s: a.s + m.spend }), { n: 0, s: 0 });

  return (
    <div className="bubbles" ref={box} onMouseLeave={hide}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Grupos del catálogo">
        {placed.map((p, fi) => {
          const t = famTotal(p.family);
          return (
            <g key={p.family}>
              <g className="halo-g" style={move(p.cx, p.cy)} onMouseMove={(e) => show(e, <><strong>{FAMILY_NAME[p.family]}</strong><span>{FAMILY_DEF[p.family]}</span><span className="tip-foot">{fmtNumber(t.n)} artículos · {fmtM(t.s)} de venta</span></>)}>
                <g className="float" style={{ animationName: 'float-c', animationDuration: `${11 + fi * 2}s` }}>
                  <circle className="halo" cx={0} cy={0} r={p.R} style={{ r: `${p.R}px` } as CSSProperties} />
                </g>
              </g>
              <g className="fam-label" style={move(p.cx, p.cy + p.R + 24)}>
                <text className="fam-name" textAnchor="middle">{FAMILY_NAME[p.family]}</text>
                <text className="fam-sub" y={20} textAnchor="middle">{fmtNumber(t.n)} artículos · {fmtM(t.s)}</text>
                {p.family === 'A' && <text className="fam-tag" y={39} textAnchor="middle">CON PRONÓSTICO</text>}
              </g>
              {p.cells.map((c, j) => {
                const m = byCell.get(c.cell);
                const fs = Math.max(11, Math.min(16, c.r / 3.8));
                const small = c.r < 34;
                const label = mode === 'spend' ? `${fmtNumber((m?.spend ?? 0) / 1e6, 1)} M` : fmtNumber(m?.n_items ?? 0);
                const pick = () => onSelect(c.cell);
                return (
                  <g
                    key={c.cell}
                    className={`bub${selected === c.cell ? ' sel' : ''}`}
                    style={move(c.x, c.y)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selected === c.cell}
                    aria-label={`${cellName(c.cell)}: ${fmtNumber(m?.n_items ?? 0)} artículos`}
                    onClick={pick}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        pick();
                      }
                    }}
                    onMouseMove={(e) => {
                      e.stopPropagation();
                      show(e, <><strong>{cellSingular(c.cell).replace(/^a/, 'A')}</strong><span>{cellDefinition(c.cell)}</span><span className="tip-foot">{fmtNumber(m?.n_items ?? 0)} artículos · {fmtM(m?.spend ?? 0)} de venta · clic para ver su perfil</span></>);
                    }}
                  >
                    <g className="float" style={{ animationName: ['float-a', 'float-b', 'float-c'][(fi + j) % 3], animationDuration: `${(6.5 + ((fi * 3 + j) * 1.7) % 4.5).toFixed(1)}s`, animationDelay: `${-((fi * 5 + j * 3) % 7)}s` }}>
                      <g className="lift">
                        <circle className="ball" cx={0} cy={0} r={c.r} fill={LEVEL_COLOR[c.cell[1]]} stroke={LEVEL_COLOR[c.cell[1]]} style={{ r: `${c.r}px` } as CSSProperties} />
                        {!small && <text className="bub-name" y={-fs * 0.2} textAnchor="middle" style={{ fontSize: fs }}>{LEVEL_NAME[c.cell[1] as 'X']}</text>}
                        <text className="bub-val" y={small ? fs * 0.4 : fs * 1.1} textAnchor="middle" style={{ fontSize: fs * 1.2 }}>{label}</text>
                      </g>
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <ChartTip tip={tip} width={box.current?.clientWidth ?? 600} />
    </div>
  );
}
