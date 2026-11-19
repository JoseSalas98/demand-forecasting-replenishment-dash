// Impacto en dinero (spec 002, US1): dos maneras de aprovechar el pronóstico frente a la línea base
// al % de demanda atendida elegido. Fuera del 95 % las cifras son lecturas derivadas (constitución I.12).
import { useState } from 'react';
import { TradeoffCurve } from '../components/charts/TradeoffCurve';
import { ModuleHeader } from '../components/ModuleHeader';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtAxisM, fmtK, fmtM, fmtNumber, fmtPct } from '../format';
import { t } from '../i18n';
import { levers, sameZ } from '../impactMath';
import { cellName } from '../naming';
import { hashFor } from '../router';
import { CELL_COLOR, COLOR } from '../theme';
import type { Cell, Items, Meta, Segments } from '../types';

const MAIN: Cell[] = ['AX', 'AY', 'AZ'];
const MIN = 90, MAX = 99, STEP = 0.5, OFFICIAL = 95;

/** Barras de comparación con escala fija para que las dos se muevan con el control (FR-042). */
function FixedBars({ rows, max, ticks }: { rows: [string, number, string][]; max: number; ticks: number[] }) {
  return (
    <div className="mini-bars">
      {rows.map(([label, v, color]) => (
        <div key={label} className="mb-row">
          <span>{label}</span>
          <span className="mb-track"><span className="mb-fill" style={{ width: `${Math.max((v / max) * 100, 0.6)}%`, background: color }} /></span>
          <span className="num">{fmtM(v)}</span>
        </div>
      ))}
      <div className="mb-row mb-axis">
        <span />
        <span className="mb-ticks">{ticks.map((v) => <i key={v} style={{ left: `${(v / max) * 100}%` }}>{fmtAxisM(v)}</i>)}</span>
        <span />
      </div>
    </div>
  );
}

