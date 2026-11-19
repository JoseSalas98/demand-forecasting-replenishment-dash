// @vitest-environment jsdom
// Prueba de humo (specs 002 y 003): cada vista se renderiza con los JSON reales de public/data, sin
// errores, con la etiqueta global de dinero, en lenguaje de gerencia, sin mencionar el método del
// pronóstico, y en los dos idiomas.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { glossaryEntry } from '../src/glossary';
import { setLang } from '../src/i18n';
import { legacyRedirect, parseHash } from '../src/router';

const DATA = join(__dirname, '..', 'public', 'data');
const hasData = existsSync(join(DATA, 'meta.json'));

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  // Recharts usa ResizeObserver; jsdom no lo trae
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.scrollTo = () => {};
  // NeuralBackground: jsdom no trae canvas ni matchMedia
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  vi.stubGlobal('fetch', async (url: string) => {
    const rel = String(url).split('data/')[1];
    const path = join(DATA, rel);
    if (!existsSync(path)) return { ok: false, status: 404, json: async () => ({}) };
    const body = JSON.parse(readFileSync(path, 'utf-8'));
    return { ok: true, status: 200, json: async () => body };
  });
});

afterEach(() => {
  document.body.innerHTML = '';
  window.localStorage.clear();
  setLang('es', false);
});

/** Renderiza la ruta; `inspect` recibe el DOM antes de desmontar. */
async function render(hash: string, inspect?: (el: HTMLElement) => void): Promise<string> {
  window.location.hash = hash;
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => {
    root.render(<App />);
  });
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
  }
  const text = el.textContent ?? '';
  inspect?.(el);
  root.unmount();
  return text;
}

describe('rutas', () => {
  it('#/segmentos redirige a #/segmentacion conservando la celda y la consulta', () => {
    expect(legacyRedirect('#/segmentos')).toBe('#/segmentacion');
    expect(legacyRedirect('#/segmentos/AX?esc=B')).toBe('#/segmentacion/AX?esc=B');
    expect(legacyRedirect('#/segmentacion')).toBeNull();
  });

  it('detalle del artículo: #/articulo/:id/detalle', () => {
    expect(parseHash('#/articulo/FOODS_1_004/detalle')).toMatchObject({ route: 'itemDetail', params: { itemId: 'FOODS_1_004' } });
  });

  it('guía: #/guia, #/guia/glosario y #/guia/glosario/:term', () => {
    expect(parseHash('#/guia').route).toBe('guide');
    expect(parseHash('#/guia/glosario').params.section).toBe('glosario');
    expect(parseHash('#/guia/glosario/cv?esc=B')).toMatchObject({ route: 'guide', params: { section: 'glosario', term: 'cv' }, scenario: 'B' });
    expect(parseHash('#/guia/otra').route).toBe('notFound');
  });
});

