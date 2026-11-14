// Píldoras (botón o enlace) y el selector A/B que cambia `?esc` del hash actual.
import type { ReactNode } from 'react';
import { withScenario } from '../router';
import type { Scenario } from '../types';

export const SCENARIO_LABEL: Record<Scenario, string> = { A: 'A · a un paso', B: 'B · encadenado' };

export function Pill({ active, onClick, href, children, small = false }: {
  active: boolean;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
  small?: boolean;
}) {
  const cls = `pill${active ? ' active' : ''}${small ? ' small' : ''}`;
  if (href) {
    return <a className={cls} href={href} aria-pressed={active}>{children}</a>;
  }
  return (
    <button type="button" className={cls} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

/** Píldoras A/B: A y B nunca se muestran juntos en una cifra (constitución II.3). */
export function ScenarioPills({ scenario, small = false }: { scenario: Scenario; small?: boolean }) {
  const hash = typeof window === 'undefined' ? '#/' : window.location.hash || '#/';
  return (
    <div className="module-controls" role="group" aria-label="Escenario">
      {(['A', 'B'] as Scenario[]).map((s) => (
        <Pill key={s} active={s === scenario} href={withScenario(hash, s)} small={small}>
          {SCENARIO_LABEL[s]}
        </Pill>
      ))}
    </div>
  );
}
