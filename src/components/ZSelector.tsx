import { useId } from 'react';
import { fmtNumber, fmtPct } from '../format';
import type { CurvePoint } from '../types';

/** Deslizador sobre los 17 valores de z ya calculados (constitución II.6); muestra el servicio del modelo. */
export function ZSelector({ zValues, index, onChange, curve }: { zValues: number[]; index: number; onChange: (i: number) => void; curve: CurvePoint[] }) {
  const id = useId();
  const point = curve[index];
  return (
    <div className="slider">
      <label htmlFor={id} className="label">Nivel de servicio</label>
      <input
        id={id}
        type="range"
        min={0}
        max={zValues.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`servicio ${fmtPct(point ? point.service * 100 : null)}, z = ${fmtNumber(zValues[index], 2)}`}
      />
      <span className="value">{fmtPct(point ? point.service * 100 : null)}</span>
      <span className="muted">z = {fmtNumber(zValues[index], 2)}</span>
    </div>
  );
}

/** Índice del z cuyo servicio del modelo queda más cerca de la meta. */
export function closestServiceIndex(curve: CurvePoint[], target: number): number {
  return curve.reduce((best, p, i) => (Math.abs(p.service - target) < Math.abs(curve[best].service - target) ? i : best), 0);
}
