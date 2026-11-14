import { useState } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { FunnelBar } from '../components/charts/FunnelBar';
import { SegmentMatrix } from '../components/charts/SegmentMatrix';
import { AXIS_LABEL, SegmentRadar } from '../components/charts/SegmentRadar';
import { HelpTip } from '../components/HelpTip';
import { ModuleHeader } from '../components/ModuleHeader';
import { Money } from '../components/Money';
import { LoadError, Loading, Pending } from '../components/StateViews';
import { useData } from '../data';
import { fmtNumber, fmtPct } from '../format';
import { hashFor } from '../router';
import { AXIS, CELL_COLOR, GRID, TOOLTIP } from '../theme';
import type { Cell, Funnel, Meta, Scenario, Segmentation, SegmentKey, Segments } from '../types';

const MAIN: Cell[] = ['AX', 'AY', 'AZ'];

/** Valor crudo de un eje del radar con su unidad. */
function RawValue({ axis, value }: { axis: string; value: number }) {
  switch (axis) {
    case 'spend': return <Money value={value} compact />;
    case 'cv': return <>{fmtPct(value)}</>;
    case 'zero_share': return <>{fmtPct(value * 100)}</>;
    case 'usage_units': return <>{fmtNumber(value)} u.</>;
    default: return <>{fmtNumber(value, 2)}</>;
  }
}

function FunnelCard({ scenario }: { scenario: Scenario }) {
  const funnel = useData<Funnel>('funnel.json');
  if (funnel.status === 'error') return <div className="card"><LoadError error={funnel.error} /></div>;
  if (funnel.status !== 'ready') return <div className="card"><Loading /></div>;
  const f = funnel.data;
  return (
    <div className="card section">
      <h2>Embudo: del catálogo a lo que se pronostica</h2>
      <FunnelBar stages={f.stages} />
      <div className="cards" style={{ marginTop: 16 }}>
        <div>
          <div className="label">Gasto de train (años 1–4) de toda la cadena que cubren los 517</div>
          <div className="big-number">{fmtPct(f.money_at_stake.train_spend_share_517 * 100)}</div>
        </div>
        <div>
          <div className="label">Demanda del año de test de los 517</div>
          <div className="big-number"><Money value={f.money_at_stake.test_demand_517} /></div>
        </div>
      </div>
      <p className="small" style={{ marginTop: 8 }}>
        <a href={hashFor('/impacto', scenario)}>Ver el impacto en dinero →</a>
      </p>
    </div>
  );
}

