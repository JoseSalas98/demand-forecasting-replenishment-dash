// Lecturas derivadas de las curvas de impacto exportadas (constitución 2.0.0, I.12): interpolación
// lineal entre los 17 valores de z ya calculados. No recalcula el impacto: solo lee la curva.
import type { CurvePoint } from './types';

export interface CurveReading {
  /** Tramo de la curva (entre el punto i y el i + 1) y posición dentro de él. */
  i: number;
  t: number;
  z: number;
  excess: number;
  lost: number;
  service: number;
}

const lerp = (a: number, b: number, t: number) => a + t * (b - a);

function readAt(curve: CurvePoint[], i: number, t: number): CurveReading {
  const a = curve[i], b = curve[i + 1];
  return { i, t, z: lerp(a.z, b.z, t), excess: lerp(a.excess, b.excess, t), lost: lerp(a.lost, b.lost, t), service: lerp(a.service, b.service, t) };
}

/** Punto de la curva con el % de demanda atendida `service` (0–1); fuera de la curva → null. */
export function atService(curve: CurvePoint[], service: number): CurveReading | null {
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i].service, b = curve[i + 1].service;
    if (service >= a && service <= b && b > a) return readAt(curve, i, (service - a) / (b - a));
  }
  return null;
}

/** Punto de la curva con la mercancía sobrante `excess`; fuera de la curva → null. */
export function atExcess(curve: CurvePoint[], excess: number): CurveReading | null {
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i].excess, b = curve[i + 1].excess;
    if (excess >= a && excess <= b && b > a) return readAt(curve, i, (excess - a) / (b - a));
  }
  return null;
}

/** Lectura de una curva de grupo con el mismo tramo (i, t) que el total: así los grupos suman el total. */
export function sameZ(curve: CurvePoint[], r: Pick<CurveReading, 'i' | 't'>): CurveReading {
  return readAt(curve, r.i, r.t);
}

export interface Levers {
  service: number;
  model: CurveReading;
  naive: CurveReading;
  /** Liberar capital: sobrante evitado al mismo % de demanda atendida. */
  freedCapital: number;
  freedPct: number;
  /** Recuperar ventas: con el mismo sobrante que la línea base. */
  sameExcess: CurveReading | null;
  recoveredSales: number | null;
}

/** Las dos palancas del pronóstico frente a la línea base a un % de demanda atendida. */
export function levers(model: CurvePoint[], naive: CurvePoint[], service: number): Levers | null {
  const m = atService(model, service), n = atService(naive, service);
  if (!m || !n) return null;
  const same = atExcess(model, n.excess);
  return {
    service,
    model: m,
    naive: n,
    freedCapital: n.excess - m.excess,
    freedPct: n.excess > 0 ? (n.excess - m.excess) / n.excess : 0,
    sameExcess: same,
    recoveredSales: same ? n.lost - same.lost : null,
  };
}

/** WAPE de una serie frente a la venta sin faltantes (lectura derivada, I.12); sin datos → null. */
export function wape(pred: (number | null)[], actual: (number | null)[]): number | null {
  let err = 0, sum = 0;
  for (let k = 0; k < pred.length; k++) {
    const p = pred[k], a = actual[k];
    if (p === null || a === null) return null;
    err += Math.abs(p - a);
    sum += a;
  }
  return sum > 0 ? err / sum : null;
}
