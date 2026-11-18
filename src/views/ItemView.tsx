// Artículo (spec 002, US3): frase de acierto, gráfica con pronóstico y línea base, y ahorro.
import { useMemo } from 'react';
import { ArticleChart, type ArticleRow, fmtDate } from '../components/charts/ArticleChart';
import { ItemCombobox } from '../components/ItemCombobox';
import { ModuleHeader } from '../components/ModuleHeader';
import { Pill } from '../components/Pill';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtK, fmtNumber, fmtPct } from '../format';
import { cellName, POLICY } from '../naming';
import { hashFor, withForecastOnly } from '../router';
import { LEVEL_COLOR } from '../theme';
import type { Catalog, CatalogItem, Descriptive, Item, Items, ItemSeries, Meta } from '../types';

/** Artículo que abre la ficha cuando no se elige ninguno (nunca vacía). */
export const DEFAULT_ITEM = 'FOODS_3_090';

/** Filas de la gráfica: lo vendido desde la serie descriptiva; para los 517, la serie de pronóstico. */
export function articleRows(d: Descriptive, series: ItemSeries | null, item: Item | undefined): ArticleRow[] {
  const byBlock = new Map((series?.rows ?? []).map((r) => [r.block, r]));
  return d.rows.map((r) => {
    const s = byBlock.get(r.block);
    const inTest = item !== undefined && r.block >= item.test_blocks[0] && r.block <= item.test_blocks[1];
    return {
      block: r.block,
      observed: r.units_observed,
      completed: s ? s.units_completed : null,
      forecast: inTest && s?.forecast ? s.forecast.A : null,
      baseline: inTest ? s?.baseline ?? null : null,
    };
  });
}

export function useStartDates() {
  const meta = useData<Meta>('meta.json');
  return useMemo(() => new Map(meta.status === 'ready' ? meta.data.blocks.map((b) => [b.block, b.start_date] as [number, string]) : []), [meta]);
}

function Controls({ catalog, forecastOnly }: { catalog: CatalogItem[]; forecastOnly: boolean }) {
  const hash = typeof window === 'undefined' ? '#/articulo' : window.location.hash || '#/articulo';
  return (
    <>
      <ItemCombobox items={catalog} forecastOnly={forecastOnly} scenario="A" />
      <Pill active={forecastOnly} href={withForecastOnly(hash, !forecastOnly)}>Solo con pronóstico</Pill>
    </>
  );
}

/** Montos de un artículo: en US$ si son pequeños, en miles si no. */
const money = (v: number) => (Math.abs(v) < 10000 ? `${fmtNumber(v)} US$` : fmtK(v));

function Savings({ item }: { item: Item }) {
  const imp = item.impact.A;
  const lessExcess = imp.excess_naive - imp.excess_model;
  const moreLost = imp.lost_model - imp.lost_naive;
  const worse = imp.impact < 0;
  return (
    <div className="card section">
      <div className="card-head">
        <h2>¿Cuánto ahorra este artículo?</h2>
        <a className="btn small icon-btn" href={hashFor(`/articulo/${item.item_id}/detalle`, 'A')}><span className="ico" aria-hidden="true">i</span>Ver el cálculo</a>
      </div>
      <p>
        {worse
          ? <>En este artículo, pedir con el pronóstico habría costado <b className="neg">{money(-imp.impact)}</b> más que la línea base en el año.</>
          : <>Frente a la línea base, pedir con el pronóstico habría ahorrado <b className="good">{money(imp.impact)}</b> en el año, el {fmtPct(imp.impact_pct_demand, 0)} de su demanda ({money(imp.demand)}).</>}
      </p>
      <div className="kpis">
        <div className="kpi"><span className="v amber">{money(Math.abs(lessExcess))}</span><span className="l">{lessExcess >= 0 ? 'menos' : 'más'} mercancía sobrante</span></div>
        <div className="kpi"><span className={`v ${moreLost >= 0 ? 'red' : 'good'}`}>{money(Math.abs(moreLost))}</span><span className="l">{moreLost >= 0 ? 'más' : 'menos'} ventas perdidas</span></div>
        <div className="kpi"><span className={`v ${worse ? 'red' : 'good'}`}>{money(Math.abs(imp.impact))}</span><span className="l">{worse ? 'costo adicional neto' : 'ahorro neto'} en el año</span></div>
      </div>
    </div>
  );
}

