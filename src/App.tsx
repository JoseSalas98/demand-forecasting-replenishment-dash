import { Sidebar } from './components/Sidebar';
import { hashFor, useRoute } from './router';
import { DataSourcesView } from './views/DataSourcesView';
import { GuideView } from './views/GuideView';
import { HomeView } from './views/HomeView';
import { ImpactView } from './views/ImpactView';
import { ItemView } from './views/ItemView';
import { PlaygroundView } from './views/PlaygroundView';
import { SegmentationView } from './views/SegmentationView';
import { SegmentDetailView } from './views/SegmentDetailView';

export function App() {
  const { route, params, scenario, forecastOnly } = useRoute();

  let view;
  switch (route) {
    case 'home': view = <HomeView scenario={scenario} />; break;
    case 'segmentation': view = <SegmentationView scenario={scenario} />; break;
    case 'segment': view = <SegmentDetailView cell={params.cell} scenario={scenario} />; break;
    case 'item': view = <ItemView itemId={params.itemId} scenario={scenario} forecastOnly={forecastOnly} />; break;
    case 'playground': view = <PlaygroundView itemId={params.itemId} scenario={scenario} />; break;
    case 'impact': view = <ImpactView scenario={scenario} />; break;
    case 'guide': view = <GuideView scenario={scenario} section={params.section} term={params.term} />; break;
    case 'sources': view = <DataSourcesView />; break;
    default: view = <p>Página no disponible. <a href={hashFor('/', scenario)}>Ir al inicio</a></p>;
  }

  return (
    <div className="layout">
      <Sidebar route={route} scenario={scenario} itemId={params.itemId} />
      <main className={route === 'home' ? 'main home-main' : 'main'}>{view}</main>
    </div>
  );
}
