// Contexto del ahorro de un artículo: cuántos de los 517 ahorran y por qué un artículo puede costar
// más aunque el pronóstico gane en el total (z fijo del 95 % del total).
import { fmtNumber } from '../format';
import type { Concentration, ItemImpact } from '../types';

export function ImpactContext({ impact, concentration }: { impact: ItemImpact; concentration: Concentration }) {
  const worse = impact.impact < 0;
  return (
    <div className="note" style={{ marginTop: 12 }}>
      {fmtNumber(concentration.improve)} de {fmtNumber(concentration.items)} artículos ahorran frente a la línea base y{' '}
      {fmtNumber(concentration.worsen)} cuestan más{worse ? '; este es uno de ellos' : '; este es de los que ahorran'}. El ahorro por
      artículo usa un colchón fijo (el del 95 % del total: pronóstico z = {fmtNumber(impact.z_model, 2)}, línea base z ={' '}
      {fmtNumber(impact.z_naive, 2)}), así que un artículo puede costar más aunque su pronóstico se equivoque poco.
    </div>
  );
}
