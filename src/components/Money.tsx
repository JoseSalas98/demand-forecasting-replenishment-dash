import { fmtMoney, MONEY_LABEL } from '../format';

/** Única cifra monetaria del sitio: siempre con el rótulo "a precio de venta, no es margen". */
export function Money({ value, compact = false }: { value: number | null | undefined; compact?: boolean }) {
  return (
    <span className={compact ? 'money money-compact' : 'money'}>
      <span className="money-value">{fmtMoney(value)}</span>
      <span className="money-label">{MONEY_LABEL}</span>
    </span>
  );
}
