// @vitest-environment jsdom
// Gráficas dibujadas de verdad (tamaño fijo): con React 19, Recharts 2 no recorre fragmentos,
// así que se comprueba que cada serie llegue al SVG.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cloneElement, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { funnelWidths } from '../src/components/charts/FunnelBar';
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
  it('el embudo se angosta etapa a etapa', () => {
    const w = funnelWidths([30490, 3049, 592, 517]);
    expect(w[0]).toBe(100);
    for (let i = 1; i < w.length; i++) expect(w[i]).toBeLessThan(w[i - 1]);
  });
});

describe.skipIf(!hasData)('UnitsBandChart con datos reales', () => {
  it('FOODS_3_655: venta, completada, pronóstico y línea base en la gráfica principal', async () => {
    const d = read('descriptive/FOODS_3_655.json');
    const s = read('series/FOODS_3_655.json');
    const h = await draw(<UnitsBandChart data={d} test={{ from: 53, to: 65, rows: s.rows, scenario: 'A' }} />);
    expect(h.querySelectorAll('.recharts-line path.recharts-curve').length).toBe(4);
    expect(legend(h)).toEqual(['Venta observada', 'Venta completada (quiebres tratados)', 'Pronóstico A · a un paso', 'Línea base (repetir el año anterior)']);
    expect(h.textContent).toContain('Test (13 bloques)');
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
