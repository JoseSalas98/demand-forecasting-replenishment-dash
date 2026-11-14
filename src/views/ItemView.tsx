import { useMemo } from 'react';
import { MoneyChart } from '../components/charts/MoneyChart';
import { UnitsBandChart } from '../components/charts/UnitsBandChart';
import { UnitsHistogram } from '../components/charts/UnitsHistogram';
import { ItemCombobox } from '../components/ItemCombobox';
import { ModuleHeader } from '../components/ModuleHeader';
import { Money } from '../components/Money';
import { Pill, SCENARIO_LABEL, ScenarioPills } from '../components/Pill';
import { Saving } from '../components/Saving';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtNumber, fmtPct, MONEY_LABEL } from '../format';
import { hashFor, withForecastOnly } from '../router';
import { ImpactContext } from '../components/ImpactContext';
import type { Catalog, CatalogItem, Descriptive, Item, Items, ItemSeries, Meta, Scenario, Segments } from '../types';

function Controls({ catalog, forecastOnly, scenario }: { catalog: CatalogItem[]; forecastOnly: boolean; scenario: Scenario }) {
  const hash = typeof window === 'undefined' ? '#/articulo' : window.location.hash || '#/articulo';
  return (
    <>
      <ItemCombobox items={catalog} forecastOnly={forecastOnly} scenario={scenario} />
      <Pill active={forecastOnly} href={withForecastOnly(hash, !forecastOnly)}>Pronóstico</Pill>
    </>
  );
}

/** Tarjetas de error del artículo (solo los 517). RMSSE de A y B van en tarjetas separadas. */
function MetricCards({ item, scenario }: { item: Item; scenario: Scenario }) {
  const m = item.metrics[scenario];
  const baseLink = <a href={hashFor(`/segmentacion/${item.cell}`, scenario)}>línea base: no disponible por artículo</a>;
  return (
    <div className="card">
      <div className="module-controls" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <h2>Error en test</h2>
        <ScenarioPills scenario={scenario} small />
      </div>
      <div className="grid-2">
        <div>
          <div className="label">RMSSE · 1 paso (A)</div>
          <div className="big-number">{fmtNumber(item.metrics.A.rmsse_units, 3)}</div>
          <div className="small">{baseLink}</div>
        </div>
        <div>
          <div className="label">RMSSE · cadena (B)</div>
          <div className="big-number">{fmtNumber(item.metrics.B.rmsse_units, 3)}</div>
          <div className="small">{baseLink}</div>
        </div>
        <div>
          <div className="label">WAPE · {SCENARIO_LABEL[scenario]}</div>
          <div className="big-number">{fmtPct(m.wape_units === null ? null : m.wape_units * 100)}</div>
        </div>
        <div>
          <div className="label">MAE · {SCENARIO_LABEL[scenario]}</div>
          <div className="big-number">{fmtNumber(m.mae_units, 1)} u.</div>
        </div>
      </div>
      {m.review && <div className="tag" style={{ marginTop: 10 }}>marcado para revisión</div>}
    </div>
  );
}

function NotForecasted({ scenario }: { scenario: Scenario }) {
  return (
    <div className="card">
      <h2>Este artículo no entró al pronóstico</h2>
      <p className="muted">
        Solo los 517 artículos AX, AY y AZ modelados tienen pronóstico, error e impacto. Aquí se muestra su historia descriptiva.
      </p>
      <a href={hashFor('/segmentacion', scenario)}>Ver el embudo →</a>
    </div>
  );
}

