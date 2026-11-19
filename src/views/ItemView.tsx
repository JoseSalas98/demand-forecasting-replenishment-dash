// Artículo (specs 002 y 003): sin artículo elegido, un buscador destacado; con uno, frase de acierto,
// gráfica con pronóstico y línea base, y ahorro.
import { useMemo } from 'react';
import { ArticleChart, type ArticleRow } from '../components/charts/ArticleChart';
import { ItemCombobox } from '../components/ItemCombobox';
import { ModuleHeader } from '../components/ModuleHeader';
import { Pill } from '../components/Pill';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtK, fmtMonthYear, fmtNumber, fmtPct, fmtUsd } from '../format';
import { t } from '../i18n';
import { cellName, policy } from '../naming';
import { hashFor, withForecastOnly } from '../router';
import { LEVEL_COLOR } from '../theme';
import type { Catalog, CatalogItem, Descriptive, Item, Items, ItemSeries, Meta } from '../types';

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

function ForecastPill({ forecastOnly }: { forecastOnly: boolean }) {
  const hash = typeof window === 'undefined' ? '#/articulo' : window.location.hash || '#/articulo';
  return <Pill active={forecastOnly} href={withForecastOnly(hash, !forecastOnly)}>{t().item.forecastOnly}</Pill>;
}

/** Estado vacío: nada que mostrar hasta que se elija un artículo (FR spec 003). */
function PickItem({ catalog, forecastOnly }: { catalog: CatalogItem[]; forecastOnly: boolean }) {
  const s = t().item;
  return (
    <div className="card pick-item">
      <span className="pick-ico" aria-hidden="true">∿</span>
      <h2>{s.emptyTitle}</h2>
      <p>{s.emptyText}</p>
      <span className="pick-hint">{s.emptyHint}</span>
      <ItemCombobox items={catalog} forecastOnly={forecastOnly} scenario="A" big />
      <ForecastPill forecastOnly={forecastOnly} />
      <p className="small">{s.emptyFilter}</p>
    </div>
  );
}

/** Montos de un artículo: en US$ si son pequeños, en miles si no. */
const money = (v: number) => (Math.abs(v) < 10000 ? fmtUsd(v) : fmtK(v));

function Savings({ item }: { item: Item }) {
  const s = t().item;
  const imp = item.impact.A;
  const lessExcess = imp.excess_naive - imp.excess_model;
  const moreLost = imp.lost_model - imp.lost_naive;
  const worse = imp.impact < 0;
  const [pre, amount, post] = worse ? s.worse(money(-imp.impact)) : s.better(money(imp.impact), fmtPct(imp.impact_pct_demand, 0), money(imp.demand));
  return (
    <div className="card section">
      <div className="card-head">
        <h2>{s.savingsTitle}</h2>
        <a className="btn small icon-btn" href={hashFor(`/articulo/${item.item_id}/detalle`, 'A')}><span className="ico" aria-hidden="true">i</span>{s.seeCalc}</a>
      </div>
      <p>{pre}<b className={worse ? 'neg' : 'good'}>{amount}</b>{post}</p>
      <div className="kpis">
        <div className="kpi"><span className="v amber">{money(Math.abs(lessExcess))}</span><span className="l">{lessExcess >= 0 ? s.lessExcess : s.moreExcess}</span></div>
        <div className="kpi"><span className={`v ${moreLost >= 0 ? 'red' : 'good'}`}>{money(Math.abs(moreLost))}</span><span className="l">{moreLost >= 0 ? s.moreLost : s.lessLost}</span></div>
        <div className="kpi"><span className={`v ${worse ? 'red' : 'good'}`}>{money(Math.abs(imp.impact))}</span><span className="l">{worse ? s.netCost : s.netSaving}</span></div>
      </div>
    </div>
  );
}

