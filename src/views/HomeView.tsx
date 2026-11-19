// Inicio: bienvenida y elección de idioma (specs 002 FR-010 y 003).
import { LangToggle } from '../components/LangToggle';
import { NeuralBackground } from '../components/NeuralBackground';
import { t } from '../i18n';
import { hashFor } from '../router';

export function HomeView() {
  const h = t().home;
  return (
    <div className="home">
      <NeuralBackground />
      <div className="welcome">
        <span className="eyebrow">{h.eyebrow}</span>
        <h1>{h.title[0]}<br />{h.title[1]}</h1>
        <p>{h.subtitle}</p>
        <a className="btn primary big" href={hashFor('/segmentacion', 'A')}>{h.cta} <span aria-hidden="true">→</span></a>
        <div className="home-lang">
          <span className="small muted">{h.chooseLang}</span>
          <LangToggle big />
        </div>
      </div>
    </div>
  );
}
