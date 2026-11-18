// Inicio: solo bienvenida (spec 002, FR-010).
import { NeuralBackground } from '../components/NeuralBackground';
import { hashFor } from '../router';

export function HomeView() {
  return (
    <div className="home">
      <NeuralBackground />
      <div className="welcome">
        <span className="eyebrow">Demand Driven Replenishment</span>
        <h1>Reposición guiada<br />por la demanda</h1>
        <p>Walmart · 10 tiendas · 2011–2016</p>
        <a className="btn primary big" href={hashFor('/segmentacion', 'A')}>Explorar los segmentos <span aria-hidden="true">→</span></a>
      </div>
    </div>
  );
}
