import { useMemo, useState } from 'react';
import { ModuleHeader } from '../components/ModuleHeader';
import { Money } from '../components/Money';
import { SCENARIO_LABEL, ScenarioPills } from '../components/Pill';
import { Saving } from '../components/Saving';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtNumber, fmtPct, NOT_AVAILABLE } from '../format';
import { hashFor } from '../router';
import type { Item, Items, Scenario, SegmentKey, Segments } from '../types';

type SortKey = 'item_id' | 'spend_train' | 'cv_train' | 'rmsse' | 'saving';

export function SegmentDetailView({ cell, scenario }: { cell: string; scenario: Scenario }) {
  const segs = useData<Segments>('segments.json');
  const items = useData<Items>('items.json');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'spend_train', desc: true });

  const rows = useMemo(() => {
    if (items.status !== 'ready') return [];
    const list = items.data.items.filter((i) => cell === 'total' || i.cell === cell);
    const val = (i: Item): number | string => {
      switch (sort.key) {
        case 'item_id': return i.item_id;
        case 'spend_train': return i.spend_train;
        case 'cv_train': return i.cv_train ?? -Infinity;
        case 'rmsse': return i.metrics[scenario].rmsse_units ?? -Infinity;
        case 'saving': return i.impact[scenario].impact;
      }
    };
    return [...list].sort((a, b) => {
      const va = val(a), vb = val(b);
      const c = va < vb ? -1 : va > vb ? 1 : 0;
      return sort.desc ? -c : c;
    });
  }, [items, cell, sort, scenario]);

  if (!['AX', 'AY', 'AZ', 'total'].includes(cell)) {
    return (
      <>
        <ModuleHeader title={`Segmento ${cell}`} />
        <div className="note">
          Detalle {NOT_AVAILABLE}: solo AX, AY y AZ tienen pronóstico.{' '}
          <a href={hashFor('/segmentacion', scenario)}>← Volver a la matriz</a>
        </div>
      </>
    );
  }
  for (const s of [segs, items]) if (s.status === 'error') return <LoadError error={s.error} />;
  if (segs.status !== 'ready' || items.status !== 'ready') return <Loading />;

  const seg = segs.data.segments[cell as SegmentKey];
  const reading = seg.reading[scenario];
  const imp = seg.impact[scenario];
  const conc = segs.data.concentration[scenario];
  const title = cell === 'total' ? 'Total de los 517 artículos' : `Segmento ${cell}`;

  const header = (key: SortKey, label: string) => (
    <th className="sortable" onClick={() => setSort({ key, desc: sort.key === key ? !sort.desc : true })}>
      {label}{sort.key === key ? (sort.desc ? ' ▼' : ' ▲') : ''}
    </th>
  );

  return (
    <>
      <p className="small"><a href={hashFor('/segmentacion', scenario)}>← Segmentación</a></p>
      <ModuleHeader
        title={title}
        subtitle={<>{fmtNumber(seg.n_items)} artículos · gasto de train <Money value={seg.spend_train} compact /></>}
      >
        <ScenarioPills scenario={scenario} />
      </ModuleHeader>

      <div className="cards">
        <div className="card">
          <div className="title">Exceso evitado al 95 % (curvas) · {SCENARIO_LABEL[scenario]}</div>
          <div className="big"><Saving value={reading.saving_excess95} compact /></div>
          <div className="small muted">−{fmtPct(reading.saving_excess95_pct)} frente a la línea base</div>
        </div>
        <div className="card">
          <div className="title">Venta recuperada con el mismo exceso · {SCENARIO_LABEL[scenario]}</div>
          <div className="big"><Money value={reading.recovered_sales_same_excess} compact /></div>
        </div>
        <div className="card">
          <div className="title">Suma por artículo (z fijo) · {SCENARIO_LABEL[scenario]}</div>
          <div><Saving value={imp.impact} /></div>
          <div className="small muted">{fmtPct(imp.impact_pct_demand)} de la demanda del test</div>
        </div>
        {cell === 'total' && (
          <div className="card">
            <div className="title">Concentración · {SCENARIO_LABEL[scenario]}</div>
            <div className="small">
              {fmtNumber(conc.improve)} de {fmtNumber(conc.items)} artículos mejoran frente a la línea base;{' '}
              {fmtNumber(conc.worsen)} empeoran. {fmtNumber(conc.for_50pct)} explican la mitad del ahorro.
            </div>
          </div>
        )}
      </div>
      <p className="small muted">
        Las curvas por nivel de servicio están en <a href={hashFor('/impacto', scenario)}>Impacto</a>. La suma por artículo usa el z del 95 % del total y
        es una cifra distinta de la lectura de las curvas.
      </p>

      <div className="card section">
        <h2>Artículos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {header('item_id', 'Artículo')}
                <th>Segmento</th>
                {header('spend_train', 'Gasto de train')}
                {header('cv_train', 'CV de train')}
                {header('rmsse', `RMSSE · ${SCENARIO_LABEL[scenario]}`)}
                {header('saving', `Ahorro · ${SCENARIO_LABEL[scenario]} (z fijo)`)}
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.item_id}>
                  <td>
                    <a href={hashFor(`/articulo/${i.item_id}`, scenario)}>{i.item_id}</a>{' '}
                    {i.metrics[scenario].review && <span className="tag">revisar</span>}
                  </td>
                  <td>{i.cell}</td>
                  <td><Money value={i.spend_train} compact /></td>
                  <td>{fmtNumber(i.cv_train, 1)}</td>
                  <td>{fmtNumber(i.metrics[scenario].rmsse_units, 3)}</td>
                  <td><Saving value={i.impact[scenario].impact} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
