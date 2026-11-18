// @vitest-environment jsdom
// Gráficas dibujadas de verdad (tamaño fijo): con React 19, Recharts 2 no recorre fragmentos,
// así que se comprueba que cada serie llegue al SVG.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cloneElement, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ArticleChart, tickLabel } from '../src/components/charts/ArticleChart';
import { bubbleLayout } from '../src/components/charts/Bubbles';
import { niceMax, UnitsBandChart } from '../src/components/charts/UnitsBandChart';

vi.mock('recharts', async (orig) => {
  const m = (await orig()) as Record<string, unknown>;
  return { ...m, ResponsiveContainer: ({ children }: { children: ReactElement }) => cloneElement(children, { width: 800, height: 320 } as object) };
});

const DATA = join(__dirname, '..', 'public', 'data');
const hasData = existsSync(join(DATA, 'catalog.json'));
const read = (p: string) => JSON.parse(readFileSync(join(DATA, p), 'utf-8'));

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

async function draw(el: ReactElement): Promise<HTMLElement> {
  const host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => createRoot(host).render(el));
  return host;
}

const legend = (h: HTMLElement) => [...h.querySelectorAll('.recharts-legend-item-text')].map((x) => x.textContent);

describe('escalas', () => {
  it('niceMax deja margen y redondea', () => {
    expect(niceMax([100])).toBe(120);
    expect(niceMax([1466.5, 556])).toBe(1600);
    expect(niceMax([null, undefined])).toBe(1);
  });
  it('eje de unidades: unidades sueltas en escalas pequeñas y miles en las grandes', () => {
    expect(tickLabel(0, 400)).toBe('0');
    expect(tickLabel(100, 400)).toBe('100');
    expect(tickLabel(12500, 50000)).toBe('12,5 mil');
    expect(tickLabel(25000, 50000)).toBe('25 mil');
  });
});

describe.skipIf(!hasData)('UnitsBandChart con datos reales', () => {
  it('FOODS_3_655: venta, completada, pronóstico y línea base en la gráfica principal', async () => {
    const d = read('descriptive/FOODS_3_655.json');
    const s = read('series/FOODS_3_655.json');
    const h = await draw(<UnitsBandChart data={d} test={{ from: 53, to: 65, rows: s.rows, scenario: 'A' }} />);
    expect(h.querySelectorAll('.recharts-line path.recharts-curve').length).toBe(4);
    expect(legend(h)).toEqual(['Lo que se vendió', 'Venta sin faltantes (estimada)', 'Pronóstico', 'Línea base']);
    expect(h.textContent).toContain('Año de prueba (13 periodos)');
    expect(h.textContent).toContain('+3σ');
  });

  it('las bandas quedan dentro de la escala en artículos de σ alta y baja', async () => {
    for (const id of ['FOODS_3_655', 'HOBBIES_1_228']) {
      const d = read(`descriptive/${id}.json`);
      const h = await draw(<UnitsBandChart data={d} />);
      const labels = [...h.querySelectorAll('.recharts-reference-line text')].map((t) => t.textContent);
      expect(labels).toContain('+3σ');
      expect(labels).toContain('media');
      expect(labels.some((l) => l?.startsWith('−3σ'))).toBe(true);
    }
  });
});

describe.skipIf(!hasData)('burbujas de segmentos', () => {
  for (const mode of ['spend', 'n'] as const) {
    it(`(${mode}) las familias no se enciman y cada grupo queda dentro de su familia y del lienzo`, () => {
      const placed = bubbleLayout(read('segmentation.json').matrix, mode);
      expect(placed.map((p) => p.family)).toEqual(['A', 'B', 'C']);
      for (let i = 0; i < 3; i++) {
        const a = placed[i];
        expect(a.cx - a.R).toBeGreaterThanOrEqual(0);
        expect(a.cx + a.R).toBeLessThanOrEqual(760);
        for (const c of a.cells) expect(Math.hypot(c.x - a.cx, c.y - a.cy) + c.r).toBeLessThanOrEqual(a.R + 0.01);
        for (let j = i + 1; j < 3; j++) {
          const b = placed[j];
          expect(Math.hypot(a.cx - b.cx, a.cy - b.cy)).toBeGreaterThanOrEqual(a.R + b.R);
        }
      }
    });
  }
});

describe.skipIf(!hasData)('ArticleChart con datos reales', () => {
  it('FOODS_3_090: cuatro series, franja del año de prueba y leyenda que se puede apagar', async () => {
    const d = read('descriptive/FOODS_3_090.json');
    const s = read('series/FOODS_3_090.json');
    const byBlock = new Map(s.rows.map((r: { block: number }) => [r.block, r]));
    const rows = d.rows.map((r: { block: number; units_observed: number }) => {
      const x = byBlock.get(r.block) as { units_completed: number; forecast: { A: number } | null; baseline: number | null } | undefined;
      return { block: r.block, observed: r.units_observed, completed: x?.units_completed ?? null, forecast: x?.forecast?.A ?? null, baseline: x?.baseline ?? null };
    });
    const h = await draw(<ArticleChart rows={rows} test={{ from: 53, to: 65 }} stats={d.stats} startDates={new Map()} />);
    const chips = [...h.querySelectorAll<HTMLButtonElement>('.lg')];
    expect(chips.map((c) => c.textContent)).toEqual(['Lo que se vendió', 'Venta sin faltantes (estimada)', 'Pronóstico', 'Línea base', 'Media y ±3σ']);
    expect(h.querySelector('.test-shade')).not.toBeNull();
    await act(async () => chips[3].click());
    expect(h.querySelectorAll<HTMLButtonElement>('.lg')[3].getAttribute('aria-pressed')).toBe('false');
  });
});
