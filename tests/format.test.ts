import { describe, expect, it } from 'vitest';
import { fmtMoney, fmtNumber, fmtPct, fmtRatio } from '../src/format';

describe('format', () => {
  it('usa punto de miles y coma decimal', () => {
    expect(fmtNumber(1234.5, 1)).toBe('1.234,5');
  });
  it('ausente es "no disponible"', () => {
    expect(fmtNumber(null)).toBe('no disponible');
    expect(fmtMoney(undefined)).toBe('no disponible');
    expect(fmtPct(Number.NaN)).toBe('no disponible');
  });
  it('cero real no es ausente', () => {
    expect(fmtNumber(0)).toBe('0');
  });
  it('abrevia millones', () => {
    expect(fmtMoney(3276162.34)).toBe('3,28 M US$');
    expect(fmtMoney(907451.6)).toBe('0,91 M US$');
    expect(fmtMoney(11558.54)).toBe('11.558,54 US$');
  });
  it('ratio con anterior en cero es "no disponible"', () => {
    expect(fmtRatio(5, 0)).toBe('no disponible');
    expect(fmtRatio(3, 2)).toBe('1,500');
  });
});
