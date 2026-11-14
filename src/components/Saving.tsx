import { Money } from './Money';

/**
 * Ahorro frente a no hacer nada (columnas impact* de las salidas: costo de la línea base − costo
 * del modelo). Negativo = en ese caso el modelo cuesta más que repetir el año anterior
 * (constitución III.3). Nunca se rotula "impacto negativo".
 */
export function Saving({ value, compact = false, sentence = true }: { value: number | null | undefined; compact?: boolean; sentence?: boolean }) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <Money value={null} compact={compact} />;
  }
  const worse = value < 0;
  return (
    <span className={worse ? 'negative' : 'positive'}>
      {sentence && !compact && (worse ? 'el modelo cuesta ' : 'el modelo ahorra ')}
      {compact && worse && '− '}
      <Money value={Math.abs(value)} compact={compact} />
      {sentence && !compact && (worse ? ' más que repetir el año anterior' : ' frente a repetir el año anterior')}
    </span>
  );
}
