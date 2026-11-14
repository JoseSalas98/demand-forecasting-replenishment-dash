// Paleta de diseno/guia_visual.md §2 (constitución VI). Único lugar con colores para las gráficas;
// los mismos valores viven como variables CSS en styles.css. No se agregan colores fuera de esta tabla.

export const COLOR = {
  bg: '#0B1220',
  panel: '#0F1828',
  card: '#142036',
  border: '#25324B',
  text: '#E6EDF5',
  textMuted: '#8C9AB0',
  cyan: '#009FCA', // acento de la interfaz y modelo (CatBoost)
  plum: '#965596', // línea base (seasonal naive)
  blue: '#2B95E1', // segmento AX
  green: '#148E66', // segmento AY
  violet: '#725FB3', // segmento AZ
  silver: '#D6E0EC', // venta real (unidades y dinero)
  slate: '#7D8AA6', // bandas ±3σ, histograma, etapas sin pronóstico
  grey: '#56637C', // media
} as const;

export const CELL_COLOR: Record<string, string> = { AX: COLOR.blue, AY: COLOR.green, AZ: COLOR.violet };

/** Props comunes de ejes y rejilla de Recharts en tema oscuro. */
export const AXIS = { stroke: COLOR.border, tick: { fill: COLOR.textMuted, fontSize: 12 } } as const;
export const GRID = { stroke: COLOR.border, strokeDasharray: '3 3' } as const;
export const TOOLTIP = {
  contentStyle: { background: COLOR.panel, border: `1px solid ${COLOR.border}`, color: COLOR.text, borderRadius: 8 },
  labelStyle: { color: COLOR.textMuted },
  itemStyle: { color: COLOR.text },
} as const;
export const LEGEND = { wrapperStyle: { color: COLOR.text, fontSize: 13 } } as const;
