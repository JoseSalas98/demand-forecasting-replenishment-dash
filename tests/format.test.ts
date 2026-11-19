import { describe, expect, it } from 'vitest';
import { fmtAxisM, fmtDate, fmtK, fmtM, fmtMoney, fmtMonthYear, fmtNumber, fmtPct, fmtRatio, fmtUsd } from '../src/format';
import { setLang } from '../src/i18n';

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

describe('format en inglés (spec 003)', () => {
  const inEnglish = (fn: () => void) => {
    setLang('en', false);
    try {
      fn();
    } finally {
      setLang('es', false);
    }
  };
  it('separadores, dinero, porcentaje y fechas de EE. UU.', () => {
    inEnglish(() => {
      expect(fmtNumber(1234.5, 1)).toBe('1,234.5');
      expect(fmtMoney(3276162.34)).toBe('US$3.28M');
      expect(fmtMoney(11558.54)).toBe('US$11,558.54');
      expect(fmtM(-907451.6)).toBe('−US$0.91M');
      expect(fmtK(122293)).toBe('US$122K');
      expect(fmtK(122293, true)).toBe('122');
      expect(fmtUsd(11558.54)).toBe('US$11,559');
      expect(fmtPct(52.2, 0)).toBe('52%');
      expect(fmtDate('2015-05-25')).toBe('May 25, 2015');
      expect(fmtMonthYear('2011-09-02')).toBe('Sep 2011');
      expect(fmtNumber(null)).toBe('not available');
    });
  });
  it('en español no cambia', () => {
    expect(fmtK(122293)).toBe('122 mil US$');
    expect(fmtPct(52.2, 0)).toBe('52 %');
    expect(fmtDate('2015-05-25')).toBe('25 may 2015');
    expect(fmtAxisM(12e6)).toBe('12 M');
  });
});
