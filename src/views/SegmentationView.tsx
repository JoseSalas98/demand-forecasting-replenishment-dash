// Segmentos (spec 002, US2): burbujas por familia, panel del grupo con radar y barras, y embudo.
import { useState } from 'react';
import { Bubbles, type SizeMode } from '../components/charts/Bubbles';
import { Funnel } from '../components/charts/Funnel';
import { axisLabel, GroupRadar, groupColor } from '../components/charts/GroupRadar';
import { HelpTip } from '../components/HelpTip';
import { ModuleHeader } from '../components/ModuleHeader';
import { Pill } from '../components/Pill';
import { LoadError, Loading, Pending } from '../components/StateViews';
import { useData } from '../data';
import { fmtM, fmtNumber, fmtPct, fmtUsd, na } from '../format';
import { glossaryEntry } from '../glossary';
import { t } from '../i18n';
import { cellName, cellPolicy } from '../naming';
import { hashFor } from '../router';
import { LEVEL_COLOR } from '../theme';
import type { Funnel as FunnelData, Meta, Segmentation } from '../types';

const VITALS = ['AX', 'AY', 'AZ'];

/** Valor real de una variable del radar con su unidad. */
export function formatRaw(axis: string, v: number): string {
  switch (axis) {
    case 'spend': return fmtUsd(v);
    case 'usage_units': return t().common.units(fmtNumber(v));
    case 'cv': return fmtPct(v, 1);
    case 'zero_share': return t().seg.rawShareDays(fmtPct(v * 100, 1));
    case 'velocity': return t().common.unitsPerDay(fmtNumber(v, 1));
    default: return fmtNumber(v, 2);
  }
}

function times(v: number): string {
  if (v >= 1.15) return t().seg.timesMore(fmtNumber(v, 1));
  if (v <= 0.87) return t().seg.timesLess(fmtNumber(1 / v, 1));
  return t().seg.sameAs;
}

function GroupPanel({ data, cell, forecasted }: { data: Segmentation; cell: string; forecasted: Record<string, number> }) {
  const [visible, setVisible] = useState<Record<string, boolean>>({ AX: true, AY: true, AZ: true });
  const profile = data.radar.cells[cell] ?? {};
  const m = data.matrix.find((x) => x.cell === cell);
  const norm = (a: string) => profile[a]?.median_norm ?? null;
  const cv = norm('cv');
  const s = t().seg;
  const cvText = cv === null ? s.cvNA : cv < 0.85 ? s.cvSteadier : cv > 1.2 ? s.cvJumpier : s.cvSimilar;
  const col = groupColor(cell);
  const isVital = VITALS.includes(cell);
  const target = isVital ? cell : 'AX';
  const MAXB = 4.8;
  return (
    <div className="card panel">
      <div className="card-head">
        <div>
          <h2>{cellName(cell)}</h2>
          <div className="small muted">{s.panelSub(fmtNumber(m?.n_items), fmtM(m?.spend))}</div>
        </div>
        <a className="btn small icon-btn" href={hashFor(`/segmentacion/${target}`, 'A')}><span className="ico" aria-hidden="true">i</span>{t().common.details}</a>
      </div>
      <p>
        {s.sentence[0]}<b>{norm('spend') === null ? na() : times(norm('spend')!)}</b>{s.sentence[1]}<b>{cvText}</b>{s.sentence[2]}
        <b>{fmtPct((profile.zero_share?.median_raw ?? NaN) * 100)}</b>{s.sentence[3]}
      </p>
      {isVital ? (
        <p className="small muted">{s.withForecast}<b className="strong">{s.ofN(fmtNumber(forecasted[cell]), fmtNumber(m?.n_items))}</b>{s.policy}<b className="strong">{cellPolicy(cell)}</b></p>
      ) : (
        <p className="small muted">{s.notForecasted}</p>
      )}
      <div className="legend" role="group" aria-label={s.radarGroups}>
        <span className="lg static"><i style={{ background: col }} />{cellName(cell)}</span>
        {VITALS.filter((v) => v !== cell).map((v) => (
          <button key={v} type="button" className="lg" aria-pressed={visible[v]} onClick={() => setVisible({ ...visible, [v]: !visible[v] })}>
            <i style={{ background: LEVEL_COLOR[v[1]] }} />{cellName(v)}
          </button>
        ))}
        <span className="lg static"><i className="dashed" />{s.typical}</span>
      </div>
      <GroupRadar data={data} selected={cell} visible={visible} formatRaw={formatRaw} />
      <div className="eyebrow-label">{s.vsTypical}</div>
      <div className="hbars">
        {data.radar.axes.map((a) => {
          const v = norm(a);
          return (
            <div key={a} className="hbar">
              <span>
                {glossaryEntry(a)?.term ?? axisLabel(a)}{' '}
                <HelpTip
                  id={a}
                  extra={profile[a] ? <>{s.median(cellName(cell))}<b>{formatRaw(a, profile[a].median_raw)}</b><br />{s.typicalValue(formatRaw(a, data.radar.global_median[a]))}</> : undefined}
                />
              </span>
              <span className="track">
                <span className="fill" style={{ width: `${(Math.min(v ?? 0, MAXB) / MAXB) * 100}%`, background: col }} />
                <span className="ref" style={{ left: `${(1 / MAXB) * 100}%` }} />
              </span>
              <span className="val">{v === null ? na() : t().common.timesTypical(fmtNumber(v, 1))}</span>
            </div>
          );
        })}
      </div>
      <p className="small muted">{s.refNote}</p>
    </div>
  );
}

