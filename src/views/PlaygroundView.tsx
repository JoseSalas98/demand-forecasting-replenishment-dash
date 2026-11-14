import { useEffect, useMemo, useState } from 'react';
import { UnitsBandChart } from '../components/charts/UnitsBandChart';
import { ImpactContext } from '../components/ImpactContext';
import { ModuleHeader } from '../components/ModuleHeader';
import { Money } from '../components/Money';
import { SCENARIO_LABEL, ScenarioPills } from '../components/Pill';
import { Saving } from '../components/Saving';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtNumber } from '../format';
import { hashFor } from '../router';
import type { Descriptive, Items, ItemSeries, Meta, Scenario, Segments } from '../types';

/**
 * Reproduce el año de test bloque a bloque sobre la misma gráfica y las mismas columnas que la
 * ficha del artículo: la historia completa queda a la vista y el tramo de test se revela al avanzar.
 */
export function PlaygroundView({ itemId, scenario }: { itemId: string; scenario: Scenario }) {
  const items = useData<Items>('items.json');
  const meta = useData<Meta>('meta.json');
  const segs = useData<Segments>('segments.json');
  const item = items.status === 'ready' ? items.data.items.find((i) => i.item_id === itemId) : undefined;
  const series = useData<ItemSeries>(item ? `series/${item.item_id}.json` : null);
  const descriptive = useData<Descriptive>(item ? `descriptive/${item.item_id}.json` : null);
  const [step, setStep] = useState(1);
  useEffect(() => setStep(1), [scenario, itemId]); // cambiar de escenario reinicia
  const startDates = useMemo(
    () => new Map(meta.status === 'ready' ? meta.data.blocks.map((b) => [b.block, b.start_date] as [number, string]) : []),
    [meta],
  );

  for (const s of [items, meta]) if (s.status === 'error') return <LoadError error={s.error} />;
  if (items.status !== 'ready' || meta.status !== 'ready') return <Loading />;
  if (!item) return <p>“{itemId}” no está entre los 517 pronosticados.</p>;
  for (const s of [series, descriptive]) if (s.status === 'error') return <LoadError error={s.error} />;
  if (series.status !== 'ready' || descriptive.status !== 'ready') return <Loading />;

  const testRows = series.data.rows.filter((r) => r.step !== null);
  const n = testRows.length;
  const current = testRows[step - 1];
  const seen = testRows.filter((r) => (r.step ?? 0) <= step);
  let accReal: number | null = 0, accFc: number | null = 0, accBase: number | null = 0;
  const acc = seen.map((r) => {
    const f = r.forecast ? r.forecast[scenario] : null;
    accReal = accReal === null || r.units_completed === null ? null : accReal + r.units_completed;
    accFc = accFc === null || f === null ? null : accFc + f;
    accBase = accBase === null || r.baseline === null ? null : accBase + r.baseline;
    return { r, f, accReal, accFc, accBase };
  });
  const imp = item.impact[scenario];

  return (
    <>
      <p className="small"><a href={hashFor(`/articulo/${item.item_id}`, scenario)}>← {item.item_id}</a></p>
      <ModuleHeader
        title={`Playground · ${item.item_id}`}
        subtitle={<>Reproduce el año de test bloque a bloque · escenario <span className="scenario-badge">{SCENARIO_LABEL[scenario]}</span></>}
      >
        <ScenarioPills scenario={scenario} />
      </ModuleHeader>
      <div className="controls">
        <button className="btn" onClick={() => setStep(1)} disabled={step === 1}>Reiniciar</button>
        <button className="btn" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>◀ anterior</button>
        <button className="btn" onClick={() => setStep(Math.min(n, step + 1))} disabled={step === n}>siguiente ▶</button>
        <button className="btn" onClick={() => setStep(n)} disabled={step === n}>Ver el año completo</button>
        <strong>Paso {step} de {n}</strong>
        {current && <span className="muted">bloque {current.block} · inicia {startDates.get(current.block) ?? '—'}</span>}
      </div>
      <div className="card">
        <UnitsBandChart
          data={descriptive.data}
          test={{ from: item.test_blocks[0], to: item.test_blocks[1], rows: series.data.rows, scenario, revealUpTo: current?.block }}
          startDates={startDates}
        />
        <p className="small muted">
          Misma gráfica que la ficha del artículo. La venta observada es la registrada; la completada trata los quiebres de stock y es
          contra la que se evalúa el pronóstico.
        </p>
      </div>
      <div className="table-wrap section">
        <table>
          <thead>
            <tr>
              <th>Paso</th><th>Bloque</th><th>Venta observada</th><th>Venta completada</th><th>Pronóstico {scenario}</th><th>Línea base</th>
              <th>Acum. venta completada</th><th>Acum. pronóstico</th><th>Acum. línea base</th>
            </tr>
          </thead>
          <tbody>
            {acc.map(({ r, f, accReal, accFc, accBase }) => (
              <tr key={r.block}>
                <td>{r.step}</td><td>{r.block}</td>
                <td>{fmtNumber(r.units_observed)}</td><td>{fmtNumber(r.units_completed)}</td><td>{fmtNumber(f)}</td><td>{fmtNumber(r.baseline)}</td>
                <td>{fmtNumber(accReal)}</td><td>{fmtNumber(accFc)}</td><td>{fmtNumber(accBase)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted">Unidades. El impacto en dinero existe solo para el año completo, no por bloque.</p>
      {step === n && (
        <div className="card section">
          <h2>Resultado del año · {SCENARIO_LABEL[scenario]}</h2>
          <div className="grid-2">
            <div>
              <div className="label">Ahorro frente a no hacer nada (z fijo)</div>
              <div>{imp.impact < 0 ? 'En este artículo ' : ''}<Saving value={imp.impact} /></div>
            </div>
            <div className="small">
              <div>Venta perdida: modelo <Money value={imp.lost_model} compact /> · línea base <Money value={imp.lost_naive} compact /></div>
              <div>Exceso: modelo <Money value={imp.excess_model} compact /> · línea base <Money value={imp.excess_naive} compact /></div>
            </div>
          </div>
          {segs.status === 'ready' && <ImpactContext impact={imp} concentration={segs.data.concentration[scenario]} scenario={scenario} />}
        </div>
      )}
    </>
  );
}
