// Exceso evitado al 95 % por segmento (lectura de curvas), en barras horizontales.
import { fmtMoney } from '../../format';
import { CELL_COLOR } from '../../theme';
import type { Cell, Scenario, Segments } from '../../types';
import { Money } from '../Money';

const CELLS: Cell[] = ['AX', 'AY', 'AZ'];

export function SegmentBars({ segments, scenario }: { segments: Segments['segments']; scenario: Scenario }) {
  const vals = CELLS.map((c) => segments[c].reading[scenario].saving_excess95);
  const max = Math.max(...vals.map(Math.abs), 1);
  return (
    <div>
      {CELLS.map((c, i) => (
        <div key={c} className="seg-bar-row">
          <strong>{c}</strong>
          <div className="seg-bar-wrap">
            <div className="seg-bar" style={{ width: `${Math.max(2, (Math.abs(vals[i]) / max) * 80)}%`, background: CELL_COLOR[c] }} />
            <span>{fmtMoney(vals[i])}</span>
          </div>
        </div>
      ))}
      <div className="small" style={{ marginTop: 10 }}>
        Venta recuperada:{' '}
        {CELLS.map((c, i) => (
          <span key={c}>
            {i > 0 && ' · '}
            {c} <Money value={segments[c].reading[scenario].recovered_sales_same_excess} compact />
          </span>
        ))}
      </div>
    </div>
  );
}