/** Parte de pronóstico e impacto, sin cambios funcionales respecto de la iteración 1. */
function ForecastDetail({ item, series, scenario, startDates }: { item: Item; series: ItemSeries; scenario: Scenario; startDates: Map<number, string> }) {
  const rows = series.rows.filter((r) => r.block >= item.first_block);
  const testRows = rows.filter((r) => r.step !== null);
  const imp = item.impact[scenario];
  const segs = useData<Segments>('segments.json');
  return (
    <>
      <div className="card section">
        <h2>¿Cuánto pido? · test bloques {item.test_blocks[0]}–{item.test_blocks[1]} · {SCENARIO_LABEL[scenario]}</h2>
        <div className="note">
          Referencia: el pronóstico en unidades de cada bloque. El impacto de este artículo se valoró con z fijo ={' '}
          {fmtNumber(imp.z_model, 3)}. El colchón y la cantidad a reponer por bloque no están construidos en las salidas del modelo.
        </div>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr><th>Paso</th><th>Bloque</th><th>Inicio</th><th>Venta observada</th><th>Venta completada</th><th>Pronóstico {scenario}</th><th>Línea base</th><th>Diferencia (pronóstico − completada)</th></tr>
            </thead>
            <tbody>
              {testRows.map((r) => {
                const f = r.forecast ? r.forecast[scenario] : null;
                const diff = f !== null && r.units_completed !== null ? f - r.units_completed : null;
                return (
                  <tr key={r.block}>
                    <td>{r.step}</td>
                    <td>{r.block}</td>
                    <td>{startDates.get(r.block) ?? '—'}</td>
                    <td>{fmtNumber(r.units_observed)}</td>
                    <td>{fmtNumber(r.units_completed)}</td>
                    <td>{fmtNumber(f)}</td>
                    <td>{fmtNumber(r.baseline)}</td>
                    <td>{fmtNumber(diff)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card section">
        <h2>Impacto en dinero del año de test · {SCENARIO_LABEL[scenario]}</h2>
        <div className="grid-2">
          <div className="table-wrap">
            <table>
              <thead><tr><th></th><th>Modelo {scenario}</th><th>Línea base</th></tr></thead>
              <tbody>
                <tr><td>Venta perdida</td><td><Money value={imp.lost_model} compact /></td><td><Money value={imp.lost_naive} compact /></td></tr>
                <tr><td>Exceso en anaquel</td><td><Money value={imp.excess_model} compact /></td><td><Money value={imp.excess_naive} compact /></td></tr>
              </tbody>
            </table>
          </div>
          <div className="stack">
            <div>
              <div className="label">Ahorro frente a no hacer nada</div>
              <div>{imp.impact < 0 ? 'En este artículo ' : ''}<Saving value={imp.impact} /></div>
              <div className="small muted">{fmtPct(imp.impact_pct_demand)} de su demanda (<Money value={imp.demand} compact />)</div>
            </div>
            <div className="small">
              … en venta perdida: <Saving value={imp.impact_lost} compact sentence={false} /> · en exceso:{' '}
              <Saving value={imp.impact_excess} compact sentence={false} />
            </div>
          </div>
        </div>
        {segs.status === 'ready' && <ImpactContext impact={imp} concentration={segs.data.concentration[scenario]} scenario={scenario} />}
        <p className="small muted">El nivel de servicio no se mueve por artículo; se mueve por segmento y en el total (módulo Impacto).</p>
        <p><a href={hashFor(`/articulo/${item.item_id}/playground`, scenario)}>Reproducir el test bloque a bloque →</a></p>
      </div>

      <details className="section">
        <summary>Tabla de historia por bloque</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Bloque</th><th>Inicio</th><th>Venta observada (u.)</th><th>Venta completada (u.)</th><th>Ratio (completada ÷ anterior)</th><th>Dinero observado</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.block}>
                  <td>{r.block}</td>
                  <td>{startDates.get(r.block) ?? '—'}</td>
                  <td>{fmtNumber(r.units_observed)}</td>
                  <td>{fmtNumber(r.units_completed)}</td>
                  <td>{fmtNumber(r.ratio_completed, 3)}</td>
                  <td><Money value={r.money_observed} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export function ItemView({ itemId, scenario, forecastOnly }: { itemId?: string; scenario: Scenario; forecastOnly: boolean }) {
  const catalog = useData<Catalog>('catalog.json');
  const meta = useData<Meta>('meta.json');
  const entry = catalog.status === 'ready' && itemId ? catalog.data.items.find((i) => i.item_id === itemId) : undefined;
  const descriptive = useData<Descriptive>(entry ? `descriptive/${entry.item_id}.json` : null);
  // Lo de pronóstico se carga solo para los 517 (constitución II.2)
  const items = useData<Items>(entry?.forecasted ? 'items.json' : null);
  const series = useData<ItemSeries>(entry?.forecasted ? `series/${entry.item_id}.json` : null);
  const startDates = useMemo(
    () => new Map(meta.status === 'ready' ? meta.data.blocks.map((b) => [b.block, b.start_date] as [number, string]) : []),
    [meta],
  );

  if (catalog.status === 'error') return <LoadError error={catalog.error} />;
  if (catalog.status !== 'ready') return <Loading />;
  const controls = <Controls catalog={catalog.data.items} forecastOnly={forecastOnly} scenario={scenario} />;

  if (!itemId) {
    return (
      <>
        <ModuleHeader title="Artículo" subtitle="Historia de cualquiera de los 3.049 artículos; pronóstico para los 517 modelados" />
        <div className="card">
          <h2>Elige un artículo</h2>
          <p className="muted">Escribe parte del código (p. ej., FOODS_3) o despliega la lista. Con «Pronóstico» activo, solo los 517 con pronóstico.</p>
          <div className="module-controls">{controls}</div>
        </div>
      </>
    );
  }
  if (!entry) {
    return (
      <>
        <ModuleHeader title="Artículo">{controls}</ModuleHeader>
        <div className="note">“{itemId}” no está en el catálogo de 3.049.</div>
      </>
    );
  }

  const item = items.status === 'ready' ? items.data.items.find((i) => i.item_id === entry.item_id) : undefined;
  const cvTrain = item?.cv_train ?? null;
  const subtitle =
    `${entry.cell ?? 'celda no disponible'} · 10 tiendas · bloques de 28 días · bandas = media ± 3σ` +
    (cvTrain !== null ? ` · CV de train (segmentación) ${fmtNumber(cvTrain, 1)} %` : '');

  let body;
  if (descriptive.status === 'error') body = <LoadError error={descriptive.error} />;
  else if (descriptive.status !== 'ready') body = <Loading />;
  else {
    const d = descriptive.data;
    const st = d.stats;
    let right;
    if (!entry.forecasted) right = <NotForecasted scenario={scenario} />;
    else if (items.status === 'error') right = <LoadError error={items.error} />;
    else if (!item) right = <Loading />;
    else right = <MetricCards item={item} scenario={scenario} />;

    const test =
      item && series.status === 'ready'
        ? { from: item.test_blocks[0], to: item.test_blocks[1], rows: series.data.rows, scenario }
        : undefined;

    body = (
      <>
        <div className="grid-main">
          <div className="stack">
            <div className="card">
              <h2>Unidades por bloque</h2>
              <UnitsBandChart data={d} test={test} startDates={startDates} />
              <p className="small muted">Desde el lanzamiento (bloque {d.first_block}); suma de las 10 tiendas.</p>
            </div>
            <div className="card">
              <h2>Venta en dinero por bloque ({MONEY_LABEL})</h2>
              <MoneyChart rows={d.rows} />
            </div>
          </div>
          <div className="stack">
            {right}
            <div className="card">
              <div className="title">Coeficiente de variación</div>
              <div className="big-number">{fmtPct(st.cv_pct)}</div>
              <div className="small">media {fmtNumber(st.mean, 1)} u · σ {fmtNumber(st.sigma, 1)} u</div>
              <div className="legend-note">σ ÷ media de los bloques desde el lanzamiento (descriptivo)</div>
            </div>
            <div className="card">
              <div className="title">Distribución de unidades</div>
              <UnitsHistogram bins={d.histogram} />
              <div className="legend-note">{fmtNumber(st.n_blocks)} bloques en 8 intervalos de igual ancho</div>
            </div>
          </div>
        </div>
        {item && series.status === 'ready' && <ForecastDetail item={item} series={series.data} scenario={scenario} startDates={startDates} />}
        {series.status === 'error' && <LoadError error={series.error} />}
      </>
    );
  }

  return (
    <>
      <ModuleHeader title={`Artículo · ${entry.item_id}`} subtitle={subtitle}>{controls}</ModuleHeader>
      {body}
    </>
  );
}