export function ItemView({ itemId, forecastOnly }: { itemId?: string; forecastOnly: boolean }) {
  const s = t().item;
  const catalog = useData<Catalog>('catalog.json');
  const entry = catalog.status === 'ready' && itemId ? catalog.data.items.find((i) => i.item_id === itemId) : undefined;
  const descriptive = useData<Descriptive>(entry ? `descriptive/${entry.item_id}.json` : null);
  // Lo de pronóstico se carga solo para los 517 (constitución II.2)
  const items = useData<Items>(entry?.forecasted ? 'items.json' : null);
  const series = useData<ItemSeries>(entry?.forecasted ? `series/${entry.item_id}.json` : null);
  const startDates = useStartDates();

  if (catalog.status === 'error') return <LoadError error={catalog.error} />;
  if (catalog.status !== 'ready') return <Loading />;
  if (!itemId) {
    return (
      <>
        <ModuleHeader title={s.title} />
        <PickItem catalog={catalog.data.items} forecastOnly={forecastOnly} />
      </>
    );
  }
  const controls = (
    <>
      <ItemCombobox items={catalog.data.items} forecastOnly={forecastOnly} scenario="A" />
      <ForecastPill forecastOnly={forecastOnly} />
    </>
  );
  if (!entry) {
    return (
      <>
        <ModuleHeader title={s.title}>{controls}</ModuleHeader>
        <div className="note">{s.notInCatalog(itemId)}</div>
      </>
    );
  }

  const item = items.status === 'ready' ? items.data.items.find((i) => i.item_id === entry.item_id) : undefined;
  const subtitle = (
    <>
      <span className="pill-seg" style={{ borderColor: entry.cell ? LEVEL_COLOR[entry.cell[1]] : undefined }}>{cellName(entry.cell)}</span>
      {' '}· {s.since(fmtMonthYear(startDates.get(entry.first_block)))}
      {item && <> · {s.policy(policy(item.treatment).toLowerCase())}</>}
    </>
  );

  let body;
  if (descriptive.status === 'error') body = <LoadError error={descriptive.error} />;
  else if (descriptive.status !== 'ready' || (entry.forecasted && (items.status === 'loading' || series.status === 'loading'))) body = <Loading />;
  else if (items.status === 'error') body = <LoadError error={items.error} />;
  else if (series.status === 'error') body = <LoadError error={series.error} />;
  else {
    const d = descriptive.data;
    const ser = series.status === 'ready' ? series.data : null;
    const rows = articleRows(d, ser, item);
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
              {s.hitRate[0]}<em>{w === null ? t().common.na : s.hitN(fmtNumber((1 - w) * 100))}</em>{s.hitRate[1]}
              {mae !== null && typical !== null && s.missBy(fmtNumber(Math.round(mae / 10) * 10), fmtNumber(typical / 1000, typical < 10000 ? 1 : 0))}.
            </p>
          ) : (
            <>
              <h2>{s.notForecastTitle}</h2>
              <p className="muted">{s.notForecastText}</p>
              <a className="btn small" href={hashFor('/segmentacion', 'A')}>{s.seeFunnel} <span aria-hidden="true">→</span></a>
            </>
          )}
        </div>
        <div className="card section">
          <div className="card-head">
            <h2>{s.chartTitle}</h2>
            {item && <a className="btn small icon-btn" href={hashFor(`/articulo/${item.item_id}/detalle`, 'A')}><span className="ico" aria-hidden="true">i</span>{s.forecastDetail}</a>}
          </div>
          <ArticleChart rows={rows} test={test} stats={d.stats} startDates={startDates} />
          <p className="small muted">{s.chartNote}{test && s.chartNoteTest}</p>
        </div>
        {item && <Savings item={item} />}
      </>
    );
  }

  return (
    <>
      <ModuleHeader title={<>{s.title} <span className="mono">{entry.item_id}</span></>} subtitle={subtitle}>{controls}</ModuleHeader>
      {body}
    </>
  );
}
