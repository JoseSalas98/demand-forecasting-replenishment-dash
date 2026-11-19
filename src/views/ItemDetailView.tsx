// Detalle del pronóstico de un artículo (spec 002, FR-034): cálculo del ahorro, error, histograma,
// venta en dinero y tabla por periodo exportable.
import { MoneyChart } from '../components/charts/MoneyChart';
import { UnitsHistogram } from '../components/charts/UnitsHistogram';
import { ImpactContext } from '../components/ImpactContext';
import { ModuleHeader } from '../components/ModuleHeader';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtDate, fmtNumber, fmtPct, fmtUsd, na } from '../format';
import { t } from '../i18n';
import { wape } from '../impactMath';
import { cellName } from '../naming';
import { hashFor } from '../router';
import type { Descriptive, Items, ItemSeries, Segments } from '../types';
import { useStartDates } from './ItemView';

const usd = fmtUsd;
const pct = (v: number | null) => fmtPct(v === null ? null : v * 100);
const units = (v: number | null | undefined) => (v === null || v === undefined ? na() : t().common.units(fmtNumber(v)));

/** Descarga un CSV en el navegador (sitio estático; research R5). */
function downloadCsv(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ItemDetailView({ itemId }: { itemId: string }) {
  const items = useData<Items>('items.json');
  const segs = useData<Segments>('segments.json');
  const item = items.status === 'ready' ? items.data.items.find((i) => i.item_id === itemId) : undefined;
  const series = useData<ItemSeries>(item ? `series/${item.item_id}.json` : null);
  const descriptive = useData<Descriptive>(item ? `descriptive/${item.item_id}.json` : null);
  const startDates = useStartDates();
  const s = t().itemDetail;

  const back = <p><a className="btn small" href={hashFor(`/articulo/${itemId}`, 'A')}><span aria-hidden="true">←</span> {s.back}</a></p>;
  if (items.status === 'error') return <LoadError error={items.error} />;
  if (items.status !== 'ready') return <Loading />;
  if (!item) {
    return (
      <>
        {back}
        <div className="note">{s.notForecast(itemId)}</div>
      </>
    );
  }
  for (const st of [series, descriptive]) if (st.status === 'error') return <LoadError error={st.error} />;
  if (series.status !== 'ready' || descriptive.status !== 'ready') return <Loading />;

  const imp = item.impact.A;
  const met = item.metrics.A;
  const [from, to] = item.test_blocks;
  const test = series.data.rows.filter((r) => r.block >= from && r.block <= to);
  const fc = test.map((r) => (r.forecast ? r.forecast.A : null));
  const base = test.map((r) => r.baseline);
  const real = test.map((r) => r.units_completed);
  const sum = (a: (number | null)[]) => (a.some((v) => v === null) ? null : (a as number[]).reduce((x, y) => x + y, 0));
  const baseWape = wape(base, real);
  const costN = imp.excess_naive + imp.lost_naive, costM = imp.excess_model + imp.lost_model;
  const diff = (a: number, b: number) => (a - b < 0 ? `−${usd(b - a)}` : usd(a - b));
  const st = descriptive.data.stats;

  const csv = () => {
    const head = s.csvHeader;
    const lines = test.map((r) => [startDates.get(r.block) ?? '', r.block, r.units_observed ?? '', r.units_completed ?? '', r.forecast?.A ?? '', r.baseline ?? ''].join(','));
    downloadCsv(s.csvName(item.item_id), [head, ...lines].join('\n'));
  };

  return (
    <>
      {back}
      <ModuleHeader title={<>{s.title} · <span className="mono">{item.item_id}</span></>} subtitle={s.subtitle(cellName(item.cell), String(from), String(to))} />

      <div className="card">
        <h2>{s.calcTitle}</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th className="left">{s.colConcept(String(test.length))}</th><th>{s.colBaseline}</th><th>{s.colForecast}</th><th>{s.colDiff}</th></tr></thead>
            <tbody>
              <tr><td className="left">{s.rowUnits}</td><td>{units(sum(base))}</td><td>{units(sum(fc))}</td><td>{s.realUnits(units(sum(real)))}</td></tr>
              <tr><td className="left">{s.rowWape}</td><td>{pct(baseWape)} *</td><td>{pct(met.wape_units)}</td><td className="good">{baseWape !== null && met.wape_units !== null ? s.pointsLess(fmtNumber((baseWape - met.wape_units) * 100, 1)) : na()}</td></tr>
              <tr><td className="left">{s.rowZ}</td><td>{fmtNumber(imp.z_naive, 2)}</td><td>{fmtNumber(imp.z_model, 2)}</td><td></td></tr>
              <tr><td className="left">{s.rowExcess}</td><td>{usd(imp.excess_naive)}</td><td>{usd(imp.excess_model)}</td><td className={imp.impact_excess < 0 ? 'neg' : 'good'}>{diff(imp.excess_naive, imp.excess_model)}</td></tr>
              <tr><td className="left">{s.rowLost}</td><td>{usd(imp.lost_naive)}</td><td>{usd(imp.lost_model)}</td><td className={imp.impact_lost < 0 ? 'neg' : 'good'}>{diff(imp.lost_naive, imp.lost_model)}</td></tr>
              <tr className="strong-row"><td className="left">{s.rowTotal}</td><td>{usd(costN)}</td><td>{usd(costM)}</td><td className={imp.impact < 0 ? 'neg' : 'good'}>{diff(costN, costM)}</td></tr>
              <tr><td className="left">{s.rowPct(usd(imp.demand))}</td><td>{fmtPct((costN / imp.demand) * 100)}</td><td>{fmtPct((costM / imp.demand) * 100)}</td><td className={imp.impact < 0 ? 'neg' : 'good'}>{fmtPct(imp.impact_pct_demand)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="small muted">{s.calcNote}</p>
        {segs.status === 'ready' && <ImpactContext impact={imp} concentration={segs.data.concentration.A} />}
      </div>

      <div className="card section">
        <h2>{s.errorTitle}</h2>
        <div className="kpis three">
          <div className="kpi"><span className="lbl">{s.kWape}</span><span className="v">{pct(met.wape_units)}</span><span className="l">{s.kWapeNote(pct(baseWape))}</span></div>
          <div className="kpi"><span className="lbl">{s.kMae}</span><span className="v">{units(met.mae_units)}</span><span className="l">{s.kMaeNote}</span></div>
          <div className="kpi"><span className="lbl">{s.kRmsse}</span><span className="v">{fmtNumber(met.rmsse_units, 3)}</span><span className="l">{s.kRmsseNote}</span></div>
          <div className="kpi"><span className="lbl">{s.kCv}</span><span className="v">{fmtPct(item.cv_train)}</span><span className="l">{s.kCvNote}</span></div>
          <div className="kpi"><span className="lbl">{s.kCvHist}</span><span className="v">{fmtPct(st.cv_pct)}</span><span className="l">{s.kCvHistNote(fmtNumber(st.mean), fmtNumber(st.sigma))}</span></div>
          <div className="kpi"><span className="lbl">{s.kReview}</span><span className="v">{met.review ? s.yes : s.no}</span><span className="l">{met.review ? s.kReviewYes : s.kReviewNo}</span></div>
        </div>
      </div>

      <div className="grid-2 section">
        <div className="card">
          <h2>{s.histTitle}</h2>
          <UnitsHistogram bins={descriptive.data.histogram} />
          <p className="small muted">{s.histNote(fmtNumber(st.n_blocks))}</p>
        </div>
        <div className="card">
          <h2>{s.moneyTitle}</h2>
          <MoneyChart rows={descriptive.data.rows} />
          <p className="small muted">{s.moneyNote}</p>
        </div>
      </div>

      <div className="card section">
        <div className="card-head">
          <h2>{s.tableTitle}</h2>
          <button type="button" className="btn primary small" onClick={csv}>{s.exportCsv} <span aria-hidden="true">⤓</span></button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th className="left">{s.colStart}</th><th>{s.colSold}</th><th>{s.colCompleted}</th><th>{s.colForecast}</th><th>{s.colBaseline}</th><th>{s.colDelta}</th></tr></thead>
            <tbody>
              {test.map((r) => {
                const f = r.forecast ? r.forecast.A : null;
                const dlt = f !== null && r.units_completed !== null ? f - r.units_completed : null;
                return (
                  <tr key={r.block}>
                    <td className="left">{fmtDate(startDates.get(r.block))}</td>
                    <td>{fmtNumber(r.units_observed)}</td>
                    <td>{fmtNumber(r.units_completed)}</td>
                    <td>{fmtNumber(f)}</td>
                    <td>{fmtNumber(r.baseline)}</td>
                    <td className={dlt !== null && dlt < 0 ? 'neg' : undefined}>{fmtNumber(dlt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="small"><a className="btn small" href={hashFor(`/articulo/${item.item_id}/playground`, 'A')}>{s.playground} <span aria-hidden="true">→</span></a></p>
      </div>
    </>
  );
}
