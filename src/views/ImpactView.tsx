import { useState } from 'react';
import { ImpactCurve } from '../components/charts/ImpactCurve';
import { SegmentBars } from '../components/charts/SegmentBars';
import { HelpTip } from '../components/HelpTip';
import { ModuleHeader } from '../components/ModuleHeader';
import { Money } from '../components/Money';
import { Pill, SCENARIO_LABEL, ScenarioPills } from '../components/Pill';
import { Saving } from '../components/Saving';
import { LoadError, Loading } from '../components/StateViews';
import { closestServiceIndex, ZSelector } from '../components/ZSelector';
import { useData } from '../data';
import { fmtNumber, fmtPct, MONEY_LABEL } from '../format';
import { hashFor } from '../router';
import type { Items, Meta, Scenario, SegmentKey, Segments } from '../types';

const SEG_KEYS: SegmentKey[] = ['total', 'AX', 'AY', 'AZ'];

export function ImpactView({ scenario }: { scenario: Scenario }) {
  const meta = useData<Meta>('meta.json');
  const segs = useData<Segments>('segments.json');
  const items = useData<Items>('items.json');
  const [segKey, setSegKey] = useState<SegmentKey>('total');
  const [zi, setZi] = useState<number | null>(null);

  for (const s of [meta, segs, items]) if (s.status === 'error') return <LoadError error={s.error} />;
  if (meta.status !== 'ready' || segs.status !== 'ready' || items.status !== 'ready') return <Loading />;

  const m = meta.data;
  const h = m.headline[scenario];
  const seg = segs.data.segments;
  const modelCurve = seg[segKey].curves[scenario];
  const naiveCurve = seg[segKey].curves.naive;
  const idx = zi ?? closestServiceIndex(modelCurve, m.service.target);
  const pm = modelCurve[idx];
  const pn = naiveCurve[idx];
  const wr = m.wrmsse_units;
  // Proporción de dos cifras exportadas (sin recalcular el impacto): ahorro ÷ demanda del año de test
  const testDemand = m.total_demand_test;
  const pctOfDemand = (v: number) => (testDemand > 0 ? (v / testDemand) * 100 : null);
  const top = [...items.data.items].sort((a, b) => b.impact[scenario].impact - a.impact[scenario].impact).slice(0, 10);

  return (
    <>
      <ModuleHeader title="Impacto en dinero" subtitle={`Test · modelo frente a línea base (repetir el año anterior) · ${MONEY_LABEL}`}>
        <ScenarioPills scenario={scenario} />
      </ModuleHeader>

      <div className="cards">
        <div className="card">
          <div className="title">Exceso evitado</div>
          <div className="big-number accent"><Money value={h.saving_excess95} compact /></div>
          <div className="small muted">−{fmtPct(h.saving_excess95_pct, 0)} del exceso de la línea base · servicio 95 % · manifiesto</div>
          <div className="small demand-share">
            = {fmtPct(pctOfDemand(h.saving_excess95))} de la demanda del año de test <HelpTip id="demanda-test" scenario={scenario} />
          </div>
        </div>
        <div className="card">
          <div className="title">Venta recuperada</div>
          <div className="big-number"><Money value={h.recovered_sales_same_excess} compact /></div>
          <div className="small muted">con el mismo exceso · manifiesto</div>
          <div className="small demand-share">
            = {fmtPct(pctOfDemand(h.recovered_sales_same_excess))} de la demanda del año de test <HelpTip id="demanda-test" scenario={scenario} />
          </div>
        </div>
        <div className="card">
          <div className="title">WRMSSE en test · {SCENARIO_LABEL[scenario]}</div>
          <div className="big-number">{fmtNumber(scenario === 'A' ? wr.one_step : wr.chained, 3)}</div>
          <div className="small muted">
            A · a un paso {fmtNumber(wr.one_step, 3)} · B · encadenado {fmtNumber(wr.chained, 3)} · línea base{' '}
            {fmtNumber(wr.seasonal_naive, 3)} · manifiesto
          </div>
        </div>
        <div className="card">
          <div className="title">Artículos</div>
          <div className="big-number">{fmtNumber(seg.total.n_items)}</div>
          <div className="small muted">AX {fmtNumber(seg.AX.n_items)} · AY {fmtNumber(seg.AY.n_items)} · AZ {fmtNumber(seg.AZ.n_items)}</div>
          <div className="small demand-share">Demanda del año de test: <Money value={testDemand} compact /></div>
        </div>
      </div>

      <div className="grid-impact section">
        <div className="card">
          <div className="module-controls" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <h2>Exceso frente a venta perdida según el nivel de servicio</h2>
              <div className="small muted">Curvas por z · {SCENARIO_LABEL[scenario]} · {MONEY_LABEL}</div>
            </div>
            <div className="module-controls" role="group" aria-label="Segmento">
              {SEG_KEYS.map((k) => (
                <Pill key={k} small active={segKey === k} onClick={() => setSegKey(k)}>{k === 'total' ? 'Total' : k}</Pill>
              ))}
            </div>
          </div>
          <ImpactCurve model={modelCurve} naive={naiveCurve} index={idx} modelLabel={SCENARIO_LABEL[scenario]} />
          <ZSelector zValues={m.service.z_values} index={idx} onChange={setZi} curve={modelCurve} />
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div>
              <div className="label">Exceso en anaquel</div>
              <div>modelo <Money value={pm?.excess} compact /></div>
              <div className="muted">línea base <Money value={pn?.excess} compact /></div>
            </div>
            <div>
              <div className="label">Venta perdida</div>
              <div>modelo <Money value={pm?.lost} compact /></div>
              <div className="muted">línea base <Money value={pn?.lost} compact /></div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Exceso evitado por segmento ({MONEY_LABEL})</h2>
            <div className="small muted" style={{ marginBottom: 6 }}>Lectura de curvas al 95 % de servicio · {SCENARIO_LABEL[scenario]}</div>
            <SegmentBars segments={seg} scenario={scenario} />
          </div>
          <div className="card">
            <h2>Mayor contribución (z fijo)</h2>
            <div className="small muted" style={{ marginBottom: 6 }}>
              Suma por artículo con el z del 95 % del total; cifra distinta de la lectura de curvas · {SCENARIO_LABEL[scenario]}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Artículo</th><th>Seg.</th><th>Ahorro en exceso</th><th>Ahorro en venta perdida</th></tr></thead>
                <tbody>
                  {top.map((i) => (
                    <tr key={i.item_id}>
                      <td><a href={hashFor(`/articulo/${i.item_id}`, scenario)}>{i.item_id}</a></td>
                      <td>{i.cell}</td>
                      <td><Saving value={i.impact[scenario].impact_excess} compact /></td>
                      <td><Saving value={i.impact[scenario].impact_lost} compact /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
