// Contexto del ahorro de un artículo: cuántos de los 517 ahorran en el escenario y por qué un
// artículo puede costar más aunque el modelo gane en el total (z fijo del 95 % del total).
import { fmtNumber } from '../format';
import type { Concentration, ItemImpact, Scenario } from '../types';
import { SCENARIO_LABEL } from './Pill';

export function ImpactContext({ impact, concentration, scenario }: { impact: ItemImpact; concentration: Concentration; scenario: Scenario }) {
  const worse = impact.impact < 0;
  return (
    <div className="note" style={{ marginTop: 12 }}>
      En el escenario {SCENARIO_LABEL[scenario]}, {fmtNumber(concentration.improve)} de {fmtNumber(concentration.items)} artículos ahorran
      frente a la línea base y {fmtNumber(concentration.worsen)} cuestan más
      {worse ? '; este es uno de ellos' : '; este es de los que ahorran'}. El ahorro por artículo se calcula con un z fijo (el del 95 % de
      servicio del total: modelo {fmtNumber(impact.z_model, 3)}, línea base {fmtNumber(impact.z_naive, 3)}), así que un artículo puede
      costar más aunque su pronóstico se equivoque poco: el colchón del total no le queda bien a cada artículo.
    </div>
  );
}
