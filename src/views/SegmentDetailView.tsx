// Detalle de los grupos con pronóstico (spec 002, FR-026): pestañas por grupo Vital, comparación de
// errores, todos los artículos del grupo ordenables y la gráfica de CV de train.
import { useMemo, useState } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ModuleHeader } from '../components/ModuleHeader';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtK, fmtM, fmtNumber, fmtPct } from '../format';
import { t } from '../i18n';
import { cellName } from '../naming';
import { hashFor } from '../router';
import { AXIS, CELL_COLOR, GRID, TOOLTIP } from '../theme';
import type { Cell, Item, Items, SegmentKey, Segments } from '../types';

const MAIN: Cell[] = ['AX', 'AY', 'AZ'];
type SortKey = 'item_id' | 'spend_train' | 'cv_train' | 'wape' | 'saving';

const pct = (v: number | null) => fmtPct(v === null ? null : v * 100);

export function SegmentDetailView({ cell }: { cell: string }) {
  const segs = useData<Segments>('segments.json');
  const items = useData<Items>('items.json');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'spend_train', desc: true });
  const s = t().segDetail;

  const rows = useMemo(() => {
    if (items.status !== 'ready') return [];
    const val = (i: Item): number | string => {
      switch (sort.key) {
        case 'item_id': return i.item_id;
        case 'spend_train': return i.spend_train;
        case 'cv_train': return i.cv_train ?? -Infinity;
        case 'wape': return i.metrics.A.wape_units ?? -Infinity;
        case 'saving': return i.impact.A.impact;
      }
    };
    return items.data.items
      .filter((i) => i.cell === cell)
      .sort((a, b) => {
        const va = val(a), vb = val(b);
        const c = va < vb ? -1 : va > vb ? 1 : 0;
        return sort.desc ? -c : c;
      });
  }, [items, cell, sort]);

  const back = <p><a className="btn small" href={hashFor('/segmentacion', 'A')}><span aria-hidden="true">←</span> {s.back}</a></p>;
  if (!MAIN.includes(cell as Cell)) {
    return (
      <>
        {back}
        <ModuleHeader title={s.title} />
        <div className="note">{s.notAvailable(cellName(cell))}</div>
      </>
    );
  }
  for (const st of [segs, items]) if (st.status === 'error') return <LoadError error={st.error} />;
  if (segs.status !== 'ready' || items.status !== 'ready') return <Loading />;

  const seg = segs.data.segments;
  const cols: SegmentKey[] = [...MAIN, 'total'];
  const table: [string, (k: SegmentKey) => string][] = [
    [s.rows.n, (k) => fmtNumber(seg[k].n_items)],
    [s.rows.spend, (k) => fmtM(seg[k].spend_train)],
    [s.rows.share, (k) => fmtPct(seg[k].spend_share * 100)],
    [s.rows.wape, (k) => pct(seg[k].error.one_step.wape)],
    [s.rows.wapeBase, (k) => pct(seg[k].error.seasonal_naive.wape)],
    [s.rows.wrmsse, (k) => fmtNumber(seg[k].error.one_step.wrmsse, 3)],
    [s.rows.wrmsseBase, (k) => fmtNumber(seg[k].error.seasonal_naive.wrmsse, 3)],
  ];
  const points = MAIN.flatMap((c, k) => seg[c].cv_train.map((cv, i) => ({ x: k + 1 + ((i % 9) - 4) * 0.03, cv, cell: c })));
  const header = (key: SortKey, label: string, left = false) => (
    <th className={left ? 'left' : undefined} aria-sort={sort.key === key ? (sort.desc ? 'descending' : 'ascending') : undefined}>
      <button type="button" className="sort" onClick={() => setSort({ key, desc: sort.key === key ? !sort.desc : key !== 'item_id' })}>
        {label}{sort.key === key ? (sort.desc ? ' ↓' : ' ↑') : ''}
      </button>
    </th>
  );

  return (
    <>
      {back}
      <ModuleHeader title={s.title} subtitle={s.subtitle} />
      <div className="tabs" role="tablist" aria-label={s.tabs}>
        {MAIN.map((c) => (
          <a key={c} role="tab" aria-selected={c === cell} className={`pill${c === cell ? ' active' : ''}`} href={hashFor(`/segmentacion/${c}`, 'A')}>
            <i className="dot" style={{ background: CELL_COLOR[c] }} />{cellName(c)}
          </a>
        ))}
      </div>

      <div className="card section">
        <h2>{s.compare}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th className="left">{s.indicator}</th>{cols.map((k) => <th key={k} className={k === cell ? 'hl' : undefined}>{k === 'total' ? s.total : cellName(k)}</th>)}</tr>
            </thead>
            <tbody>
              {table.map(([label, f]) => (
                <tr key={label}><td className="left">{label}</td>{cols.map((k) => <td key={k} className={k === cell ? 'hl' : undefined}>{f(k)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">{s.compareNote}</p>
      </div>

      <div className="card section">
        <div className="card-head">
          <h2>{s.itemsOf(cellName(cell), fmtNumber(rows.length))}</h2>
          <span className="small muted">{s.sortHint}</span>
        </div>
        <div className="table-wrap scroll">
          <table>
            <thead>
              <tr>
                {header('item_id', s.colItem, true)}
                {header('spend_train', s.colSpend)}
                {header('cv_train', s.colCv)}
                {header('wape', s.colWape)}
                {header('saving', s.colSaving)}
                <th className="left">{s.colReview}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.item_id}>
                  <td className="left"><a className="btn small" href={hashFor(`/articulo/${i.item_id}`, 'A')}>{i.item_id} <span aria-hidden="true">→</span></a></td>
                  <td>{fmtK(i.spend_train, true)}</td>
                  <td>{fmtPct(i.cv_train, 1)}</td>
                  <td>{pct(i.metrics.A.wape_units)}</td>
                  <td className={i.impact.A.impact < 0 ? 'neg' : undefined}>{fmtK(i.impact.A.impact, true)}</td>
                  <td className="left">{i.metrics.A.review && <span className="tag">{s.flagged}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card section">
        <h2>{s.cvTitle}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ left: 0, right: 16, top: 10 }}>
            <CartesianGrid {...GRID} />
            <XAxis {...AXIS} type="number" dataKey="x" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={(v) => cellName(MAIN[v - 1] ?? '')} />
            <YAxis {...AXIS} type="number" dataKey="cv" name={s.cvName} width={50} />
            <Tooltip {...TOOLTIP} formatter={(v: number, n: string) => (n === s.cvName ? fmtNumber(v, 1) : '')} />
            {MAIN.map((c) => (
              <Scatter key={c} name={cellName(c)} data={points.filter((p) => p.cell === c)} fill={CELL_COLOR[c]} fillOpacity={0.55} isAnimationActive={false} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
        <p className="small muted">{s.cvNote}</p>
      </div>
    </>
  );
}