export function ItemView({ itemId, forecastOnly }: { itemId?: string; forecastOnly: boolean }) {
  const id = itemId ?? DEFAULT_ITEM;
  const catalog = useData<Catalog>('catalog.json');
  const entry = catalog.status === 'ready' ? catalog.data.items.find((i) => i.item_id === id) : undefined;
  const descriptive = useData<Descriptive>(entry ? `descriptive/${entry.item_id}.json` : null);
  // Lo de pronóstico se carga solo para los 517 (constitución II.2)
  const items = useData<Items>(entry?.forecasted ? 'items.json' : null);
  const series = useData<ItemSeries>(entry?.forecasted ? `series/${entry.item_id}.json` : null);
  const startDates = useStartDates();

  if (catalog.status === 'error') return <LoadError error={catalog.error} />;
  if (catalog.status !== 'ready') return <Loading />;
  const controls = <Controls catalog={catalog.data.items} forecastOnly={forecastOnly} />;
  if (!entry) {
    return (
      <>
        <ModuleHeader title="Artículo">{controls}</ModuleHeader>
        <div className="note">“{id}” no está en el catálogo de 3.049.</div>
      </>
    );
  }

  const item = items.status === 'ready' ? items.data.items.find((i) => i.item_id === entry.item_id) : undefined;
  const subtitle = (
    <>
      <span className="pill-seg" style={{ borderColor: entry.cell ? LEVEL_COLOR[entry.cell[1]] : undefined }}>{cellName(entry.cell)}</span>
      {' '}· desde {fmtDate(startDates.get(entry.first_block)).replace(/^\d+ /, '')}
      {item && <> · política sugerida: {(POLICY[item.treatment] ?? item.treatment).toLowerCase()}</>}
    </>
  );

  let body;
  if (descriptive.status === 'error') body = <LoadError error={descriptive.error} />;
  else if (descriptive.status !== 'ready' || (entry.forecasted && (items.status === 'loading' || series.status === 'loading'))) body = <Loading />;
  else if (items.status === 'error') body = <LoadError error={items.error} />;
  else if (series.status === 'error') body = <LoadError error={series.error} />;
  else {
    const d = descriptive.data;
    const s = series.status === 'ready' ? series.data : null;
    const rows = articleRows(d, s, item);
    const test = item ? { from: item.test_blocks[0], to: item.test_blocks[1] } : null;
    const testRows = item ? rows.filter((r) => r.block >= item.test_blocks[0] && r.block <= item.test_blocks[1]) : [];
    const typical = testRows.length ? testRows.reduce((a, r) => a + (r.completed ?? 0), 0) / testRows.length : null;
    const w = item?.metrics.A.wape_units ?? null;
    const mae = item?.metrics.A.mae_units ?? null;
    body = (
      <>
        <div className="card">
          {item ? (
            <p className="headline">
              En el año de prueba el pronóstico acertó <em>{w === null ? 'no disponible' : `${fmtNumber((1 - w) * 100)} de cada 100 unidades`}</em>
              {mae !== null && typical !== null && <>: se equivocó en unas {fmtNumber(Math.round(mae / 10) * 10)} unidades por periodo, sobre una venta típica de {fmtNumber(typical / 1000, typical < 10000 ? 1 : 0)} mil</>}.
            </p>
          ) : (
            <>
              <h2>Este artículo no entró al pronóstico</h2>
              <p className="muted">Solo los 517 artículos Vitales con pronóstico tienen pronóstico, error e impacto. Aquí se muestra su historia.</p>
              <a className="btn small" href={hashFor('/segmentacion', 'A')}>Ver el embudo <span aria-hidden="true">→</span></a>
            </>
          )}
        </div>
        <div className="card section">
          <div className="card-head">
            <h2>Unidades vendidas cada 4 semanas</h2>
            {item && <a className="btn small icon-btn" href={hashFor(`/articulo/${item.item_id}/detalle`, 'A')}><span className="ico" aria-hidden="true">i</span>Detalle del pronóstico</a>}
          </div>
          <ArticleChart rows={rows} test={test} stats={d.stats} startDates={startDates} />
          <p className="small muted">
            Suma de las 10 tiendas.{test && ' La franja sombreada es el año de prueba: allí se comparan el pronóstico y la línea base (repetir lo vendido en el mismo periodo del año anterior) contra la venta sin faltantes, que estima lo que se habría vendido con producto disponible.'}
          </p>
        </div>
        {item && <Savings item={item} />}
      </>
    );
  }

  return (
    <>
      <ModuleHeader title={<>Artículo <span className="mono">{entry.item_id}</span></>} subtitle={subtitle}>{controls}</ModuleHeader>
      {body}
    </>
  );
}
