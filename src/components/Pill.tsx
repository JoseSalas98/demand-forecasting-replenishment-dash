// Píldoras (botón o enlace) para filtros y selectores.
import type { ReactNode } from 'react';

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
