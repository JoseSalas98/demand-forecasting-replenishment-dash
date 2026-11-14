// Recorridos guiados: una pantalla esquemática del dashboard donde un cursor va a la zona de cada
// paso. Anterior / siguiente / reproducción automática, y "Ir ahí →" abre la pantalla real.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { hashFor } from '../router';
import type { Scenario } from '../types';

type Screen = 'seg' | 'item' | 'impact' | 'playground' | 'datos';

interface Step {
  screen: Screen;
  zone: string; // zona del esquema; 'nav' = el módulo en el panel lateral
  title: string;
  text: string;
}

export interface Tour {
  id: string;
  goal: string;
  href: string;
  steps: Step[];
}

/** Zonas de cada pantalla, en el orden y la disposición de la interfaz real. */
const LAYOUT: Record<Screen, { areas: string; columns: string; zones: Record<string, string> }> = {
  seg: {
    areas: '"head head head" "matrix radar profile" "compare compare compare" "funnel funnel funnel"',
    columns: '1fr 1.2fr 0.9fr',
    zones: { head: 'Encabezado', matrix: 'Matriz ABC × XYZ', radar: 'Radar', profile: 'Celda · variables ?', compare: 'Comparación AX · AY · AZ', funnel: 'Embudo y dinero en juego' },
  },
  item: {
    areas: '"head head" "units metrics" "units cv" "money hist" "detail detail"',
    columns: '2fr 1fr',
    zones: { head: 'Selector · Pronóstico', units: 'Unidades por bloque', metrics: 'Error en test', cv: 'CV', money: 'Dinero por bloque', hist: 'Distribución', detail: '¿Cuánto pido? · impacto' },
  },
  impact: {
    areas: '"head head" "cards cards" "curve bars" "curve top"',
    columns: '1.3fr 1fr',
    zones: { head: 'Escenario A / B', cards: 'Exceso evitado · venta recuperada · WRMSSE · artículos', curve: 'Curva + nivel de servicio', bars: 'Por segmento', top: 'Mayor contribución' },
  },
  playground: {
    areas: '"head" "controls" "chart" "table" "result"',
    columns: '1fr',
    zones: { head: 'Playground · escenario', controls: 'Reiniciar · anterior · siguiente', chart: 'Historia + test que se revela', table: 'Tabla acumulada', result: 'Resultado del año' },
  },
  datos: {
    areas: '"head head" "sources sources" "pending checks"',
    columns: '1fr 1fr',
    zones: { head: 'Origen de los datos', sources: 'Fuentes leídas', pending: 'Pendientes', checks: 'Verificaciones' },
  },
};

const NAV: { key: Screen | 'home' | 'guide'; label: string }[] = [
  { key: 'home', label: 'Inicio' },
  { key: 'seg', label: 'Segmentación' },
  { key: 'item', label: 'Artículo' },
  { key: 'impact', label: 'Impacto' },
  { key: 'guide', label: 'Cómo usar' },
];
const navKey = (s: Screen): string => (s === 'playground' ? 'item' : s);

