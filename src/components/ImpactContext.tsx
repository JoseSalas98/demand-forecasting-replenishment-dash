// Contexto del ahorro de un artículo: cuántos de los 517 ahorran y por qué un artículo puede costar
// más aunque el pronóstico gane en el total (z fijo del 95 % del total).
import { fmtNumber } from '../format';
import { t } from '../i18n';
import type { Concentration, ItemImpact } from '../types';

export function ImpactContext({ impact, concentration }: { impact: ItemImpact; concentration: Concentration }) {
  const worse = impact.impact < 0;
  return (
    <div className="note" style={{ marginTop: 12 }}>
      {t().impactContext(fmtNumber(concentration.improve), fmtNumber(concentration.items), fmtNumber(concentration.worsen), worse, fmtNumber(impact.z_model, 2), fmtNumber(impact.z_naive, 2))}
    </div>
  );
}
