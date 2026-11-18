import { fmtMoney } from '../format';

/** Cifra monetaria. El rótulo "a precio de venta, no es margen" va una sola vez en la barra superior (constitución II.4). */
export function Money({ value }: { value: number | null | undefined; compact?: boolean }) {
  return <span className="money">{fmtMoney(value)}</span>;
}
