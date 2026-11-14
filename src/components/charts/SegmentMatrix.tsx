// Matriz ABC × XYZ de los artículos con clase XYZ (segmentation.json). La intensidad del cian
// codifica el conteo; el texto siempre va en el color de texto (constitución VI).
import { fmtNumber } from '../../format';
import type { Segmentation } from '../../types';
import { Money } from '../Money';

const ROWS = ['A', 'B', 'C'];
const COLS = ['X', 'Y', 'Z'];
const MIN_ALPHA = 0.12;
const MAX_ALPHA = 0.7;

export function SegmentMatrix({ data, selected, onSelect }: { data: Segmentation; selected: string; onSelect: (cell: string) => void }) {
  const byCell = new Map(data.matrix.map((m) => [m.cell, m]));
  const max = Math.max(...data.matrix.map((m) => m.n_items), 1);
  return (
    <div>
      <div className="matrix" role="grid" aria-label="Matriz ABC por XYZ">
        <span />
        {COLS.map((c) => <span key={c} className="axis">{c}</span>)}
        {ROWS.map((r) => (
          <div key={r} style={{ display: 'contents' }} role="row">
            <span className="axis">{r}</span>
            {COLS.map((c) => {
              const cell = `${r}${c}`;
              const m = byCell.get(cell);
              const alpha = m ? MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * (m.n_items / max) : 0;
              return (
                <button
                  key={cell}
                  type="button"
                  role="gridcell"
                  className={`matrix-cell${selected === cell ? ' selected' : ''}`}
                  style={{ ['--alpha' as string]: alpha }}
                  aria-pressed={selected === cell}
                  aria-label={`${cell}: ${m ? fmtNumber(m.n_items) : 0} artículos`}
                  onClick={() => onSelect(cell)}
                >
                  <span className="cell-name">{cell}</span>
                  <span className="cell-count">{m ? fmtNumber(m.n_items) : '0'}</span>
                  {m && <Money value={m.spend} compact />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>
        {fmtNumber(data.total_items)} artículos con clase XYZ · {fmtNumber(data.excluded_no_xyz)} sin clase XYZ no se incluyen.
        Debajo del conteo, el gasto de train de la celda.
      </p>
    </div>
  );
}
