// Idiomas (spec 003): los dos diccionarios tienen las mismas claves y el idioma se elige bien.
import { describe, expect, it } from 'vitest';
import { getLang, langFromHash, setLang, t } from '../src/i18n';
import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';
import { cellName, cellSingular, policy } from '../src/naming';
import { glossary } from '../src/glossary';

/** Claves de un objeto, en profundidad; las funciones y los arreglos cuentan como hojas. */
function keys(o: unknown, prefix = ''): string[] {
  if (o === null || typeof o !== 'object' || Array.isArray(o)) return [prefix];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe('diccionarios', () => {
  it('inglés y español tienen exactamente las mismas claves', () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });
  it('ningún texto en inglés queda vacío salvo el que solo aplica a un idioma', () => {
    const empty = keys(en).filter((k) => {
      const v = k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], en);
      return v === '';
    });
    expect(empty).toEqual([]);
  });
  it('arreglos con el mismo largo en los dos idiomas', () => {
    expect(en.guide.purpose).toHaveLength(es.guide.purpose.length);
    expect(en.play.cols).toHaveLength(es.play.cols.length);
    for (const m of ['home', 'segments', 'item', 'impact'] as const) expect(en.guide.modules[m].steps).toHaveLength(es.guide.modules[m].steps.length);
  });
});

describe('idioma activo', () => {
  it('?lang= del enlace', () => {
    expect(langFromHash('#/impacto?lang=en')).toBe('en');
    expect(langFromHash('#/impacto?esc=A&lang=es')).toBe('es');
    expect(langFromHash('#/impacto?lang=fr')).toBeNull();
    expect(langFromHash('#/')).toBeNull();
  });
  it('setLang cambia textos, nombres y glosario', () => {
    setLang('en', false);
    try {
      expect(getLang()).toBe('en');
      expect(t().common.moneyNote).toBe('Figures at retail price · not margin');
      expect(cellName('AX')).toBe('Continuous vitals');
      expect(cellName('BZ')).toBe('Occasional useful items');
      expect(cellSingular('AY')).toBe('recurring vital product');
      expect(policy('promotion_priority')).toBe('Promotion priority');
      expect(glossary().find((g) => g.id === 'exceso')?.term).toBe('Excess stock');
    } finally {
      setLang('es', false);
    }
    expect(cellName('AX')).toBe('Vitales continuos');
    expect(glossary().find((g) => g.id === 'exceso')?.term).toBe('Mercancía sobrante');
  });
});
