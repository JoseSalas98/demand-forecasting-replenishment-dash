// Nombres de los grupos para gerencia: familia (ABC) + regularidad (XYZ). Fuente única de los
// nombres, definiciones y políticas que ve el usuario (specs/002-rediseno-gerencia).

export type Family = 'A' | 'B' | 'C';
export type Level = 'X' | 'Y' | 'Z';

export const FAMILIES: Family[] = ['A', 'B', 'C'];
export const LEVELS: Level[] = ['X', 'Y', 'Z'];

export const FAMILY_NAME: Record<Family, string> = { A: 'Vitales', B: 'Útiles', C: 'Complementarios' };
export const LEVEL_NAME: Record<Level, string> = { X: 'continuos', Y: 'recurrentes', Z: 'ocasionales' };
const FAMILY_SINGULAR: Record<Family, string> = { A: 'vital', B: 'útil', C: 'complementario' };
const LEVEL_SINGULAR: Record<Level, string> = { X: 'continuo', Y: 'recurrente', Z: 'ocasional' };

export const FAMILY_DEF: Record<Family, string> = {
  A: 'Los pocos artículos que más pesan: juntos suman el primer 60 % de la venta. Si faltan en el anaquel, se nota en la caja.',
  B: 'Artículos de aporte medio: llevan la venta acumulada del 60 % al 84 %.',
  C: 'Los muchos artículos que completan el surtido: cada uno vende poco y juntos suman el 16 % restante de la venta.',
};
export const LEVEL_DEF: Record<Level, string> = {
  X: 'su venta es pareja de un periodo a otro (variabilidad baja). Es el más fácil de prever.',
  Y: 'su venta vuelve, pero con altibajos (variabilidad intermedia).',
  Z: 'su venta da saltos fuertes de un periodo a otro (variabilidad alta). Es el más difícil de prever.',
};
const FAMILY_ROLE: Record<Family, string> = {
  A: 'de los pocos que más pesan en la venta',
  B: 'de aporte medio a la venta',
  C: 'de los muchos que completan el surtido',
};

/** Política sugerida por el proyecto de datos (`items.json → treatment`). */
export const POLICY: Record<string, string> = {
  regular_replenishment: 'Reposición regular',
  periodic_review_replenishment: 'Revisión periódica',
  promotion_priority: 'Prioridad en promociones',
};
export const CELL_POLICY: Record<string, string> = { AX: 'Reposición regular', AY: 'Revisión periódica', AZ: 'Prioridad en promociones' };

const isCell = (c: string | null | undefined): c is `${Family}${Level}` =>
  !!c && c.length === 2 && 'ABC'.includes(c[0]) && 'XYZ'.includes(c[1]);

/** "Vitales continuos"; celda desconocida → el código tal cual. */
export function cellName(cell: string | null | undefined): string {
  if (!isCell(cell)) return cell ?? 'sin grupo';
  return `${FAMILY_NAME[cell[0] as Family]} ${LEVEL_NAME[cell[1] as Level]}`;
}

/** "artículo vital continuo". */
export function cellSingular(cell: string): string {
  if (!isCell(cell)) return cell;
  return `artículo ${FAMILY_SINGULAR[cell[0] as Family]} ${LEVEL_SINGULAR[cell[1] as Level]}`;
}

/** Definición combinada para la burbuja: "Es de los pocos que más pesan … y su venta …". */
export function cellDefinition(cell: string): string {
  if (!isCell(cell)) return '';
  return `Es ${FAMILY_ROLE[cell[0] as Family]} y ${LEVEL_DEF[cell[1] as Level]}`;
}
