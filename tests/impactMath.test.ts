// Lecturas derivadas (constitución I.12): al 95 % reproducen las cifras oficiales del manifiesto.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { atService, levers, sameZ, wape } from '../src/impactMath';

const DATA = join(__dirname, '..', 'public', 'data');
const hasData = existsSync(join(DATA, 'segments.json'));
const read = (p: string) => JSON.parse(readFileSync(join(DATA, p), 'utf-8'));

describe('wape', () => {
  it('suma de errores absolutos ÷ suma real', () => {
    expect(wape([11, 9], [10, 10])).toBeCloseTo(0.1);
    expect(wape([1, null], [1, 1])).toBeNull();
  });
});

describe.skipIf(!hasData)('palancas con las curvas exportadas', () => {
  const segs = read('segments.json').segments;
  const meta = read('meta.json');
  const total = segs.total.curves;

  it('al 95 % coincide con el manifiesto (menos de 0,1 %)', () => {
    const l = levers(total.A, total.naive, 0.95)!;
    expect(Math.abs(l.freedCapital / meta.headline.A.saving_excess95 - 1)).toBeLessThan(0.001);
    expect(Math.abs(l.recoveredSales! / meta.headline.A.recovered_sales_same_excess - 1)).toBeLessThan(0.001);
    expect(l.model.lost).toBeCloseTo(l.naive.lost, 0);
  });

  it('el desglose por grupo con el z del total suma exactamente el total', () => {
    for (const s of [0.9, 0.95, 0.99]) {
      const m = atService(total.A, s)!, n = atService(total.naive, s)!;
      const sum = ['AX', 'AY', 'AZ'].reduce((acc, g) => acc + sameZ(segs[g].curves.naive, n).excess - sameZ(segs[g].curves.A, m).excess, 0);
      expect(sum).toBeCloseTo(n.excess - m.excess, 0);
    }
  });

  it('fuera de la curva no inventa', () => {
    expect(atService(total.A, 1.5)).toBeNull();
  });
});