export const TOURS: Tour[] = [
  {
    id: 'segmentos',
    goal: '¿Qué artículos me dan ingreso y cuáles estabilidad?',
    href: '/segmentacion',
    steps: [
      { screen: 'seg', zone: 'nav', title: 'Abre Segmentación', text: 'En el panel lateral, entra a Segmentación.' },
      { screen: 'seg', zone: 'matrix', title: 'Lee la matriz', text: 'Las filas A, B y C ordenan por ingreso (gasto de train); las columnas X, Y y Z, por estabilidad de la demanda. Cada celda muestra cuántos artículos tiene y su gasto. Haz clic en una celda para elegirla.' },
      { screen: 'seg', zone: 'radar', title: 'Compara con el catálogo', text: 'El radar dibuja la celda en 5 variables. 1,0 es la mediana del catálogo: más afuera, más alto que un artículo típico.' },
      { screen: 'seg', zone: 'profile', title: 'Mira los valores', text: 'La tarjeta de la celda lista cada variable. Pasa el cursor por una fila para ver el valor real y por el "?" para ver su definición y su unidad.' },
      { screen: 'seg', zone: 'compare', title: 'Compara AX, AY y AZ', text: 'Conteo, gasto, error del pronóstico y variabilidad de los 3 segmentos que tienen pronóstico.' },
      { screen: 'seg', zone: 'funnel', title: 'Del catálogo a lo pronosticado', text: 'El embudo muestra cómo se pasa de 30.490 series a 517 artículos pronosticados y cuánto dinero representan.' },
    ],
  },
  {
    id: 'historia',
    goal: '¿Cómo se ha comportado un artículo?',
    href: '/articulo',
    steps: [
      { screen: 'item', zone: 'nav', title: 'Abre Artículo', text: 'En el panel lateral, entra a Artículo.' },
      { screen: 'item', zone: 'head', title: 'Busca el artículo', text: 'Escribe parte del código (p. ej., FOODS_3) o despliega la lista. Con "Pronóstico" encendido ves los 517 pronosticados; apagado, los 3.049.' },
      { screen: 'item', zone: 'units', title: 'Unidades por bloque', text: 'La venta de cada bloque de 28 días desde el lanzamiento, con la media (gris) y las bandas ±3σ (punteadas). Un bloque fuera de las bandas es inusual.' },
      { screen: 'item', zone: 'money', title: 'La misma venta en dinero', text: 'Venta por bloque a precio de venta (no es margen).' },
      { screen: 'item', zone: 'cv', title: 'Qué tan variable es', text: 'El CV descriptivo resume la variabilidad de toda la historia: más alto, más errático.' },
      { screen: 'item', zone: 'hist', title: 'Distribución', text: 'En cuántos bloques vendió cada rango de unidades.' },
    ],
  },
  {
    id: 'pronostico',
    goal: '¿Cuánto pido de un artículo y qué tan bien se pronostica?',
    href: '/articulo/FOODS_3_655',
    steps: [
      { screen: 'item', zone: 'head', title: 'Elige uno de los 517', text: 'Con "Pronóstico" encendido, elige un artículo (p. ej., FOODS_3_655). Los artículos fuera de los 517 no tienen pronóstico.' },
      { screen: 'item', zone: 'units', title: 'El pronóstico sobre la serie', text: 'El tramo de test aparece sombreado: pronóstico del modelo (cian), línea base (ciruela) y venta completada (punteada).' },
      { screen: 'item', zone: 'metrics', title: 'El error', text: 'RMSSE de A y de B, y WAPE y MAE del escenario elegido con las píldoras A / B. Menor es mejor.' },
      { screen: 'item', zone: 'detail', title: '¿Cuánto pido?', text: 'La tabla da el pronóstico de cada bloque de test frente a la venta y la línea base; abajo, el impacto en dinero del artículo.' },
    ],
  },
  {
    id: 'impacto',
    goal: '¿Cuánto dinero se ahorra frente a no hacer nada?',
    href: '/impacto',
    steps: [
      { screen: 'impact', zone: 'nav', title: 'Abre Impacto', text: 'En el panel lateral, entra a Impacto.' },
      { screen: 'impact', zone: 'head', title: 'Elige el escenario', text: 'A · a un paso o B · encadenado. Todas las cifras cambian juntas; nunca se mezclan.' },
      { screen: 'impact', zone: 'cards', title: 'Las cifras clave', text: 'Exceso evitado y venta recuperada al 95 % de servicio, con su % de la demanda del año de test, el WRMSSE y los artículos.' },
      { screen: 'impact', zone: 'curve', title: 'Mueve el nivel de servicio', text: 'Elige Total o un segmento y mueve el deslizador: el punto marcado recorre las curvas de exceso frente a venta perdida del modelo y de la línea base.' },
      { screen: 'impact', zone: 'bars', title: 'Por segmento', text: 'Cuánto exceso evita cada segmento y cuánta venta recupera.' },
      { screen: 'impact', zone: 'top', title: 'Quién aporta más', text: 'Los 10 artículos con mayor ahorro (z fijo). Haz clic en uno para abrir su ficha.' },
    ],
  },
  {
    id: 'playground',
    goal: 'Quiero reproducir el año de test bloque a bloque',
    href: '/articulo/FOODS_3_655/playground',
    steps: [
      { screen: 'item', zone: 'detail', title: 'Desde la ficha', text: 'En la ficha de un artículo pronosticado, baja hasta "Reproducir el test bloque a bloque →".' },
      { screen: 'playground', zone: 'controls', title: 'Avanza', text: 'Usa "siguiente ▶" para avanzar un bloque o "Ver el año completo" para saltar al final.' },
      { screen: 'playground', zone: 'chart', title: 'Mira cómo se revela', text: 'La historia queda a la vista y el tramo de test se dibuja hasta el bloque del paso.' },
      { screen: 'playground', zone: 'table', title: 'Acumulados', text: 'La tabla suma bloque a bloque la venta, el pronóstico y la línea base.' },
      { screen: 'playground', zone: 'result', title: 'Resultado del año', text: 'Al llegar al último bloque, el ahorro en dinero del artículo y cómo leerlo.' },
    ],
  },
  {
    id: 'datos',
    goal: '¿De dónde salen las cifras?',
    href: '/datos',
    steps: [
      { screen: 'datos', zone: 'nav', title: 'Origen de los datos', text: 'Al pie del panel lateral, abre "Origen de los datos".' },
      { screen: 'datos', zone: 'sources', title: 'Fuentes', text: 'Cada archivo leído del proyecto de datos, con fecha y hash. El sitio no recalcula: solo muestra esas salidas.' },
      { screen: 'datos', zone: 'checks', title: 'Verificaciones', text: 'Las comprobaciones automáticas de la exportación (conteos, sumas y rangos).' },
    ],
  },
];

