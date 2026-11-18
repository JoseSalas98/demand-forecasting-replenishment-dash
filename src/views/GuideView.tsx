// Cómo usar (spec 002, US4): para qué sirve el tablero, para qué sirve cada sección y glosario en tabla.
import { useEffect, useState } from 'react';
import { ModuleHeader } from '../components/ModuleHeader';
import { GLOSSARY, GLOSSARY_BY_ID, GLOSSARY_GROUPS } from '../glossary';
import { hashFor } from '../router';

const MODULES: { title: string; icon: string; path: string; purpose: string; steps: string[] }[] = [
  {
    title: 'Inicio', icon: '⌂', path: '/',
    purpose: 'Es la puerta de entrada. Presenta el proyecto y lleva a Segmentos.',
    steps: ['Pulsa "Explorar los segmentos" para empezar el recorrido.', 'El menú de la izquierda lleva a cualquier sección en cualquier momento.', '"Origen de los datos", al pie del menú, lista los archivos leídos y las verificaciones de las cifras.'],
  },
  {
    title: 'Segmentos', icon: '▦', path: '/segmentacion',
    purpose: 'Muestra cómo se reparte el catálogo. Responde qué artículos pesan más en la venta, cuáles venden de forma más pareja y cuáles se pronostican.',
    steps: ['Pasa el cursor sobre una familia o una burbuja para leer qué significa.', 'Haz clic en una burbuja: a la derecha aparecen su descripción, el radar y las barras frente al artículo típico.', 'Cambia el tamaño entre venta y número de artículos para ver que pocos artículos hacen la mayor parte de la venta.', 'El botón ⓘ abre los errores del pronóstico por grupo y la lista de sus artículos.'],
  },
  {
    title: 'Artículo', icon: '∿', path: '/articulo',
    purpose: 'Mira un artículo concreto: cómo se ha vendido, qué tan bien se pronosticó y cuánto ahorra frente a la línea base.',
    steps: ['Busca el artículo por su código o elígelo de la lista.', 'Pasa el cursor por la gráfica para ver la fecha y las unidades de cada línea.', 'Usa "Año de prueba" para acercarte al año en que se comparan el pronóstico y la línea base.', 'El botón ⓘ abre el cálculo del ahorro, el error y la tabla por periodo, que se puede exportar.'],
  },
  {
    title: 'Impacto', icon: '$', path: '/impacto',
    purpose: 'Traduce el pronóstico a dinero. Muestra cuánto capital se libera y cuántas ventas se recuperan frente a la línea base.',
    steps: ['Mueve el control para elegir qué porcentaje de la demanda quieres atender.', 'Lee las dos maneras de aprovechar el pronóstico: liberar capital o recuperar ventas.', 'Mira en qué grupos está el ahorro y cuáles son los 10 artículos que más ahorran.', '"Ver detalle del cálculo" despliega la curva debajo, sin salir de la página.'],
  },
];

export function GuideView({ term }: { term?: string }) {
  const [q, setQ] = useState(() => (term && GLOSSARY_BY_ID[term] ? GLOSSARY_BY_ID[term].term : ''));
  // Un enlace a un término (#/guia/glosario/:term) lleva directo al glosario
  useEffect(() => {
    if (term) document.getElementById('glosario')?.scrollIntoView?.();
  }, [term]);
  const query = q.trim().toLowerCase();
  const match = (g: (typeof GLOSSARY)[number]) => !query || `${g.term} ${g.definition} ${g.technical}`.toLowerCase().includes(query);
  const groups = GLOSSARY_GROUPS.map((grp) => ({ grp, rows: GLOSSARY.filter((g) => g.group === grp && match(g)) })).filter((x) => x.rows.length);

  return (
    <>
      <ModuleHeader title="Cómo usar el tablero" subtitle="Para qué sirve cada sección y qué significa cada término" />
      <div className="card">
        <h2>¿Para qué sirve este tablero?</h2>
        <p className="prose">
          Ayuda a decidir <b>cuánto reponer de cada artículo cada 4 semanas</b> y a ver <b>cuánto cuesta equivocarse</b>. Compara dos maneras de
          pedir: el <b>pronóstico</b>, un modelo que aprende de la historia de ventas, y la <b>línea base</b>, que repite lo vendido en el mismo
          periodo del año anterior. Las dos se ponen a prueba en el último año de datos, que el pronóstico no vio.
        </p>
        <div className="strip">
          <span><b>10</b> tiendas de Walmart</span>
          <span><b>2011–2016</b> de historia</span>
          <span><b>3.049</b> artículos en el catálogo</span>
          <span><b className="accent">517</b> con pronóstico</span>
        </div>
        <p className="small muted">El tablero no recalcula nada: muestra los resultados guardados del proyecto de datos. Todo valor en dinero está a precio de venta, así que no es ganancia.</p>
      </div>

      <div className="grid-2 section">
        {MODULES.map((m) => (
          <div key={m.title} className="card mod">
            <div className="card-head">
              <h2><span aria-hidden="true">{m.icon}</span> {m.title}</h2>
              <a className="btn small" href={hashFor(m.path, 'A')}>Ir a {m.title} <span aria-hidden="true">→</span></a>
            </div>
            <p><b>Para qué sirve:</b> {m.purpose}</p>
            <ul className="steps">{m.steps.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        ))}
      </div>

      <div className="card section" id="glosario">
        <div className="card-head">
          <h2>Glosario</h2>
          <input className="glo-search" placeholder="Buscar un término" aria-label="Buscar en el glosario" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {groups.length === 0 ? (
          <p className="small muted">No hay términos con esa palabra. Prueba con otra, por ejemplo "sobrante" o "vitales".</p>
        ) : (
          <div className="table-wrap">
            <table className="glo-tbl">
              <colgroup><col style={{ width: '22%' }} /><col /><col style={{ width: '22%' }} /></colgroup>
              <thead><tr><th className="left">Término</th><th className="left">Qué significa</th><th className="left">Nombre técnico</th></tr></thead>
              <tbody>
                {groups.flatMap(({ grp, rows }) => [
                  <tr key={grp} className="glo-grp"><th colSpan={3} className="left">{grp}</th></tr>,
                  ...rows.map((g) => (
                    <tr key={g.id} id={`term-${g.id}`}>
                      <td className="left glo-t">{g.term}</td>
                      <td className="left">{g.definition}{g.unit && <span className="muted"> Unidad: {g.unit}.</span>}</td>
                      <td className="left glo-tec">{g.technical}</td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
