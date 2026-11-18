import { fmtMoney } from '../format';

/**
 * Ahorro frente a la línea base (columnas impact* de las salidas: costo de la línea base − costo
 * del pronóstico). Negativo = en ese caso el pronóstico cuesta más (constitución III.3).
 */
export function Saving({ value, sentence = true }: { value: number | null | undefined; compact?: boolean; sentence?: boolean }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return <span>{fmtMoney(null)}</span>;
  const worse = value < 0;
  if (!sentence) return <span className={worse ? 'negative' : 'positive'}>{worse ? '− ' : ''}{fmtMoney(Math.abs(value))}</span>;
  return (
    <span className={worse ? 'negative' : 'positive'}>
      {worse ? 'el pronóstico cuesta ' : 'el pronóstico ahorra '}
      {fmtMoney(Math.abs(value))}
      {worse ? ' más que la línea base' : ' frente a la línea base'}
    </span>
  );
}
