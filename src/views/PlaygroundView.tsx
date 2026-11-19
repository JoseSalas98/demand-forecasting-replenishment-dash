import { useEffect, useMemo, useState } from 'react';
import { UnitsBandChart } from '../components/charts/UnitsBandChart';
import { ImpactContext } from '../components/ImpactContext';
import { ModuleHeader } from '../components/ModuleHeader';
import { Money } from '../components/Money';
import { Saving } from '../components/Saving';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtDate, fmtNumber } from '../format';
import { t } from '../i18n';
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
  const p = t().play;
  useEffect(() => setStep(1), [scenario, itemId]); // cambiar de artículo reinicia
  const startDates = useMemo(
    () => new Map(meta.status === 'ready' ? meta.data.blocks.map((b) => [b.block, b.start_date] as [number, string]) : []),
    [meta],
  );

  for (const st of [items, meta]) if (st.status === 'error') return <LoadError error={st.error} />;
  if (items.status !== 'ready' || meta.status !== 'ready') return <Loading />;
  if (!item) return <p>{p.notForecast(itemId)}</p>;
  for (const st of [series, descriptive]) if (st.status === 'error') return <LoadError error={st.error} />;
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
      <p><a className="btn small" href={hashFor(`/articulo/${item.item_id}/detalle`, scenario)}><span aria-hidden="true">←</span> {p.back(item.item_id)}</a></p>
      <ModuleHeader
        title={p.title(item.item_id)}
        subtitle={p.subtitle}
      />
      <div className="controls">
        <button className="btn" onClick={() => setStep(1)} disabled={step === 1}>{p.restart}</button>
        <button className="btn" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>{p.prev}</button>
        <button className="btn" onClick={() => setStep(Math.min(n, step + 1))} disabled={step === n}>{p.next}</button>
        <button className="btn" onClick={() => setStep(n)} disabled={step === n}>{p.full}</button>
        <strong>{p.step(String(step), String(n))}</strong>
        {current && <span className="muted">{p.current(String(current.block), fmtDate(startDates.get(current.block)))}</span>}
      </div>
      <div className="card">
        <UnitsBandChart
          data={descriptive.data}
          test={{ from: item.test_blocks[0], to: item.test_blocks[1], rows: series.data.rows, scenario, revealUpTo: current?.block }}
          startDates={startDates}
        />
        <p className="small muted">{p.chartNote}</p>
      </div>
      <div className="table-wrap section">
        <table>
          <thead>
            <tr>{p.cols.map((c) => <th key={c}>{c}</th>)}</tr>
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
      <p className="small muted">{p.unitsNote}</p>
      {step === n && (
        <div className="card section">
          <h2>{p.resultTitle}</h2>
          <div className="grid-2">
            <div>
              <div className="label">{p.savingLabel}</div>
              <div>{imp.impact < 0 ? p.inThisItem : ''}<Saving value={imp.impact} /></div>
            </div>
            <div className="small">
              <div>{p.lost}<Money value={imp.lost_model} />{p.baseline}<Money value={imp.lost_naive} /></div>
              <div>{p.excess}<Money value={imp.excess_model} />{p.baseline}<Money value={imp.excess_naive} /></div>
            </div>
          </div>
          {segs.status === 'ready' && <ImpactContext impact={imp} concentration={segs.data.concentration[scenario]} />}
        </div>
      )}
    </>
  );
}
