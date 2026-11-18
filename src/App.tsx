import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { hashFor, useRoute } from './router';
import type { Scenario } from './types';
import { DataSourcesView } from './views/DataSourcesView';
import { GuideView } from './views/GuideView';
import { HomeView } from './views/HomeView';
import { ImpactView } from './views/ImpactView';
import { ItemDetailView } from './views/ItemDetailView';
import { ItemView } from './views/ItemView';
import { PlaygroundView } from './views/PlaygroundView';
import { SegmentationView } from './views/SegmentationView';
import { SegmentDetailView } from './views/SegmentDetailView';

/** La interfaz muestra solo el escenario A (spec 002, FR-002); `?esc=B` de enlaces antiguos se ignora. */
const SCENARIO: Scenario = 'A';

export function App() {
  const { route, params, forecastOnly } = useRoute();
  const scenario = SCENARIO;

  let view;
  switch (route) {
    case 'home': view = <HomeView />; break;
    case 'segmentation': view = <SegmentationView />; break;
    case 'segment': view = <SegmentDetailView cell={params.cell} />; break;
    case 'item': view = <ItemView itemId={params.itemId} forecastOnly={forecastOnly} />; break;
    case 'itemDetail': view = <ItemDetailView itemId={params.itemId} />; break;
    case 'playground': view = <PlaygroundView itemId={params.itemId} scenario={scenario} />; break;
    case 'impact': view = <ImpactView />; break;
    case 'guide': view = <GuideView term={params.term} />; break;
    case 'sources': view = <DataSourcesView />; break;
    default: view = <p>Página no disponible. <a href={hashFor('/', scenario)}>Ir al inicio</a></p>;
  }

  return (
    <div className="layout">
      <Sidebar route={route} scenario={scenario} itemId={params.itemId} />
      <div className="main-col">
        <Topbar />
        <main className={route === 'home' ? 'main home-main' : 'main'}>{view}</main>
      </div>
    </div>
  );
}
