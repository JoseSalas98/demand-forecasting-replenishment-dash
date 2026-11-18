// Barra superior con la etiqueta de dinero global (constitución II.4).
import { MONEY_NOTE } from '../format';

export function Topbar() {
  return (
    <div className="topbar">
      <span className="chip" title="Todo valor en dinero es unidades × precio de venta; no descuenta costos.">
        <span className="chip-icon" aria-hidden="true">$</span>
        {MONEY_NOTE}
      </span>
    </div>
  );
}
