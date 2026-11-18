// Impacto en dinero (spec 002, US1): dos maneras de aprovechar el pronóstico frente a la línea base
// al % de demanda atendida elegido. Fuera del 95 % las cifras son lecturas derivadas (constitución I.12).
import { useState } from 'react';
import { TradeoffCurve } from '../components/charts/TradeoffCurve';
import { ModuleHeader } from '../components/ModuleHeader';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtK, fmtM, fmtNumber, fmtPct } from '../format';
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
        <span className="mb-ticks">{ticks.map((t) => <i key={t} style={{ left: `${(t / max) * 100}%` }}>{t ? `${fmtNumber(t / 1e6)} M` : '0'}</i>)}</span>
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

  for (const s of [meta, segs, items]) if (s.status === 'error') return <LoadError error={s.error} />;
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
  const label = `${fmtNumber(pct, pct % 1 ? 1 : 0)} %`;
  const conc = segs.data.concentration.A;
  const top = [...items.data.items].sort((a, b) => b.impact.A.impact - a.impact.A.impact).slice(0, 10);
  const bySeg = l ? MAIN.map((g) => ({ g, v: sameZ(seg[g].curves.naive, l.naive).excess - sameZ(seg[g].curves.A, l.model).excess })) : [];
  const segMax = Math.max(...bySeg.map((x) => x.v), 1);

  return (
    <>
      <ModuleHeader title="Impacto en dinero" subtitle="Año de prueba · pedir según el pronóstico frente a la línea base (repetir lo vendido en el mismo periodo del año anterior)" />

      <div className="card">
        <div className="slider-row">
          <label htmlFor="svc">
            <h2>¿Qué porcentaje de la demanda quieres atender?</h2>
            <span className="small muted">Atender más exige pedir con más respaldo, y eso deja más mercancía sobrante.</span>
          </label>
          <input id="svc" type="range" min={MIN} max={MAX} step={STEP} value={pct} onChange={(e) => setPct(Number(e.target.value))} aria-valuetext={`${label} de la demanda atendida`} />
          <span className="big-pct">{label}</span>
        </div>
        <p className="muted">Un mejor pronóstico se puede aprovechar de dos maneras. Se elige una, la otra o un punto intermedio; los dos montos no se suman.</p>

        {l === null ? (
          <div className="note">Lectura no disponible para {label}: queda fuera de las curvas exportadas.</div>
        ) : (
          <div className="grid-2">
            <div className="lever">
              <div className="lever-head"><span className="lever-ico amber" aria-hidden="true">$</span><div><h3>Liberar capital</h3><span className="small muted">mismo {label} de demanda atendida</span></div></div>
              <div className="lever-v good">{fmtM(freed)}</div>
              <p className="small">
                menos mercancía sobrante (−{fmtPct((freedPct ?? NaN) * 100, 0)}). Es dinero que no queda inmovilizado en el anaquel y se puede usar en otra
                cosa. Las dos estrategias pierden lo mismo en ventas: <b className="red">{fmtM(l.model.lost)}</b>.
              </p>
              <FixedBars rows={[['Línea base', l.naive.excess, COLOR.coral], ['Pronóstico', l.model.excess, COLOR.cyan]]} max={12e6} ticks={[0, 3e6, 6e6, 9e6, 12e6]} />
            </div>
            <div className="lever">
              <div className="lever-head"><span className="lever-ico good" aria-hidden="true">↗</span><div><h3>Recuperar ventas</h3><span className="small muted">mismo sobrante que la línea base ({fmtM(l.naive.excess)})</span></div></div>
              <div className="lever-v good">{fmtM(recovered)}</div>
              {l.sameExcess ? (
                <>
                  <p className="small">
                    en ventas que ya no se pierden por falta de producto. Con ese mismo inventario, el pronóstico atiende el{' '}
                    <b>{fmtPct((1 - l.sameExcess.lost / D) * 100)}</b> de la demanda en lugar del {label}.
                  </p>
                  <FixedBars rows={[['Línea base', l.naive.lost, COLOR.coral], ['Pronóstico', l.sameExcess.lost, COLOR.cyan]]} max={3e6} ticks={[0, 1e6, 2e6, 3e6]} />
                </>
              ) : (
                <p className="small">Lectura no disponible: el mismo sobrante queda fuera de la curva del pronóstico.</p>
              )}
            </div>
          </div>
        )}

        <div>
          <button type="button" className="btn small icon-btn" aria-expanded={open} aria-controls="imp-detail" onClick={() => setOpen(!open)}>
            <span className="ico" aria-hidden="true">i</span>{open ? 'Ocultar detalle del cálculo' : 'Ver detalle del cálculo'} <span className={`chev${open ? ' up' : ''}`} aria-hidden="true">▾</span>
          </button>
        </div>
        {open && l && (
          <div className="detail" id="imp-detail">
            <div className="eyebrow-label">Curva sobrante vs. ventas perdidas (total, 17 valores de z de −1 a 3)</div>
            <div className="legend"><span className="lg static"><i style={{ background: COLOR.cyan }} />Pronóstico</span><span className="lg static"><i style={{ background: COLOR.coral }} />Línea base</span></div>
            <TradeoffCurve model={total.A} naive={total.naive} m={l.model} n={l.naive} />
            <div className="kpis three">
              <div className="kpi"><span className="lbl">z en este punto</span><span className="v sm">pronóstico {fmtNumber(l.model.z, 2)} · línea base {fmtNumber(l.naive.z, 2)}</span><span className="l">colchón = z × error típico</span></div>
              <div className="kpi"><span className="lbl">Venta recuperada con el mismo sobrante (oficial)</span><span className="v sm">{fmtM(h.recovered_sales_same_excess)}</span><span className="l">al 95 %, según el manifiesto de impacto</span></div>
              <div className="kpi"><span className="lbl">Error comparable del año de prueba (WRMSSE)</span><span className="v sm">{fmtNumber(meta.data.wrmsse_units.one_step, 3)}</span><span className="l">línea base: {fmtNumber(meta.data.wrmsse_units.seasonal_naive, 3)}</span></div>
            </div>
            <p className="small muted">
              El % de demanda atendida es tasa de cumplimiento en dinero (demanda atendida ÷ demanda). Por eso z ≈ 0 ya da cerca del 95 %: no es
              el nivel de servicio por ciclo. {official ? 'Al 95 % las cifras principales son las oficiales del manifiesto.' : `A ${label}, las cifras se leen entre dos puntos de la curva exportada: calculado en el sitio (lectura derivada).`}
            </p>
            <h3>Lectura por segmento</h3>
            <p className="small muted">
              Si cada grupo se ajusta por separado a su propio 95 %, el sobrante evitado es{' '}
              {MAIN.map((g, i) => <span key={g}>{fmtM(seg[g].reading.A.saving_excess95)} ({cellName(g)}){i < 2 ? ', ' : ''}</span>)}
              {' '}y suma {fmtM(MAIN.reduce((a, g) => a + seg[g].reading.A.saving_excess95, 0))}. No coincide con el total porque cada grupo usa otro z.
            </p>
            <h3>Ahorro por artículo</h3>
            <p className="small muted">
              Ahorro por artículo = (sobrante + ventas perdidas de la línea base) − (sobrante + ventas perdidas del pronóstico), con el z que da el
              95 % al total. Con ese z fijo, algunos artículos pueden salir con ahorro negativo aunque se pronostiquen bien.
            </p>
          </div>
        )}
      </div>

      <div className="card section">
        <div className="card-head"><h2>¿Dónde está el capital liberado?</h2><span className="small muted">al {label} de demanda atendida</span></div>
        <div className="hbars">
          {bySeg.map(({ g, v }) => (
            <div key={g} className="hbar wide">
              <span>{cellName(g)}</span>
              <span className="track tall"><span className="fill" style={{ width: `${(v / segMax) * 100}%`, background: CELL_COLOR[g] }} /></span>
              <span className="val">{fmtM(v)}</span>
            </div>
          ))}
        </div>
        {l && <p className="small muted">Total: {bySeg.map((x) => fmtNumber(x.v / 1e6, 2)).join(' + ')} = {fmtM(l.freedCapital)}. Los ocasionales liberan más porque son los más difíciles de prever con la línea base.</p>}
        <div className="strip">
          <span><b className="accent">{fmtNumber(conc.for_50pct)}</b> artículos explican la mitad del ahorro</span>
          <span><b className="accent">{fmtNumber(conc.for_80pct)}</b> explican el 80 %</span>
          <span><b className="good">{fmtNumber(conc.improve)}</b> de {fmtNumber(conc.items)} cuestan menos con el pronóstico</span>
          <span><b className="red">{fmtNumber(conc.worsen)}</b> cuestan más y se revisan uno a uno</span>
        </div>
      </div>

      <div className="card section">
        <div className="card-head"><h2>Los 10 artículos que más ahorran</h2><span className="small muted">cifras en mil US$ · con el colchón del 95 % del total</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th className="left">Artículo</th><th className="left">Grupo</th><th>Menos sobrante</th><th>Efecto en ventas perdidas</th><th>Ahorro neto</th></tr></thead>
            <tbody>
              {top.map((i) => {
                const ex = i.impact.A.impact_excess, lo = i.impact.A.impact_lost;
                return (
                  <tr key={i.item_id}>
                    <td className="left"><a className="btn small" href={hashFor(`/articulo/${i.item_id}`, 'A')}>{i.item_id} <span aria-hidden="true">→</span></a></td>
                    <td className="left">{cellName(i.cell)}</td>
                    <td className={ex < 0 ? 'neg' : undefined}>{fmtK(ex, true)}</td>
                    <td className={lo >= 0 ? 'good' : 'neg'}>{lo >= 0 ? `${fmtK(lo, true)} menos` : `${fmtK(-lo, true)} más`}</td>
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
