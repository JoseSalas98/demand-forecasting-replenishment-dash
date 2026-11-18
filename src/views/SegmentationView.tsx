// Segmentos (spec 002, US2): burbujas por familia, panel del grupo con radar y barras, y embudo.
import { useState } from 'react';
import { Bubbles, type SizeMode } from '../components/charts/Bubbles';
import { Funnel } from '../components/charts/Funnel';
import { AXIS_LABEL, GroupRadar, groupColor } from '../components/charts/GroupRadar';
import { HelpTip } from '../components/HelpTip';
import { ModuleHeader } from '../components/ModuleHeader';
import { Pill } from '../components/Pill';
import { LoadError, Loading, Pending } from '../components/StateViews';
import { useData } from '../data';
import { fmtM, fmtNumber, fmtPct } from '../format';
import { GLOSSARY_BY_ID } from '../glossary';
import { CELL_POLICY, cellName } from '../naming';
import { hashFor } from '../router';
import { LEVEL_COLOR } from '../theme';
import type { Funnel as FunnelData, Meta, Segmentation } from '../types';

const VITALS = ['AX', 'AY', 'AZ'];

/** Valor real de una variable del radar con su unidad. */
export function formatRaw(axis: string, v: number): string {
  switch (axis) {
    case 'spend': return `${fmtNumber(v)} US$`;
    case 'usage_units': return `${fmtNumber(v)} u.`;
    case 'cv': return `${fmtNumber(v, 1)} %`;
    case 'zero_share': return `${fmtNumber(v * 100, 1)} % de los días`;
    case 'velocity': return `${fmtNumber(v, 1)} u. por día`;
    default: return fmtNumber(v, 2);
  }
}

function times(v: number): string {
  if (v >= 1.15) return `${fmtNumber(v, 1)} veces más que`;
  if (v <= 0.87) return `${fmtNumber(1 / v, 1)} veces menos que`;
  return 'lo mismo que';
}

function GroupPanel({ data, cell, forecasted }: { data: Segmentation; cell: string; forecasted: Record<string, number> }) {
  const [visible, setVisible] = useState<Record<string, boolean>>({ AX: true, AY: true, AZ: true });
  const profile = data.radar.cells[cell] ?? {};
  const m = data.matrix.find((x) => x.cell === cell);
  const norm = (a: string) => profile[a]?.median_norm ?? null;
  const cv = norm('cv');
  const cvText = cv === null ? 'de variabilidad no disponible' : cv < 0.85 ? 'más pareja que la del artículo típico' : cv > 1.2 ? 'con saltos más fuertes que la del artículo típico' : 'con altibajos parecidos a los del artículo típico';
  const col = groupColor(cell);
  const isVital = VITALS.includes(cell);
  const target = isVital ? cell : 'AX';
  const MAXB = 4.8;
  return (
    <div className="card panel">
      <div className="card-head">
        <div>
          <h2>{cellName(cell)}</h2>
          <div className="small muted">{fmtNumber(m?.n_items)} artículos · {fmtM(m?.spend)} de venta</div>
        </div>
        <a className="btn small icon-btn" href={hashFor(`/segmentacion/${target}`, 'A')}><span className="ico" aria-hidden="true">i</span>Detalle</a>
      </div>
      <p>
        Un artículo típico de este grupo vende <b>{norm('spend') === null ? 'no disponible' : times(norm('spend')!)}</b> el artículo típico del
        catálogo. Su venta es <b>{cvText}</b> y pasa sin vender el <b>{fmtPct((profile.zero_share?.median_raw ?? NaN) * 100)}</b> de los días.
      </p>
      {isVital ? (
        <p className="small muted">Con pronóstico: <b className="strong">{fmtNumber(forecasted[cell])} de {fmtNumber(m?.n_items)}</b> · política sugerida: <b className="strong">{CELL_POLICY[cell]}</b></p>
      ) : (
        <p className="small muted">Este grupo no se pronostica. El radar lo compara con los tres grupos Vitales, que sí se pronostican.</p>
      )}
      <div className="legend" role="group" aria-label="Grupos del radar">
        <span className="lg static"><i style={{ background: col }} />{cellName(cell)}</span>
        {VITALS.filter((v) => v !== cell).map((v) => (
          <button key={v} type="button" className="lg" aria-pressed={visible[v]} onClick={() => setVisible({ ...visible, [v]: !visible[v] })}>
            <i style={{ background: LEVEL_COLOR[v[1]] }} />{cellName(v)}
          </button>
        ))}
        <span className="lg static"><i className="dashed" />Artículo típico (1×)</span>
      </div>
      <GroupRadar data={data} selected={cell} visible={visible} formatRaw={formatRaw} />
      <div className="eyebrow-label">Frente al artículo típico del catálogo</div>
      <div className="hbars">
        {data.radar.axes.map((a) => {
          const v = norm(a);
          return (
            <div key={a} className="hbar">
              <span>
                {GLOSSARY_BY_ID[a]?.term ?? AXIS_LABEL[a] ?? a}{' '}
                <HelpTip
                  id={a}
                  extra={profile[a] ? <>{cellName(cell)} (mediana): <b>{formatRaw(a, profile[a].median_raw)}</b><br />Artículo típico del catálogo: {formatRaw(a, data.radar.global_median[a])}</> : undefined}
                />
              </span>
              <span className="track">
                <span className="fill" style={{ width: `${(Math.min(v ?? 0, MAXB) / MAXB) * 100}%`, background: col }} />
                <span className="ref" style={{ left: `${(1 / MAXB) * 100}%` }} />
              </span>
              <span className="val">{v === null ? 'no disponible' : `${fmtNumber(v, 1)}×`}</span>
            </div>
          );
        })}
      </div>
      <p className="small muted">La raya marca el artículo típico del catálogo (1×).</p>
    </div>
  );
}