const AUTOPLAY_MS = 4500;

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function GuideWalkthrough({ tour, scenario }: { tour: Tour; scenario: Scenario }) {
  const [rawI, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [clicks, setClicks] = useState(0);
  const screenRef = useRef<HTMLDivElement>(null);
  const last = tour.steps.length - 1;
  // Nunca fuera de rango: si el recorrido cambia y tiene menos pasos, se queda en el último
  const i = Math.min(Math.max(rawI, 0), last);
  const step = tour.steps[i];
  const layout = LAYOUT[step.screen];

  const measure = useCallback(() => {
    const root = screenRef.current;
    const target = root?.querySelector<HTMLElement>(`[data-zone="${step.zone}"]`);
    if (!root || !target) return;
    const r = root.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    setCursor({ x: t.left - r.left + t.width / 2, y: t.top - r.top + t.height / 2 });
  }, [step.zone]);

  useLayoutEffect(() => {
    measure();
    setClicks((c) => c + 1);
  }, [measure, step.screen, i]);

  useEffect(() => {
    const root = screenRef.current;
    if (!root || typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => (i < last ? setI(i + 1) : setPlaying(false)), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [playing, i, last]);

  const go = (n: number) => {
    setPlaying(false);
    setI(Math.max(0, Math.min(last, n)));
  };
  const screenHref = step.screen === 'playground' ? '/articulo/FOODS_3_655/playground' : tour.href;

  return (
    <div className="tour">
      <div className={`tour-screen${reducedMotion() ? ' still' : ''}`} ref={screenRef} aria-hidden="true">
        <div className="tour-side">
          <div className="tour-logo">DDR</div>
          {NAV.map((n) => (
            <div
              key={n.key}
              className={`tour-nav${n.key === navKey(step.screen) ? ' current' : ''}`}
              data-zone={n.key === navKey(step.screen) && step.screen !== 'datos' ? 'nav' : undefined}
            >
              {n.label}
            </div>
          ))}
          <div className={`tour-nav foot${step.screen === 'datos' ? ' current' : ''}`} data-zone={step.screen === 'datos' ? 'nav' : undefined}>
            Origen de los datos
          </div>
        </div>
        <div className="tour-main" style={{ gridTemplateAreas: layout.areas, gridTemplateColumns: layout.columns }}>
          {Object.entries(layout.zones).map(([zone, label]) => (
            <div key={zone} data-zone={zone} className={`tour-zone${zone === step.zone ? ' target' : ''}`} style={{ gridArea: zone }}>
              {label}
            </div>
          ))}
        </div>
        {cursor && (
          <div className="tour-cursor" style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}>
            <span key={clicks} className="tour-ripple" />
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.5-6.8L4 20z" style={{ fill: 'currentColor', stroke: 'var(--bg)', strokeWidth: 1.2 }} />
            </svg>
          </div>
        )}
      </div>

      <div className="tour-panel">
        <ol className="tour-steps">
          {tour.steps.map((s, k) => (
            <li key={k}>
              <button type="button" className={k === i ? 'active' : k < i ? 'done' : ''} onClick={() => go(k)} aria-current={k === i ? 'step' : undefined}>
                <span className="tour-num">{k + 1}</span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="tour-text" aria-live="polite">
          <strong>Paso {i + 1} de {tour.steps.length} · {step.title}</strong>
          <p>{step.text}</p>
        </div>
        <div className="controls">
          <button type="button" className="btn" onClick={() => go(i - 1)} disabled={i === 0}>◀ anterior</button>
          <button type="button" className="btn" onClick={() => go(i + 1)} disabled={i === last}>siguiente ▶</button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (i === last) setI(0);
              setPlaying((p) => !p);
            }}
          >
            {playing ? '❚❚ pausa' : '▶ reproducir'}
          </button>
          <a className="pill active" href={hashFor(screenHref, scenario)}>Ir ahí →</a>
        </div>
      </div>
    </div>
  );
}
