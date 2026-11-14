import { useEffect, useMemo, useState } from 'react';
import { GuideWalkthrough, TOURS } from '../components/GuideWalkthrough';
import { ModuleHeader } from '../components/ModuleHeader';
import { Money } from '../components/Money';
import { Pill } from '../components/Pill';
import { useData } from '../data';
import { fmtNumber } from '../format';
import { GLOSSARY, GLOSSARY_GROUPS } from '../glossary';
import { hashFor } from '../router';
import type { Meta, Scenario } from '../types';

const MODULES: { name: string; path: string; answers: string; how: string[] }[] = [
  {
    name: 'Inicio',
    path: '/',
    answers: 'De qué se trata: cuántos artículos se analizan, cuántos tienen pronóstico y el exceso de inventario que evita el modelo.',
    how: ['Lee las tres cifras.', 'Pulsa "Explorar →" para pasar a Segmentación.'],
  },
  {
    name: 'Segmentación',
    path: '/segmentacion',
    answers: '¿Qué artículos me dan ingreso y cuáles me dan estabilidad? ¿Cómo se llega a los 517 pronosticados?',
    how: [
      'Haz clic en una celda de la matriz ABC × XYZ.',
      'Lee su perfil en el radar y en la tarjeta de la celda (cursor sobre una fila = valor real; "?" = definición).',
      'En AX, AY o AZ, "Ver artículos →" abre la lista ordenable del segmento.',
      'Más abajo: la comparación de AX, AY y AZ, y el embudo con el dinero en juego.',
    ],
  },
  {
    name: 'Artículo',
    path: '/articulo',
    answers: '¿Cómo se ha comportado este artículo? Y, si es de los 517, ¿cuánto pido y qué tan bien se pronostica?',
    how: [
      'Busca el artículo; la píldora "Pronóstico" alterna entre los 517 y los 3.049.',
      'Lee la venta en unidades (con media y bandas ±3σ) y en dinero, el CV descriptivo y la distribución.',
      'Si tiene pronóstico: el tramo de test sobre la misma gráfica, el error (A / B), "¿Cuánto pido?", el impacto y el playground.',
    ],
  },
  {
    name: 'Impacto',
    path: '/impacto',
    answers: '¿Cuánto me cuesta equivocarme? Venta perdida y exceso en anaquel del modelo frente a repetir el año anterior.',
    how: [
      'Elige el escenario A o B.',
      'Elige Total o un segmento y mueve el nivel de servicio en la curva.',
      'Revisa el aporte por segmento y los 10 artículos que más ahorran.',
    ],
  },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function GuideView({ scenario, section, term }: { scenario: Scenario; section?: string; term?: string }) {
  const meta = useData<Meta>('meta.json');
  const [tourId, setTourId] = useState(TOURS[0].id);
  const [q, setQ] = useState('');
  const tour = TOURS.find((t) => t.id === tourId) ?? TOURS[0];

  useEffect(() => {
    if (term) scrollToId(`term-${term}`);
    else if (section === 'glosario') scrollToId('glosario');
  }, [section, term]);

  const entries = useMemo(() => {
    const query = q.trim().toLowerCase();
    return query ? GLOSSARY.filter((g) => `${g.term} ${g.definition} ${g.unit ?? ''}`.toLowerCase().includes(query)) : GLOSSARY;
  }, [q]);

  const m = meta.status === 'ready' ? meta.data : null;

  return (
    <>
      <ModuleHeader title="Cómo usar el dashboard" subtitle="Objetivo del proyecto, qué responde cada módulo, recorridos guiados y glosario">
        <a className="pill" href="#/guia/glosario" onClick={(e) => { e.preventDefault(); scrollToId('glosario'); }}>Glosario</a>
      </ModuleHeader>

      <section className="card">
        <h2>¿Qué quieres ver?</h2>
        <p className="muted small">Elige una pregunta: el recorrido muestra, paso a paso, dónde hacer clic. "Ir ahí →" abre la pantalla real.</p>
        <div className="module-controls" role="group" aria-label="Recorridos" style={{ margin: '10px 0 16px' }}>
          {TOURS.map((t) => (
            <Pill key={t.id} small active={t.id === tour.id} onClick={() => setTourId(t.id)}>{t.goal}</Pill>
          ))}
        </div>
        {/* key: cada recorrido arranca en su paso 1 con estado propio */}
        <GuideWalkthrough key={tour.id} tour={tour} scenario={scenario} />
      </section>

      <div className="grid-2 section">
        <section className="card">
          <h2>Objetivo del proyecto</h2>
          <p>
            Que la gerencia regional y la de operaciones vean cuánto habría que reponer de cada artículo por bloque de 28 días y cuánto
            cuesta en dinero equivocarse. Se compara un modelo de pronóstico (CatBoost global) con no hacer nada (repetir la venta del
            año anterior) en el último año de datos, que el modelo no vio (test).
          </p>
          <p className="muted small">El dashboard no recalcula nada: muestra las salidas guardadas del proyecto de ciencia de datos.</p>
        </section>
        <section className="card">
          <h2>Datos y alcance</h2>
          <ul className="guide-list">
            <li>M5 Walmart: 10 tiendas, ventas sumadas por artículo{m ? `, del ${m.period.start} al ${m.period.end}` : ''}.</li>
            <li>Bloques de 28 días; el test son los últimos 13.</li>
            <li>3.049 artículos con historia; 517 (AX, AY, AZ) con pronóstico, error e impacto.</li>
            <li>Dos escenarios que nunca se mezclan: A · a un paso y B · encadenado.</li>
            <li>
              Demanda de los 517 en el año de test: {m ? <Money value={m.total_demand_test} compact /> : '…'}. Todo valor en dinero está a precio de
              venta, no es margen.
            </li>
            <li>No incluye: tiendas o regiones por separado, pronóstico después del último día de datos, ni reentrenar el modelo.</li>
          </ul>
        </section>
      </div>

      <section className="section">
        <h2>Los módulos</h2>
        <div className="cards" style={{ marginTop: 10 }}>
          {MODULES.map((mod) => (
            <div key={mod.name} className="card">
              <h2>{mod.name}</h2>
              <p className="small"><strong>Responde:</strong> {mod.answers}</p>
              <ol className="guide-list small">
                {mod.how.map((h) => <li key={h}>{h}</li>)}
              </ol>
              <a href={hashFor(mod.path, scenario)}>Abrir {mod.name} →</a>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Al pie del panel lateral, "Origen de los datos" lista cada archivo leído, su fecha y las verificaciones de las cifras.
        </p>
      </section>

      <section className="card section" id="glosario">
        <div className="module-controls" style={{ justifyContent: 'space-between' }}>
          <h2>Glosario</h2>
          <input
            className="guide-search"
            type="search"
            placeholder="Buscar término…"
            aria-label="Buscar en el glosario"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {entries.length === 0 && <p className="muted">“{q.trim()}” no aparece en el glosario.</p>}
        {GLOSSARY_GROUPS.map((group) => {
          const list = entries.filter((g) => g.group === group);
          if (list.length === 0) return null;
          return (
            <div key={group} className="glossary-group">
              <h3>{group}</h3>
              <dl>
                {list.map((g) => (
                  <div key={g.id} id={`term-${g.id}`} className={`glossary-entry${g.id === term ? ' highlight' : ''}`}>
                    <dt>{g.term}</dt>
                    <dd>
                      {g.definition}
                      {g.unit && <span className="help-unit"> Unidad: {g.unit}.</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
        <p className="small muted">{fmtNumber(GLOSSARY.length)} términos.</p>
      </section>
    </>
  );
}
