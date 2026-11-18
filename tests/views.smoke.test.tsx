// @vitest-environment jsdom
// Prueba de humo (spec 002): cada vista se renderiza con los JSON reales de public/data, sin errores,
// con la etiqueta global de dinero, en lenguaje de gerencia y sin mencionar el método del pronóstico.
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
    for (const axis of seg.radar.axes) expect(GLOSSARY_BY_ID[axis]?.unit).toBeTruthy();
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

  it('artículo sin id abre uno por defecto', async () => {
    expect(await render('#/articulo')).toContain('Artículo FOODS_3_090');
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
