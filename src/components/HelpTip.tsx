// Ícono "?" con la definición y la unidad de un término del glosario (src/glossary.ts).
// Se abre al pasar el cursor, con el foco del teclado o con un clic (pantallas táctiles).
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { GLOSSARY_BY_ID } from '../glossary';
import { hashFor } from '../router';
import type { Scenario } from '../types';

/** `extra` agrega el valor real del grupo elegido bajo la definición. */
export function HelpTip({ id, scenario = 'A', extra }: { id: string; scenario?: Scenario; extra?: ReactNode }) {
  const entry = GLOSSARY_BY_ID[id];
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const tipId = useId();
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pinned) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setPinned(false);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [pinned]);

  if (!entry) return null;
  const show = open || pinned;
  return (
    <span
      className="help"
      ref={wrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          setPinned(false);
        }
      }}
    >
      <button
        type="button"
        className="help-btn"
        aria-label={`Qué es ${entry.term}`}
        aria-describedby={show ? tipId : undefined}
        aria-expanded={show}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setPinned((p) => !p);
        }}
      >
        ?
      </button>
      {show && (
        <span className="help-pop" role="tooltip" id={tipId}>
          <strong>{entry.term}</strong>
          <span>{entry.definition}</span>
          {entry.unit && <span className="help-unit">Unidad: {entry.unit}</span>}
          {extra && <span className="help-extra">{extra}</span>}
          <a href={hashFor(`/guia/glosario/${entry.id}`, scenario)} onMouseDown={(e) => e.preventDefault()}>Ver en el glosario →</a>
        </span>
      )}
    </span>
  );
}