function FunnelCard({ data }: { data: FunnelData }) {
  const stage = (k: string) => data.stages.find((s) => s.key === k);
  const outside = (stage('segment_a')?.count ?? NaN) - (stage('forecasted')?.count ?? NaN);
  const s = t().seg;
  return (
    <div className="card section">
      <div className="card-head">
        <h2>{s.funnelTitle}</h2>
        <a className="btn small icon-btn" href={hashFor('/segmentacion/AX', 'A')}><span className="ico" aria-hidden="true">i</span>{s.funnelDetail}</a>
      </div>
      <div className="fun-grid">
        <Funnel stages={data.stages} />
        <div className="fun-tiles">
          <div className="ftile"><div className="v accent">{fmtPct(data.money_at_stake.train_spend_share_517 * 100, 0)}</div><div className="l">{s.tileShare(fmtNumber(stage('forecasted')?.count))}</div></div>
          <div className="ftile"><div className="v">{fmtM(data.money_at_stake.test_demand_517)}</div><div className="l">{s.tileDemand}</div></div>
          <div className="ftile"><div className="v amber">{fmtNumber(outside)}</div><div className="l">{s.tileOutside}</div></div>
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
  const s = t().seg;

  const pending = meta.status === 'ready' && (meta.data.pending ?? []).some((p) => ['segmentation_items', 'radar_profiles'].includes(p.name));
  const forecasted = funnel.status === 'ready' ? (funnel.data.stages.find((s) => s.key === 'forecasted')?.by_cell ?? {}) as Record<string, number> : {};

  let top;
  if (pending || seg.status === 'error') top = <Pending what={s.pendingWhat} />;
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
            <h2>{s.howSplit}</h2>
            <div className="module-controls">
              <span className="small muted">{s.sizeBy}</span>
              <div className="seg-toggle" role="group" aria-label={s.sizeAria}>
                <Pill small active={mode === 'spend'} onClick={() => setMode('spend')}>{s.sizeSales}</Pill>
                <Pill small active={mode === 'n'} onClick={() => setMode('n')}>{s.sizeItems}</Pill>
              </div>
            </div>
          </div>
          <Bubbles matrix={d.matrix} selected={selected} onSelect={setSelected} mode={mode} />
          <div className="seg-legend">
            <span><i style={{ background: LEVEL_COLOR.X }} />{s.legendX}</span>
            <span><i style={{ background: LEVEL_COLOR.Y }} />{s.legendY}</span>
            <span><i style={{ background: LEVEL_COLOR.Z }} />{s.legendZ}</span>
          </div>
          <p className="small muted">
            {mode === 'spend'
              ? s.noteSpend(fmtPct((A.n / d.total_items) * 100, 0), fmtPct((A.s / allSpend) * 100, 0))
              : s.noteItems(fmtNumber(C.n), fmtNumber(d.total_items))}
            {' '}{s.excluded(fmtNumber(d.excluded_no_xyz))}
          </p>
        </div>
        <GroupPanel data={d} cell={selected} forecasted={forecasted} />
      </div>
    );
  }

  return (
    <>
      <ModuleHeader title={s.title} subtitle={s.subtitle} />
      {top}
      {funnel.status === 'error' ? <LoadError error={funnel.error} /> : funnel.status !== 'ready' ? <Loading /> : <FunnelCard data={funnel.data} />}
    </>
  );
}
