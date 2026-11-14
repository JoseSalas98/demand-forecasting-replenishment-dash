// @vitest-environment jsdom
// Prueba de humo: cada vista se renderiza con los JSON reales de public/data, sin errores,
// con el rótulo de dinero y sin la expresión "impacto negativo".
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { GLOSSARY_BY_ID } from '../src/glossary';
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

  it('guía: #/guia, #/guia/glosario y #/guia/glosario/:term', () => {
    expect(parseHash('#/guia').route).toBe('guide');
    expect(parseHash('#/guia/glosario').params.section).toBe('glosario');
    expect(parseHash('#/guia/glosario/cv?esc=B')).toMatchObject({ route: 'guide', params: { section: 'glosario', term: 'cv' }, scenario: 'B' });
    expect(parseHash('#/guia/otra').route).toBe('notFound');
  });
});

describe.skipIf(!hasData)('vistas con datos reales', () => {
  it('inicio: 3.049, 517 y exceso evitado de A', async () => {
    const t = await render('#/');
    expect(t).toContain('Demand Driven Replenishment');
    expect(t).toContain('3.049');
    expect(t).toContain('517');
    expect(t).toContain('3,28 M US$');
    expect(t).toContain('Explorar');
    expect(t).toContain('a precio de venta, no es margen');
  });

  it('segmentación: matriz de 2.887, embudo y comparación', async () => {
    const t = await render('#/segmentacion?esc=A');
    expect(t).toContain('2.887');
    expect(t).toContain('162 sin clase XYZ no se incluyen');
    for (const n of ['207', '251', '134', '191', '229', '97', '517', '30.490']) expect(t).toContain(n);
    expect(t).toContain('Embudo: del catálogo a lo que se pronostica');
    expect(t).toContain('Ver artículos');
  });

  it('segmentación: ayuda "?" con definición y unidad en cada variable del radar', async () => {
    const seg = JSON.parse(readFileSync(join(DATA, 'segmentation.json'), 'utf-8'));
    for (const axis of seg.radar.axes) expect(GLOSSARY_BY_ID[axis]?.unit).toBeTruthy();
    const t = await render('#/segmentacion?esc=A', (el) => {
      const buttons = [...el.querySelectorAll<HTMLButtonElement>('.profile-row .help-btn')];
      expect(buttons).toHaveLength(seg.radar.axes.length);
      act(() => buttons[4].click());
      const pop = el.querySelector('.help-pop')?.textContent ?? '';
      expect(pop).toContain('Velocidad');
      expect(pop).toContain('Unidad: unidades por día');
      expect(pop).toContain('Ver en el glosario');
    });
    expect(t).toContain('mediana global del catálogo (3.049 artículos; en CV, los 2.887 con CV)');
  });

  it('#/segmentos redirige', async () => {
    const t = await render('#/segmentos?esc=A');
    expect(t).toContain('Segmentación ABC × XYZ');
  });

  it('detalle de segmento AX y total', async () => {
    expect(await render('#/segmentacion/AX?esc=A')).toContain('Segmento AX');
    expect(await render('#/segmentacion/total?esc=A')).toContain('490 de 517');
  });

  it('artículo sin id pide elegir', async () => {
    expect(await render('#/articulo')).toContain('Elige un artículo');
  });

  it('FOODS_3_655 (A): pronóstico, métricas y bandas', async () => {
    const t = await render('#/articulo/FOODS_3_655?esc=A');
    expect(t).toContain('RMSSE · 1 paso');
    expect(t).toContain('RMSSE · cadena');
    expect(t).toContain('Coeficiente de variación');
    expect(t).toContain('bandas = media ± 3σ');
    expect(t).not.toContain('no entró al pronóstico');
  });

  it('FOODS_1_004 (A): test 53–65, ahorro y z fijo', async () => {
    const t = await render('#/articulo/FOODS_1_004?esc=A');
    expect(t).toContain('bloques 53–65');
    expect(t).toContain('11.558,54 US$');
    expect(t).toContain('−0,012');
    expect(t).toContain('no disponible por artículo');
    expect(t).not.toMatch(/impacto negativo/i);
  });

  it('artículo con ahorro negativo usa el rótulo correcto', async () => {
    const t = await render('#/articulo/FOODS_1_012?esc=A');
    expect(t).toContain('cuesta');
    expect(t).toContain('más que repetir el año anterior');
    // Contexto: es uno de los 27 de 517 que cuestan más en A
    expect(t).toContain('490 de 517 artículos ahorran');
    expect(t).toContain('este es uno de ellos');
  });

  it('HOUSEHOLD_1_366: test 51–63', async () => {
    expect(await render('#/articulo/HOUSEHOLD_1_366?esc=B')).toContain('bloques 51–63');
  });

  it('artículo fuera de los 517: historia sin pronóstico', async () => {
    const t = await render('#/articulo/FOODS_1_001?esc=A&pron=0');
    expect(t).toContain('Este artículo no entró al pronóstico');
    expect(t).toContain('Coeficiente de variación');
    expect(t).not.toContain('RMSSE');
  });

  it('artículo fuera del catálogo', async () => {
    expect(await render('#/articulo/NO_EXISTE_1?esc=A')).toContain('no está en el catálogo de 3.049');
  });

  it('playground', async () => {
    const t = await render('#/articulo/FOODS_1_004/playground?esc=B');
    expect(t).toContain('Paso 1 de 13');
    // Mismas columnas que la ficha: observada y completada
    expect(t).toContain('Venta observada');
    expect(t).toContain('Venta completada');
  });

  it('impacto (A): manifiesto y WRMSSE por separado', async () => {
    const t = await render('#/impacto?esc=A');
    for (const s of ['3,28 M US$', '0,91 M US$', '0,495', '0,748', '0,868', 'Mayor contribución (z fijo)']) expect(t).toContain(s);
    expect(t).not.toMatch(/impacto negativo/i);
  });

  it('impacto: ahorro como % de la demanda del año de test', async () => {
    const a = await render('#/impacto?esc=A');
    expect(a).toContain('= 15,0 % de la demanda del año de test');
    expect(a).toContain('= 4,2 % de la demanda del año de test');
    expect(a).toContain('Demanda del año de test: 21,86 M US$');
    const b = await render('#/impacto?esc=B');
    expect(b).toContain('= 4,6 % de la demanda del año de test');
    expect(b).toContain('= 1,2 % de la demanda del año de test');
  });

  it('cómo usar: recorridos, módulos y glosario', async () => {
    const t = await render('#/guia?esc=A', (el) => {
      expect(el.querySelectorAll('.tour-zone').length).toBeGreaterThan(0);
      const next = [...el.querySelectorAll<HTMLButtonElement>('.tour .btn')].find((b) => b.textContent?.includes('siguiente'));
      act(() => next!.click());
      expect(el.querySelector('.tour-text')?.textContent).toContain('Paso 2 de');
    });
    for (const s of ['¿Qué quieres ver?', 'Objetivo del proyecto', 'Los módulos', 'Glosario', 'Velocidad', 'WRMSSE', 'Venta completada', 'Paso 1 de']) {
      expect(t).toContain(s);
    }
    expect(await render('#/guia/glosario/velocity')).toContain('unidades por día');
  });

  it('origen de los datos con pendientes', async () => {
    const t = await render('#/datos');
    expect(t).toContain('impact_sum_matches_total_A');
    expect(t).toContain('Pendientes');
    expect(t).toContain('ninguno');
  });
});
