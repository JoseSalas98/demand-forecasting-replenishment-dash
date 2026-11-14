import { Money } from '../components/Money';
import { NeuralBackground } from '../components/NeuralBackground';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtNumber } from '../format';
import { hashFor } from '../router';
import type { Catalog, Meta, Scenario } from '../types';

function year(d: string): string {
  return d.slice(0, 4);
}

export function HomeView({ scenario }: { scenario: Scenario }) {
  const meta = useData<Meta>('meta.json');
  const catalog = useData<Catalog>('catalog.json');

  let body;
  if (meta.status === 'error') body = <LoadError error={meta.error} />;
  else if (catalog.status === 'error') body = <LoadError error={catalog.error} />;
  else if (meta.status !== 'ready' || catalog.status !== 'ready') body = <Loading />;
  else {
    const m = meta.data;
    const items = catalog.data.items;
    const forecasted = items.filter((i) => i.forecasted).length;
    body = (
      <>
        <h1>Demand Driven Replenishment</h1>
        <div className="subtitle">
          Reposición guiada por la demanda · M5 Walmart · 10 tiendas · {year(m.period.start)}–{year(m.period.end)}
        </div>
        <div className="home-stats">
          <div>
            <div className="big-number">{fmtNumber(items.length)}</div>
            <div className="label">artículos analizados</div>
          </div>
          <div>
            <div className="big-number">{fmtNumber(forecasted)}</div>
            <div className="label">con pronóstico</div>
          </div>
          <div>
            <div className="big-number accent">
              <Money value={m.headline.A.saving_excess95} compact />*
            </div>
            <div className="label">exceso evitado</div>
          </div>
        </div>
        <a className="home-cta" href={hashFor('/segmentacion', scenario)}>Explorar →</a>
      </>
    );
  }

  return (
    <div className="home">
      <NeuralBackground />
      <div>
        <div className="home-veil">{body}</div>
        <p className="home-note">* Manifiesto de impacto: escenario A, 95 % de servicio, a precio de venta (no es margen)</p>
      </div>
    </div>
  );
}