export function ImpactView() {
  const meta = useData<Meta>('meta.json');
  const segs = useData<Segments>('segments.json');
  const items = useData<Items>('items.json');
  const [pct, setPct] = useState(OFFICIAL);
  const [open, setOpen] = useState(false);
  const s = t().impact;

  for (const st of [meta, segs, items]) if (st.status === 'error') return <LoadError error={st.error} />;
  if (meta.status !== 'ready' || segs.status !== 'ready' || items.status !== 'ready') return <Loading />;

  const seg = segs.data.segments;
  const total = seg.total.curves;
  const D = meta.data.total_demand_test;
  const l = levers(total.A, total.naive, pct / 100);
  const official = pct === OFFICIAL;
  const h = meta.data.headline.A;
  // Al 95 % se muestran las cifras oficiales del manifiesto (I.12)
  const freed = official ? h.saving_excess95 : l?.freedCapital ?? null;
  const freedPct = official ? h.saving_excess95_pct / 100 : l?.freedPct ?? null;
  const recovered = official ? h.recovered_sales_same_excess : l?.recoveredSales ?? null;
  const label = fmtPct(pct, pct % 1 ? 1 : 0);
  const conc = segs.data.concentration.A;
  const top = [...items.data.items].sort((a, b) => b.impact.A.impact - a.impact.A.impact).slice(0, 10);
  const bySeg = l ? MAIN.map((g) => ({ g, v: sameZ(seg[g].curves.naive, l.naive).excess - sameZ(seg[g].curves.A, l.model).excess })) : [];
  const segMax = Math.max(...bySeg.map((x) => x.v), 1);

  return (
    <>
      <ModuleHeader title={s.title} subtitle={s.subtitle} />

      <div className="card">
        <div className="slider-row">
          <label htmlFor="svc">
            <h2>{s.question}</h2>
            <span className="small muted">{s.questionNote}</span>
          </label>
          <input id="svc" type="range" min={MIN} max={MAX} step={STEP} value={pct} onChange={(e) => setPct(Number(e.target.value))} aria-valuetext={s.sliderText(label)} />
          <span className="big-pct">{label}</span>
        </div>
        <p className="muted">{s.twoWays}</p>

        {l === null ? (
          <div className="note">{s.notAvailable(label)}</div>
        ) : (
          <div className="grid-2">
            <div className="lever">
              <div className="lever-head"><span className="lever-ico amber" aria-hidden="true">$</span><div><h3>{s.freeTitle}</h3><span className="small muted">{s.freeSub(label)}</span></div></div>
              <div className="lever-v good">{fmtM(freed)}</div>
              <p className="small">{s.freeText(fmtPct((freedPct ?? NaN) * 100, 0))[0]}<b className="red">{fmtM(l.model.lost)}</b>{s.freeText('')[1]}</p>
              <FixedBars rows={[[s.barBaseline, l.naive.excess, COLOR.coral], [s.barForecast, l.model.excess, COLOR.cyan]]} max={12e6} ticks={[0, 3e6, 6e6, 9e6, 12e6]} />
            </div>
            <div className="lever">
              <div className="lever-head"><span className="lever-ico good" aria-hidden="true">↗</span><div><h3>{s.recoverTitle}</h3><span className="small muted">{s.recoverSub(fmtM(l.naive.excess))}</span></div></div>
              <div className="lever-v good">{fmtM(recovered)}</div>
              {l.sameExcess ? (
                <>
                  <p className="small">{s.recoverText(label)[0]}<b>{fmtPct((1 - l.sameExcess.lost / D) * 100)}</b>{s.recoverText(label)[1]}</p>
                  <FixedBars rows={[[s.barBaseline, l.naive.lost, COLOR.coral], [s.barForecast, l.sameExcess.lost, COLOR.cyan]]} max={3e6} ticks={[0, 1e6, 2e6, 3e6]} />
                </>
              ) : (
                <p className="small">{s.recoverNA}</p>
              )}
            </div>
          </div>
        )}

        <div>
          <button type="button" className="btn small icon-btn" aria-expanded={open} aria-controls="imp-detail" onClick={() => setOpen(!open)}>
            <span className="ico" aria-hidden="true">i</span>{open ? s.hideDetail : s.showDetail} <span className={`chev${open ? ' up' : ''}`} aria-hidden="true">▾</span>
          </button>
        </div>
        {open && l && (
          <div className="detail" id="imp-detail">
            <div className="eyebrow-label">{s.curveTitle}</div>
            <div className="legend"><span className="lg static"><i style={{ background: COLOR.cyan }} />{s.barForecast}</span><span className="lg static"><i style={{ background: COLOR.coral }} />{s.barBaseline}</span></div>
            <TradeoffCurve model={total.A} naive={total.naive} m={l.model} n={l.naive} />
            <div className="kpis three">
              <div className="kpi"><span className="lbl">{s.zHere}</span><span className="v sm">{s.zValues(fmtNumber(l.model.z, 2), fmtNumber(l.naive.z, 2))}</span><span className="l">{s.zNote}</span></div>
              <div className="kpi"><span className="lbl">{s.recoveredOfficial}</span><span className="v sm">{fmtM(h.recovered_sales_same_excess)}</span><span className="l">{s.recoveredOfficialNote}</span></div>
              <div className="kpi"><span className="lbl">{s.wrmsse}</span><span className="v sm">{fmtNumber(meta.data.wrmsse_units.one_step, 3)}</span><span className="l">{s.wrmsseNote(fmtNumber(meta.data.wrmsse_units.seasonal_naive, 3))}</span></div>
            </div>
            <p className="small muted">{s.fillNote}{official ? s.officialNote : s.derivedNote(label)}</p>
            <h3>{s.bySegTitle}</h3>
            <p className="small muted">
              {s.bySegText(MAIN.map((g) => `${fmtM(seg[g].reading.A.saving_excess95)} (${cellName(g)})`).join(', '), fmtM(MAIN.reduce((a, g) => a + seg[g].reading.A.saving_excess95, 0)))}
            </p>
            <h3>{s.perItemTitle}</h3>
            <p className="small muted">{s.perItemText}</p>
          </div>
        )}
      </div>

      <div className="card section">
        <div className="card-head"><h2>{s.whereTitle}</h2><span className="small muted">{s.whereSub(label)}</span></div>
        <div className="hbars">
          {bySeg.map(({ g, v }) => (
            <div key={g} className="hbar wide">
              <span>{cellName(g)}</span>
              <span className="track tall"><span className="fill" style={{ width: `${(v / segMax) * 100}%`, background: CELL_COLOR[g] }} /></span>
              <span className="val">{fmtM(v)}</span>
            </div>
          ))}
        </div>
        {l && <p className="small muted">{s.whereTotal(bySeg.map((x) => fmtNumber(x.v / 1e6, 2)).join(' + '), fmtM(l.freedCapital))}</p>}
        <div className="strip">
          <span><b className="accent">{fmtNumber(conc.for_50pct)}</b>{s.half}</span>
          <span><b className="accent">{fmtNumber(conc.for_80pct)}</b>{s.eighty}</span>
          <span><b className="good">{fmtNumber(conc.improve)}</b>{s.improve(fmtNumber(conc.items))}</span>
          <span><b className="red">{fmtNumber(conc.worsen)}</b>{s.worsen}</span>
        </div>
      </div>

      <div className="card section">
        <div className="card-head"><h2>{s.topTitle}</h2><span className="small muted">{s.topSub}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th className="left">{s.colItem}</th><th className="left">{s.colGroup}</th><th>{s.colLessExcess}</th><th>{s.colLost}</th><th>{s.colNet}</th></tr></thead>
            <tbody>
              {top.map((i) => {
                const ex = i.impact.A.impact_excess, lo = i.impact.A.impact_lost;
                return (
                  <tr key={i.item_id}>
                    <td className="left"><a className="btn small" href={hashFor(`/articulo/${i.item_id}`, 'A')}>{i.item_id} <span aria-hidden="true">→</span></a></td>
                    <td className="left">{cellName(i.cell)}</td>
                    <td className={ex < 0 ? 'neg' : undefined}>{fmtK(ex, true)}</td>
                    <td className={lo >= 0 ? 'good' : 'neg'}>{lo >= 0 ? s.lostLess(fmtK(lo, true)) : s.lostMore(fmtK(-lo, true))}</td>
                    <td><b>{fmtK(i.impact.A.impact, true)}</b></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
