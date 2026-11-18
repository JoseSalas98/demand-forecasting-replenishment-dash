// Recuadro flotante de las gráficas en SVG: sigue al cursor y no se sale del contenedor.
import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from 'react';

export interface TipState {
  x: number;
  y: number;
  /** Alto del contenedor: en la mitad inferior el recuadro se abre hacia arriba. */
  h: number;
  content: ReactNode;
}

/** Estado del recuadro y un `show` que convierte la posición del cursor a coordenadas del contenedor. */
export function useChartTip() {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const show = useCallback((e: MouseEvent, content: ReactNode) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, h: r.height, content });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return { box, tip, show, hide };
}

export function ChartTip({ tip, width }: { tip: TipState | null; width: number }) {
  if (!tip) return null;
  const W = 300;
  const left = tip.x + 16 + W > width ? Math.max(8, tip.x - W - 16) : tip.x + 16;
  return (
    <div
      className="chart-tip"
      role="tooltip"
      style={tip.y > tip.h / 2 ? { left, bottom: Math.max(8, tip.h - tip.y + 12) } : { left, top: Math.max(8, tip.y + 12) }}
    >
      {tip.content}
    </div>
  );
}

/** Fila de un recuadro: marca de color, nombre y valor. */
export function TipRow({ color, label, value }: { color: string; label: ReactNode; value: ReactNode }) {
  return (
    <span className="tip-row">
      <span><i className="tip-dot" style={{ background: color }} />{label}</span>
      <b>{value}</b>
    </span>
  );
}