function FunnelCard({ data }: { data: FunnelData }) {
  const stage = (k: string) => data.stages.find((s) => s.key === k);
  const outside = (stage('segment_a')?.count ?? NaN) - (stage('forecasted')?.count ?? NaN);
  return (
    <div className="card section">
      <div className="card-head">
        <h2>Del catálogo a lo que se pronostica</h2>
        <a className="btn small icon-btn" href={hashFor('/segmentacion/AX', 'A')}><span className="ico" aria-hidden="true">i</span>Detalle de los pronosticados</a>
      </div>
      <div className="fun-grid">
        <Funnel stages={data.stages} />
        <div className="fun-tiles">
          <div className="ftile"><div className="v accent">{fmtPct(data.money_at_stake.train_spend_share_517 * 100, 0)}</div><div className="l">de la venta de la cadena queda cubierta por los {fmtNumber(stage('forecasted')?.count)} artículos con pronóstico</div></div>
          <div className="ftile"><div className="v">{fmtM(data.money_at_stake.test_demand_517)}</div><div className="l">de demanda de esos artículos en el año de prueba: es lo que está en juego</div></div>
          <div className="ftile"><div className="v amber">{fmtNumber(outside)}</div><div className="l">Vitales sin pronóstico: no pasan los criterios de calidad del dato o no tienen historia suficiente tras el procesamiento</div></div>
        </div>
      </div>
    </div>
  );
}

export function SegmentationView() {
  const meta = useData<Meta>('meta.json');
  const seg = useData<Segmentation>('segmentation.json');
  const funnel = useData<FunnelData>('funnel.json');
  const [selected, setSelected] = useState('AX');
  const [mode, setMode] = useState<SizeMode>('spend');

  const pending = meta.status === 'ready' && (meta.data.pending ?? []).some((p) => ['segmentation_items', 'radar_profiles'].includes(p.name));
  const forecasted = funnel.status === 'ready' ? (funnel.data.stages.find((s) => s.key === 'forecasted')?.by_cell ?? {}) as Record<string, number> : {};

  let top;
  if (pending || seg.status === 'error') top = <Pending what="los segmentos ni el radar (segmentation_items, radar_profiles)" />;
  else if (seg.status !== 'ready') top = <Loading />;
  else {
    const d = seg.data;
    const fam = (f: string) => d.matrix.filter((x) => x.cell[0] === f).reduce((a, x) => ({ n: a.n + x.n_items, s: a.s + x.spend }), { n: 0, s: 0 });
    const allSpend = d.matrix.reduce((a, x) => a + x.spend, 0);
    const A = fam('A'), C = fam('C');
    top = (
      <div className="seg-layout">
        <div className="card bubbles-card">
          <div className="card-head">
            <h2>¿Cómo se reparte el catálogo?</h2>
            <div className="module-controls">
              <span className="small muted">Tamaño por</span>
              <div className="seg-toggle" role="group" aria-label="Tamaño de las burbujas">
                <Pill small active={mode === 'spend'} onClick={() => setMode('spend')}>Venta</Pill>
                <Pill small active={mode === 'n'} onClick={() => setMode('n')}>Artículos</Pill>
              </div>
            </div>
          </div>
          <Bubbles matrix={d.matrix} selected={selected} onSelect={setSelected} mode={mode} />
          <div className="seg-legend">
            <span><i style={{ background: LEVEL_COLOR.X }} />Continuos · venta pareja</span>
            <span><i style={{ background: LEVEL_COLOR.Y }} />Recurrentes · vuelve con altibajos</span>
            <span><i style={{ background: LEVEL_COLOR.Z }} />Ocasionales · venta con saltos</span>
          </div>
          <p className="small muted">
            {mode === 'spend'
              ? `Tamaño = venta de 2011 a 2015. Los Vitales son el ${fmtPct((A.n / d.total_items) * 100, 0)} de los artículos clasificados, pero hacen el ${fmtPct((A.s / allSpend) * 100, 0)} de esa venta.`
              : `Tamaño = número de artículos. Los Complementarios son la mitad del catálogo clasificado (${fmtNumber(C.n)} de ${fmtNumber(d.total_items)}), aunque venden poco cada uno.`}
            {' '}{fmtNumber(d.excluded_no_xyz)} artículos sin clase de regularidad no aparecen aquí.
          </p>
        </div>
        <GroupPanel data={d} cell={selected} forecasted={forecasted} />
      </div>
    );
  }

  return (
    <>
      <ModuleHeader title="Segmentos del catálogo" subtitle="Tres familias según cuánto aportan a la venta; dentro de cada una, tres grupos según qué tan regular es su venta" />
      {top}
      {funnel.status === 'error' ? <LoadError error={funnel.error} /> : funnel.status !== 'ready' ? <Loading /> : <FunnelCard data={funnel.data} />}
    </>
  );
}
