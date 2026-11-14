// Fondo animado de Inicio: una red de nodos en columnas que late despacio (guía visual §4).
// Se detiene con la pestaña oculta y respeta prefers-reduced-motion (un solo cuadro).
import { useEffect, useRef } from 'react';
import { COLOR } from '../theme';

const COLUMNS = [5, 7, 8, 8, 7, 5]; // ≈ 40 nodos
const PERIOD_MS = 4000;

function hexToRgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function NeuralBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Fase fija por nodo para que el pulso no sea uniforme
    const phases = COLUMNS.map((n, c) => Array.from({ length: n }, (_, r) => ((c * 7 + r * 13) % 17) / 17));
    let w = 0;
    let h = 0;
    let raf = 0;

    const nodes = () =>
      COLUMNS.map((n, c) =>
        Array.from({ length: n }, (_, r) => ({
          x: (w * (c + 1)) / (COLUMNS.length + 1),
          y: (h * (r + 1)) / (n + 1),
        })),
      );

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const grid = nodes();
      for (let c = 0; c < grid.length - 1; c++) {
        for (const [i, a] of grid[c].entries()) {
          for (const [j, b] of grid[c + 1].entries()) {
            const lit = (i + j + c) % 4 === 0;
            ctx.strokeStyle = lit ? hexToRgba(COLOR.cyan, 0.22) : hexToRgba(COLOR.border, 0.35);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const [c, col] of grid.entries()) {
        for (const [r, p] of col.entries()) {
          const pulse = 0.5 + 0.5 * Math.sin(((t / PERIOD_MS) + phases[c][r]) * 2 * Math.PI);
          const color = (c + r) % 3 === 0 ? COLOR.blue : COLOR.cyan;
          ctx.fillStyle = hexToRgba(color, 0.15 + 0.2 * pulse);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 + 2 * pulse, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduced || raf || document.hidden) return;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      ro?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" />;
}
