// Constitución VI: solo los colores de la guía; los hex viven en styles.css y theme.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const GUIDE = readFileSync(join(__dirname, '..', 'diseno', 'guia_visual.md'), 'utf-8');
const HEX = /#[0-9A-Fa-f]{6}\b/g;
const ALLOWED_FILES = new Set(['styles.css', 'theme.ts']);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('paleta de la guía visual', () => {
  const guideHex = new Set((GUIDE.match(HEX) ?? []).map((h) => h.toUpperCase()));

  it('la guía define colores', () => {
    expect(guideHex.size).toBeGreaterThanOrEqual(14);
  });

  it('ningún archivo de src fuera de styles.css y theme.ts tiene literales #RRGGBB', () => {
    const offenders = walk(SRC).filter((p) => !ALLOWED_FILES.has(p.split(/[\\/]/).pop()!) && (readFileSync(p, 'utf-8').match(HEX) ?? []).length > 0);
    expect(offenders).toEqual([]);
  });

  it('todo hex de styles.css y theme.ts está en la tabla de la guía', () => {
    for (const f of ALLOWED_FILES) {
      const found = (readFileSync(join(SRC, f), 'utf-8').match(HEX) ?? []).map((h) => h.toUpperCase());
      expect(found.length).toBeGreaterThan(0);
      for (const h of found) expect(guideHex, `${f}: ${h}`).toContain(h);
    }
  });
});