describe.skipIf(!hasData)('vistas con datos reales', () => {
  // Nada del método ni de escenarios llega a la pantalla (FR-002)
  const clean = (t: string) => {
    expect(t).not.toMatch(/a un paso|encadenado|escenario|impacto negativo/i);
    expect(t).toContain('Cifras a precio de venta · no es margen');
  };

  it('inicio: solo bienvenida y botón a Segmentos', async () => {
    const t = await render('#/');
    clean(t);
    expect(t).toContain('Reposición guiada');
    expect(t).toContain('Walmart · 10 tiendas · 2011–2016');
    expect(t).toContain('Explorar los segmentos');
  });

  it('segmentos: burbujas con nombres, panel del grupo y embudo con cifras', async () => {
    const t = await render('#/segmentacion', (el) => {
      expect(el.querySelectorAll('.bub')).toHaveLength(9);
      expect(el.querySelectorAll('.halo')).toHaveLength(3);
    });
    clean(t);
    for (const s of ['Vitales', 'Útiles', 'Complementarios', 'continuos', 'recurrentes', 'ocasionales']) expect(t).toContain(s);
    expect(t).toContain('Vitales continuos');
    expect(t).toContain('Con pronóstico: 191 de 207');
    expect(t).toContain('162 artículos sin clase de regularidad');
    for (const n of ['30.490', '3.049', '592', '517', '52 %', '21,86 M US$', '75']) expect(t).toContain(n);
  });

  it('segmentos: clic en una burbuja cambia el panel', async () => {
    await render('#/segmentacion', (el) => {
      const az = [...el.querySelectorAll<SVGGElement>('.bub')].find((b) => b.getAttribute('aria-label')?.startsWith('Vitales ocasionales'));
      act(() => az!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      expect(el.querySelector('.panel h2')?.textContent).toContain('Vitales ocasionales');
    });
  });

  it('segmentos: ayuda "?" en cada barra con definición y valor en unidades', async () => {
    const seg = JSON.parse(readFileSync(join(DATA, 'segmentation.json'), 'utf-8'));
    for (const axis of seg.radar.axes) expect(glossaryEntry(axis)?.unit).toBeTruthy();
    await render('#/segmentacion', (el) => {
      const buttons = [...el.querySelectorAll<HTMLButtonElement>('.hbars .help-btn')];
      expect(buttons).toHaveLength(seg.radar.axes.length);
      act(() => buttons[4].click());
      const pop = el.querySelector('.help-pop')?.textContent ?? '';
      expect(pop).toContain('Unidades por día');
      expect(pop).toContain('u. por día');
    });
  });

  it('#/segmentos redirige', async () => {
    expect(await render('#/segmentos')).toContain('Segmentos del catálogo');
  });

  it('detalle de los grupos con pronóstico', async () => {
    const t = await render('#/segmentacion/AX');
    clean(t);
    expect(t).toContain('Comparación de los tres grupos');
    for (const s of ['191', '229', '97', '517', '0,495', '0,868']) expect(t).toContain(s);
    expect(t).toContain('Artículos de Vitales continuos · 191');
    expect(await render('#/segmentacion/total')).toContain('Detalle no disponible');
  });

  it('artículo sin id: estado vacío con el buscador destacado', async () => {
    const t = await render('#/articulo', (el) => {
      expect(el.querySelector('.combo.combo-lg')).not.toBeNull();
      expect(el.querySelector('.combo-toggle')).not.toBeNull();
      expect(el.querySelector('.article-chart')).toBeNull();
    });
    expect(t).toContain('Elige un artículo');
    expect(t).not.toContain('FOODS_3_090');
  });

  it('FOODS_1_004: frase de acierto, gráfica con pronóstico y línea base, ahorro', async () => {
    const t = await render('#/articulo/FOODS_1_004', (el) => {
      expect([...el.querySelectorAll('.lg')].map((c) => c.textContent)).toContain('Línea base');
    });
    clean(t);
    expect(t).toContain('acertó 86 de cada 100 unidades');
    expect(t).toContain('Detalle del pronóstico');
    expect(t).toContain('habría ahorrado 12 mil US$');
    expect(t).toContain('ahorro neto en el año');
  });

  it('FOODS_1_004 detalle: cálculo del ahorro, WAPE de la línea base derivado y z fijo', async () => {
    const t = await render('#/articulo/FOODS_1_004/detalle');
    clean(t);
    expect(t).toContain('periodos 53–65');
    expect(t).toContain('11.559 US$');
    expect(t).toContain('−0,01');
    expect(t).toContain('17,9 % *');
    expect(t).toContain('calculado en el sitio');
    expect(t).toContain('Exportar CSV');
  });

  it('artículo que cuesta más con el pronóstico', async () => {
    const t = await render('#/articulo/FOODS_1_012');
    expect(t).toMatch(/habría costado .+ más que la línea base/);
    expect(t).toContain('costo adicional neto');
    expect(await render('#/articulo/FOODS_1_012/detalle')).toContain('490 de 517 artículos ahorran');
  });

  it('HOUSEHOLD_1_366: año de prueba 51–63', async () => {
    expect(await render('#/articulo/HOUSEHOLD_1_366/detalle')).toContain('periodos 51–63');
  });

  it('artículo fuera de los 517: historia sin pronóstico', async () => {
    const t = await render('#/articulo/FOODS_1_001?pron=0');
    expect(t).toContain('Este artículo no entró al pronóstico');
    expect(t).toContain('Ver el embudo');
    expect(t).not.toContain('Detalle del pronóstico');
  });

  it('artículo fuera del catálogo', async () => {
    expect(await render('#/articulo/NO_EXISTE_1')).toContain('no está en el catálogo de 3.049');
  });

  it('año de prueba paso a paso', async () => {
    const t = await render('#/articulo/FOODS_1_004/playground');
    clean(t);
    expect(t).toContain('Paso 1 de 13');
    expect(t).toContain('Lo que se vendió');
    expect(t).toContain('Venta sin faltantes');
  });

  it('impacto al 95 %: cifras oficiales en las dos palancas y reparto por grupo', async () => {
    const t = await render('#/impacto');
    clean(t);
    for (const s of ['Liberar capital', 'Recuperar ventas', '3,28 M US$', '0,91 M US$', '0,55 M US$', '1,33 M US$', '1,40 M US$', '490', '27']) expect(t).toContain(s);
    expect(t).toContain('Los 10 artículos que más ahorran');
  });

  it('impacto: el detalle se despliega en la misma tarjeta', async () => {
    await render('#/impacto', (el) => {
      const btn = [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes('Ver detalle del cálculo'));
      act(() => btn!.click());
      const d = el.querySelector('#imp-detail')?.textContent ?? '';
      expect(d).toContain('0,495');
      expect(d).toContain('0,868');
      expect(d).toContain('3,45 M US$');
    });
  });

  it('cómo usar: para qué sirve cada sección y glosario en tabla', async () => {
    const t = await render('#/guia', (el) => {
      expect(el.querySelectorAll('.mod')).toHaveLength(4);
      expect(el.querySelector('.glo-tbl')).not.toBeNull();
    });
    clean(t);
    for (const s of ['¿Para qué sirve este tablero?', 'Para qué sirve:', 'Glosario', 'Mercancía sobrante', 'Vitales', 'WAPE']) expect(t).toContain(s);
    expect(await render('#/guia/glosario/velocity')).toContain('Lo que vende el artículo en un día típico');
  });

  it('origen de los datos con pendientes', async () => {
    const t = await render('#/datos');
    expect(t).toContain('impact_sum_matches_total_A');
    expect(t).toContain('Pendientes');
    expect(t).toContain('ninguno');
  });
});

describe.skipIf(!hasData)('versión en inglés (spec 003)', () => {
  // Palabras de la interfaz en español que no deben quedar en inglés
  const SPANISH = /\b(artículos?|pronóstico|línea base|sobrante|ventas?|periodos?|año de prueba|cifras|ahorro|grupo|tiendas|catálogo|detalle)\b/i;
  const english = (t: string) => {
    expect(t).not.toMatch(SPANISH);
    expect(t).toContain('Figures at retail price · not margin');
  };

  it('el botón EN de Inicio cambia todo a inglés y lo recuerda', async () => {
    await render('#/', (el) => {
      const en = [...el.querySelectorAll<HTMLButtonElement>('.home-lang .lang-btn')].find((b) => b.textContent === 'English');
      act(() => en!.click());
      expect(el.textContent).toContain('Explore the segments');
      expect(el.textContent).toContain('Figures at retail price · not margin');
      expect(document.documentElement.lang).toBe('en');
    });
    expect(window.localStorage.getItem('ddr-lang')).toBe('en');
    expect(await render('#/')).toContain('Explore the segments');
  });

  it('?lang=en abre en inglés: inicio', async () => {
    const t = await render('#/?lang=en');
    english(t);
    expect(t).toContain('Demand-driven');
    expect(t).toContain('Walmart · 10 stores · 2011–2016');
  });

  it('segmentos en inglés con formato de EE. UU.', async () => {
    const t = await render('#/segmentacion?lang=en');
    english(t);
    for (const s of ['Vital', 'Useful', 'Complementary', 'continuous', 'recurring', 'occasional', 'Continuous vitals']) expect(t).toContain(s);
    expect(t).toContain('With a forecast: 191 of 207');
    expect(t).toContain('162 products without a regularity class');
    for (const n of ['30,490', '3,049', '592', '517', '52%', 'US$21.86M', '75']) expect(t).toContain(n);
  });

  it('detalle de los grupos en inglés', async () => {
    const t = await render('#/segmentacion/AX?lang=en');
    english(t);
    expect(t).toContain('The three groups side by side');
    for (const s of ['0.495', '0.868', 'Products in Continuous vitals · 191']) expect(t).toContain(s);
  });

  it('artículo sin elegir y ficha en inglés', async () => {
    english(await render('#/articulo?lang=en'));
    expect(await render('#/articulo?lang=en')).toContain('Choose a product');
    const t = await render('#/articulo/FOODS_1_004?lang=en');
    english(t);
    expect(t).toContain('got 86 out of every 100 units right');
    expect(t).toContain('would have saved US$12K');
    expect(t).toContain('net savings over the year');
  });

  it('detalle del pronóstico en inglés', async () => {
    const t = await render('#/articulo/FOODS_1_004/detalle?lang=en');
    english(t);
    for (const s of ['periods 53–65', 'US$11,559', '17.9% *', 'calculated on the site', 'Export CSV']) expect(t).toContain(s);
  });

  it('impacto en inglés al 95 %', async () => {
    const t = await render('#/impacto?lang=en', (el) => {
      const btn = [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes('See how it is calculated'));
      act(() => btn!.click());
      expect(el.querySelector('#imp-detail')?.textContent).toContain('US$3.45M');
    });
    english(t);
    for (const s of ['Free up capital', 'Recover sales', 'US$3.28M', 'US$0.91M', 'US$0.55M', 'US$1.33M', 'US$1.40M', 'The 10 products that save the most']) expect(t).toContain(s);
  });

  it('cómo usar y glosario en inglés', async () => {
    const t = await render('#/guia?lang=en');
    english(t);
    for (const s of ['What is this dashboard for?', 'What it is for:', 'Glossary', 'Excess stock', 'Technical name', 'WAPE']) expect(t).toContain(s);
    expect(await render('#/guia/glosario/velocity?lang=en')).toContain('What the product sells on a typical day');
  });

  it('paso a paso y origen de los datos en inglés', async () => {
    const t = await render('#/articulo/FOODS_1_004/playground?lang=en');
    english(t);
    expect(t).toContain('Step 1 of 13');
    const s = await render('#/datos?lang=en');
    expect(s).toContain('Sources read');
    expect(s).toContain('shown exactly as the exporter writes them');
  });
});
