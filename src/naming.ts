// Nombres de los grupos para gerencia: familia (ABC) + regularidad (XYZ), en español e inglés.
// Fuente única de los nombres, definiciones y políticas que ve el usuario (specs 002 y 003).
import { getLang, pick, type Lang } from './i18n';

export type Family = 'A' | 'B' | 'C';
export type Level = 'X' | 'Y' | 'Z';

export const FAMILIES: Family[] = ['A', 'B', 'C'];
export const LEVELS: Level[] = ['X', 'Y', 'Z'];

const FAMILY: Record<Lang, Record<Family, string>> = {
  es: { A: 'Vitales', B: 'Útiles', C: 'Complementarios' },
  en: { A: 'Vital', B: 'Useful', C: 'Complementary' },
};
const LEVEL: Record<Lang, Record<Level, string>> = {
  es: { X: 'continuos', Y: 'recurrentes', Z: 'ocasionales' },
  en: { X: 'continuous', Y: 'recurring', Z: 'occasional' },
};
// En inglés el grupo se nombra con el adjetivo delante: "Continuous vitals"
const FAMILY_NOUN_EN: Record<Family, string> = { A: 'vitals', B: 'useful items', C: 'complementary items' };
const FAMILY_SINGULAR: Record<Lang, Record<Family, string>> = {
  es: { A: 'vital', B: 'útil', C: 'complementario' },
  en: { A: 'vital', B: 'useful', C: 'complementary' },
};
const LEVEL_SINGULAR: Record<Lang, Record<Level, string>> = {
  es: { X: 'continuo', Y: 'recurrente', Z: 'ocasional' },
  en: { X: 'continuous', Y: 'recurring', Z: 'occasional' },
};

const FAMILY_DEFS: Record<Lang, Record<Family, string>> = {
  es: {
    A: 'Los pocos artículos que más pesan: juntos suman el primer 60 % de la venta. Si faltan en el anaquel, se nota en la caja.',
    B: 'Artículos de aporte medio: llevan la venta acumulada del 60 % al 84 %.',
    C: 'Los muchos artículos que completan el surtido: cada uno vende poco y juntos suman el 16 % restante de la venta.',
  },
  en: {
    A: 'The few products that matter most: together they make up the first 60% of sales. When they run out on the shelf, it shows at the register.',
    B: 'Mid-weight products: they take cumulative sales from 60% to 84%.',
    C: 'The many products that round out the range: each sells little, and together they make up the remaining 16% of sales.',
  },
};
const LEVEL_DEFS: Record<Lang, Record<Level, string>> = {
  es: {
    X: 'su venta es pareja de un periodo a otro (variabilidad baja). Es el más fácil de prever.',
    Y: 'su venta vuelve, pero con altibajos (variabilidad intermedia).',
    Z: 'su venta da saltos fuertes de un periodo a otro (variabilidad alta). Es el más difícil de prever.',
  },
  en: {
    X: 'its sales stay steady from one period to the next (low variability). It is the easiest to predict.',
    Y: 'its sales keep coming back, but with ups and downs (medium variability).',
    Z: 'its sales jump sharply from one period to the next (high variability). It is the hardest to predict.',
  },
};
const FAMILY_ROLE: Record<Lang, Record<Family, string>> = {
  es: { A: 'de los pocos que más pesan en la venta', B: 'de aporte medio a la venta', C: 'de los muchos que completan el surtido' },
  en: { A: 'one of the few products that matter most to sales', B: 'a mid-weight contributor to sales', C: 'one of the many products that round out the range' },
};
const POLICIES: Record<Lang, Record<string, string>> = {
  es: { regular_replenishment: 'Reposición regular', periodic_review_replenishment: 'Revisión periódica', promotion_priority: 'Prioridad en promociones' },
  en: { regular_replenishment: 'Regular replenishment', periodic_review_replenishment: 'Periodic review', promotion_priority: 'Promotion priority' },
};
const CELL_TREATMENT: Record<string, string> = { AX: 'regular_replenishment', AY: 'periodic_review_replenishment', AZ: 'promotion_priority' };

/** "Vitales" / "Vital". */
export const familyName = (f: Family): string => pick(FAMILY)[f];
/** "continuos" / "continuous". */
export const levelName = (l: Level): string => pick(LEVEL)[l];
export const familyDef = (f: Family): string => pick(FAMILY_DEFS)[f];
/** Definición del nivel, en minúscula para ir después de "su venta…" / "its sales…". */
export const levelDef = (l: Level): string => pick(LEVEL_DEFS)[l];

/** Política sugerida por el proyecto de datos (`items.json → treatment`); desconocida → tal cual. */
export const policy = (treatment: string): string => pick(POLICIES)[treatment] ?? treatment;
/** Política de un grupo Vital ("Reposición regular" / "Regular replenishment"). */
export const cellPolicy = (cell: string): string => (CELL_TREATMENT[cell] ? policy(CELL_TREATMENT[cell]) : '');

const isCell = (c: string | null | undefined): c is `${Family}${Level}` =>
  !!c && c.length === 2 && 'ABC'.includes(c[0]) && 'XYZ'.includes(c[1]);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Vitales continuos" / "Continuous vitals"; celda desconocida → el código tal cual. */
export function cellName(cell: string | null | undefined): string {
  if (!isCell(cell)) return cell ?? (getLang() === 'en' ? 'no group' : 'sin grupo');
  const f = cell[0] as Family, l = cell[1] as Level;
  if (getLang() === 'en') return `${cap(LEVEL.en[l])} ${FAMILY_NOUN_EN[f]}`;
  return `${FAMILY.es[f]} ${LEVEL.es[l]}`;
}

/** "artículo vital continuo" / "continuous vital product". */
export function cellSingular(cell: string): string {
  if (!isCell(cell)) return cell;
  const f = cell[0] as Family, l = cell[1] as Level;
  if (getLang() === 'en') return `${LEVEL_SINGULAR.en[l]} ${FAMILY_SINGULAR.en[f]} product`;
  return `artículo ${FAMILY_SINGULAR.es[f]} ${LEVEL_SINGULAR.es[l]}`;
}

/** Definición combinada para la burbuja: "Es de los pocos que más pesan … y su venta …". */
export function cellDefinition(cell: string): string {
  if (!isCell(cell)) return '';
  const f = cell[0] as Family, l = cell[1] as Level;
  if (getLang() === 'en') return `It is ${FAMILY_ROLE.en[f]}, and ${LEVEL_DEFS.en[l]}`;
  return `Es ${FAMILY_ROLE.es[f]} y ${LEVEL_DEFS.es[l]}`;
}
