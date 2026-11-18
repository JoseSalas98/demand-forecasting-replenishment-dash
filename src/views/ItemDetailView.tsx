// Detalle del pronóstico de un artículo (spec 002, FR-034): cálculo del ahorro, error, histograma,
// venta en dinero y tabla por periodo exportable.
import { MoneyChart } from '../components/charts/MoneyChart';
import { UnitsHistogram } from '../components/charts/UnitsHistogram';
import { fmtDate } from '../components/charts/ArticleChart';
import { ImpactContext } from '../components/ImpactContext';
import { ModuleHeader } from '../components/ModuleHeader';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtNumber, fmtPct, NOT_AVAILABLE } from '../format';
import { wape } from '../impactMath';
import { cellName } from '../naming';
import { hashFor } from '../router';
import type { Descriptive, Items, ItemSeries, Segments } from '../types';
import { useStartDates } from './ItemView';

const usd = (v: number | null | undefined) => (v === null || v === undefined || !Number.isFinite(v) ? NOT_AVAILABLE : `${fmtNumber(v)} US$`);
const pct = (v: number | null) => fmtPct(v === null ? null : v * 100);

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

  const back = <p><a className="btn small" href={hashFor(`/articulo/${itemId}`, 'A')}><span aria-hidden="true">←</span> Volver al artículo</a></p>;
  if (items.status === 'error') return <LoadError error={items.error} />;
  if (items.status !== 'ready') return <Loading />;
  if (!item) {
    return (
      <>
        {back}
        <div className="note">“{itemId}” no entró al pronóstico: no tiene cálculo de ahorro ni error (solo los 517 artículos con pronóstico).</div>
      </>
    );
  }
  for (const s of [series, descriptive]) if (s.status === 'error') return <LoadError error={s.error} />;
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
    const head = 'inicio_periodo,periodo,vendido,sin_faltantes,pronostico,linea_base';
    const lines = test.map((r) => [startDates.get(r.block) ?? '', r.block, r.units_observed ?? '', r.units_completed ?? '', r.forecast?.A ?? '', r.baseline ?? ''].join(','));
    downloadCsv(`${item.item_id}_ano_de_prueba.csv`, [head, ...lines].join('\n'));
  };

  return (
    <>
      {back}
      <ModuleHeader title={<>Detalle del pronóstico · <span className="mono">{item.item_id}</span></>} subtitle={`${cellName(item.cell)} · año de prueba: periodos ${from}–${to}`} />

      <div className="card">
        <h2>Cómo se calcula el ahorro</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th className="left">Concepto · año de prueba ({test.length} periodos)</th><th>Línea base</th><th>Pronóstico</th><th>Diferencia (ahorro)</th></tr></thead>
            <tbody>
              <tr><td className="left">Unidades pronosticadas en el año</td><td>{fmtNumber(sum(base))} u.</td><td>{fmtNumber(sum(fc))} u.</td><td>real sin faltantes: {fmtNumber(sum(real))} u.</td></tr>
              <tr><td className="left">Error medio por periodo (WAPE)</td><td>{pct(baseWape)} *</td><td>{pct(met.wape_units)}</td><td className="good">{baseWape !== null && met.wape_units !== null ? `${fmtNumber((baseWape - met.wape_units) * 100, 1)} puntos menos` : NOT_AVAILABLE}</td></tr>
              <tr><td className="left">Colchón para atender el 95 % (z)</td><td>{fmtNumber(imp.z_naive, 2)}</td><td>{fmtNumber(imp.z_model, 2)}</td><td></td></tr>
              <tr><td className="left">Mercancía sobrante</td><td>{usd(imp.excess_naive)}</td><td>{usd(imp.excess_model)}</td><td className={imp.impact_excess < 0 ? 'neg' : 'good'}>{diff(imp.excess_naive, imp.excess_model)}</td></tr>
              <tr><td className="left">Ventas perdidas por falta de producto</td><td>{usd(imp.lost_naive)}</td><td>{usd(imp.lost_model)}</td><td className={imp.impact_lost < 0 ? 'neg' : 'good'}>{diff(imp.lost_naive, imp.lost_model)}</td></tr>
              <tr className="strong-row"><td className="left">Costo total de equivocarse</td><td>{usd(costN)}</td><td>{usd(costM)}</td><td className={imp.impact < 0 ? 'neg' : 'good'}>{diff(costN, costM)}</td></tr>
              <tr><td className="left">Como % de la demanda del año ({usd(imp.demand)})</td><td>{fmtPct((costN / imp.demand) * 100)}</td><td>{fmtPct((costM / imp.demand) * 100)}</td><td className={imp.impact < 0 ? 'neg' : 'good'}>{fmtPct(imp.impact_pct_demand)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="small muted">
          Para atender el 95 % de la demanda total, a cada pedido se le suma un colchón de z × el error típico. Los totales de unidades del año
          pueden casi coincidir; el ahorro sale de que la línea base se equivoca más de un periodo a otro, necesita más colchón y ese colchón
          termina como sobrante. * WAPE de la línea base: calculado en el sitio a partir de la serie exportada (lectura derivada).
        </p>
        {segs.status === 'ready' && <ImpactContext impact={imp} concentration={segs.data.concentration.A} />}
      </div>

      <div className="card section">
        <h2>Error del pronóstico</h2>
        <div className="kpis three">
          <div className="kpi"><span className="lbl">Error del pronóstico (WAPE)</span><span className="v">{pct(met.wape_units)}</span><span className="l">error absoluto ÷ venta sin faltantes; línea base: {pct(baseWape)}</span></div>
          <div className="kpi"><span className="lbl">Error medio por periodo (MAE)</span><span className="v">{fmtNumber(met.mae_units)} u.</span><span className="l">unidades por periodo de 4 semanas</span></div>
          <div className="kpi"><span className="lbl">Error comparable (RMSSE)</span><span className="v">{fmtNumber(met.rmsse_units, 3)}</span><span className="l">escalado por la variación típica de la serie (criterio M5)</span></div>
          <div className="kpi"><span className="lbl">Variabilidad de la venta (CV de train)</span><span className="v">{fmtPct(item.cv_train)}</span><span className="l">sin días de faltante; define su grupo</span></div>
          <div className="kpi"><span className="lbl">Variabilidad histórica (descriptiva)</span><span className="v">{fmtPct(st.cv_pct)}</span><span className="l">desde el lanzamiento · media {fmtNumber(st.mean)} u., σ {fmtNumber(st.sigma)} u.</span></div>
          <div className="kpi"><span className="lbl">Marcado para revisión</span><span className="v">{met.review ? 'Sí' : 'No'}</span><span className="l">{met.review ? 'error fuera de lo normal en el año de prueba' : 'el proyecto no lo marcó'}</span></div>
        </div>
      </div>

      <div className="grid-2 section">
        <div className="card">
          <h2>Distribución de unidades por periodo</h2>
          <UnitsHistogram bins={descriptive.data.histogram} />
          <p className="small muted">{fmtNumber(st.n_blocks)} periodos desde el lanzamiento, en 8 rangos de igual ancho.</p>
        </div>
        <div className="card">
          <h2>Venta en dinero por periodo</h2>
          <MoneyChart rows={descriptive.data.rows} />
          <p className="small muted">A precio de venta, por periodo de 4 semanas.</p>
        </div>
      </div>

      <div className="card section">
        <div className="card-head">
          <h2>Pronóstico por periodo · año de prueba</h2>
          <button type="button" className="btn primary small" onClick={csv}>Exportar CSV <span aria-hidden="true">⤓</span></button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th className="left">Inicio del periodo</th><th>Se vendió</th><th>Sin faltantes</th><th>Pronóstico</th><th>Línea base</th><th>Pronóstico − real</th></tr></thead>
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
        <p className="small"><a className="btn small" href={hashFor(`/articulo/${item.item_id}/playground`, 'A')}>Reproducir el año de prueba periodo a periodo <span aria-hidden="true">→</span></a></p>
      </div>
    </>
  );
}
