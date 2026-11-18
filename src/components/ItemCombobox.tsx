// Selector de artículo con escritura y despliegue (patrón combobox de WAI-ARIA).
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { fmtNumber } from '../format';
import { cellName } from '../naming';
import { hashFor } from '../router';
import type { CatalogItem, Scenario } from '../types';

const MAX_SHOWN = 400; // la lista completa se pinta por tramos para no crear 3.049 nodos de golpe

export function ItemCombobox({ items, forecastOnly, scenario }: { items: CatalogItem[]; forecastOnly: boolean; scenario: Scenario }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  const pool = useMemo(() => (forecastOnly ? items.filter((i) => i.forecasted) : items), [items, forecastOnly]);
  const matches = useMemo(() => {
    const query = q.trim().toUpperCase();
    return query ? pool.filter((i) => i.item_id.toUpperCase().includes(query)) : pool;
  }, [pool, q]);
  const shown = matches.slice(0, MAX_SHOWN);

  useEffect(() => setActive(0), [q, forecastOnly]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    setQ('');
    window.location.hash = hashFor(`/articulo/${id}`, scenario, forecastOnly);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && shown[active]) go(shown[active].item_id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="combo" ref={wrap}>
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
        aria-label="Buscar artículo"
        placeholder="Buscar artículo…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {open && (
        <ul id={listId} role="listbox">
          <li className="count" role="presentation">
            {fmtNumber(matches.length)} de {fmtNumber(pool.length)} {forecastOnly ? 'con pronóstico' : 'del catálogo'}
            {matches.length > MAX_SHOWN ? ` · se muestran ${fmtNumber(MAX_SHOWN)}; escribe para filtrar` : ''}
          </li>
          {shown.length === 0 && <li className="count" role="presentation">“{q.trim()}” no coincide con ningún artículo.</li>}
          {shown.map((i, k) => (
            <li
              key={i.item_id}
              id={`${listId}-${k}`}
              role="option"
              aria-selected={k === active}
              className={k === active ? 'active' : ''}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(i.item_id)}
            >
              <span>{i.item_id}</span>
              <span className="hint">{i.forecasted ? `${cellName(i.cell)} · con pronóstico` : cellName(i.cell)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