function ComparisonCard() {
  const segs = useData<Segments>('segments.json');
  if (segs.status === 'error') return <div className="card section"><LoadError error={segs.error} /></div>;
  if (segs.status !== 'ready') return <div className="card section"><Loading /></div>;
  const seg = segs.data.segments;
  const keys: SegmentKey[] = [...MAIN, 'total'];
  // Distribución del CV de train de los 517: un punto por artículo, sin estadísticos nuevos
  const points = MAIN.flatMap((c, k) => seg[c].cv_train.map((cv, i) => ({ x: k + 1 + ((i % 9) - 4) * 0.03, cv, cell: c })));
  const wape = (v: number | null) => fmtPct(v === null ? null : v * 100);
  return (
    <div className="card section">
      <h2>Comparación AX · AY · AZ (los 517 pronosticados)</h2>
      <div className="grid-2">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                {keys.map((k) => (
                  <th key={k}><a href={hashFor(`/segmentacion/${k}`, 'A')}>{k === 'total' ? 'Total' : k}</a></th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><td>Artículos</td>{keys.map((k) => <td key={k}>{fmtNumber(seg[k].n_items)}</td>)}</tr>
              <tr><td>Gasto de train</td>{keys.map((k) => <td key={k}><Money value={seg[k].spend_train} compact /></td>)}</tr>
              <tr><td>% del gasto de la cadena</td>{keys.map((k) => <td key={k}>{fmtPct(seg[k].spend_share * 100)}</td>)}</tr>
              <tr><td>WRMSSE · A · a un paso</td>{keys.map((k) => <td key={k}>{fmtNumber(seg[k].error.one_step.wrmsse, 3)}</td>)}</tr>
              <tr><td>WRMSSE · B · encadenado</td>{keys.map((k) => <td key={k}>{fmtNumber(seg[k].error.chained.wrmsse, 3)}</td>)}</tr>
              <tr><td>WRMSSE · línea base</td>{keys.map((k) => <td key={k}>{fmtNumber(seg[k].error.seasonal_naive.wrmsse, 3)}</td>)}</tr>
              <tr><td>WAPE · A · a un paso</td>{keys.map((k) => <td key={k}>{wape(seg[k].error.one_step.wape)}</td>)}</tr>
              <tr><td>WAPE · B · encadenado</td>{keys.map((k) => <td key={k}>{wape(seg[k].error.chained.wape)}</td>)}</tr>
              <tr><td>WAPE · línea base</td>{keys.map((k) => <td key={k}>{wape(seg[k].error.seasonal_naive.wape)}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <div>
          <div className="label">CV de train de cada artículo (segmentación)</div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ left: 0, right: 16, top: 10 }}>
              <CartesianGrid {...GRID} />
              <XAxis {...AXIS} type="number" dataKey="x" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={(v) => MAIN[v - 1] ?? ''} />
              <YAxis {...AXIS} type="number" dataKey="cv" name="CV de train" width={50} />
              <Tooltip {...TOOLTIP} formatter={(v: number, n: string) => (n === 'CV de train' ? fmtNumber(v, 1) : '')} />
              {MAIN.map((c) => (
                <Scatter key={c} name={c} data={points.filter((p) => p.cell === c)} fill={CELL_COLOR[c]} fillOpacity={0.55} isAnimationActive={false} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <p className="small muted">Un punto por artículo; más arriba, venta más variable de bloque a bloque.</p>
        </div>
      </div>
    </div>
  );
}

export function SegmentationView({ scenario }: { scenario: Scenario }) {
  const meta = useData<Meta>('meta.json');
  const seg = useData<Segmentation>('segmentation.json');
  const [selected, setSelected] = useState('AX');
  const [hover, setHover] = useState<string | null>(null);

  const pending = meta.status === 'ready' && (meta.data.pending ?? []).some((p) => ['segmentation_items', 'radar_profiles'].includes(p.name));
  const total = seg.status === 'ready' ? seg.data.total_items : null;

  let top;
  if (pending || seg.status === 'error') top = <Pending what="la matriz ABC × XYZ ni el radar (segmentation_items, radar_profiles)" />;
  else if (seg.status !== 'ready') top = <Loading />;
  else {
    const data = seg.data;
    const profile = data.radar.cells[selected] ?? {};
    top = (
      <div className="grid-3">
        <div className="card">
          <h2>Matriz ABC × XYZ</h2>
          <SegmentMatrix data={data} selected={selected} onSelect={setSelected} />
        </div>
        <div className="card">
          <h2>Perfil de segmentos (mediana normalizada) <HelpTip id="mediana-normalizada" scenario={scenario} /></h2>
          <SegmentRadar data={data} selected={selected} />
          <p className="small muted">
            1,0 = mediana global del catálogo ({fmtNumber(data.total_items + data.excluded_no_xyz)} artículos; en CV, los{' '}
            {fmtNumber(data.total_items)} con CV).
          </p>
        </div>
        <div className="card">
          <h2>{selected} · al pasar el cursor</h2>
          <div className="small muted" style={{ marginBottom: 6 }}>
            <span className="dot" style={{ background: CELL_COLOR[selected] ?? 'var(--slate)' }} />
            mediana normalizada; el valor crudo aparece con el cursor
          </div>
          {data.radar.axes.map((a) => (
            <div
              key={a}
              className="profile-row"
              tabIndex={0}
              onMouseEnter={() => setHover(a)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(a)}
              onBlur={() => setHover(null)}
            >
              <div>
                <div>{AXIS_LABEL[a] ?? a} <HelpTip id={a} scenario={scenario} /></div>
                <div className="raw">
                  {hover === a && profile[a] ? <>crudo: <RawValue axis={a} value={profile[a].median_raw} /></> : ' '}
                </div>
              </div>
              <div className="norm">{fmtNumber(profile[a]?.median_norm, 2)}</div>
            </div>
          ))}
          {MAIN.includes(selected as Cell) && (
            <p className="small" style={{ marginTop: 12 }}>
              <a href={hashFor(`/segmentacion/${selected}`, scenario)}>Ver artículos →</a>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <ModuleHeader
        title="Segmentación ABC × XYZ"
        subtitle={`${total === null ? '' : `${fmtNumber(total)} artículos con clase XYZ · `}ABC por gasto de train · XYZ por variabilidad de unidades (train)`}
      />
      {top}
      <ComparisonCard />
      <FunnelCard scenario={scenario} />
    </>
  );
}
