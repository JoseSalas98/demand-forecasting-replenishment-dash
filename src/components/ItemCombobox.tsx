// Selector de artículo con escritura y despliegue (patrón combobox de WAI-ARIA). La lupa y la flecha
// dejan ver que es un buscador y una lista (spec 003); `big` es la versión destacada del estado vacío.
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { fmtNumber } from '../format';
import { t } from '../i18n';
import { cellName } from '../naming';
import { hashFor } from '../router';
import type { CatalogItem, Scenario } from '../types';

const MAX_SHOWN = 400; // la lista completa se pinta por tramos para no crear 3.049 nodos de golpe

export function ItemCombobox({ items, forecastOnly, scenario, big = false, autoFocus = false }: { items: CatalogItem[]; forecastOnly: boolean; scenario: Scenario; big?: boolean; autoFocus?: boolean }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

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
    <div className={`combo${big ? ' combo-lg' : ''}${open ? ' open' : ''}`} ref={wrap}>
      <svg className="combo-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
      <input
        ref={input}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
        aria-label={t().combo.label}
        placeholder={big ? t().combo.placeholder : t().combo.placeholderShort}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKey}
      />
      <button
        type="button"
        className="combo-toggle"
        tabIndex={-1}
        aria-label={t().combo.open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setOpen(!open);
          input.current?.focus();
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <ul id={listId} role="listbox">
          <li className="count" role="presentation">
            {t().combo.count(fmtNumber(matches.length), fmtNumber(pool.length), forecastOnly)}
            {matches.length > MAX_SHOWN ? t().combo.capped(fmtNumber(MAX_SHOWN)) : ''}
          </li>
          {shown.length === 0 && <li className="count" role="presentation">{t().combo.noMatch(q.trim())}</li>}
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
              <span className="hint">{i.forecasted ? `${cellName(i.cell)} · ${t().combo.withForecast}` : cellName(i.cell)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
