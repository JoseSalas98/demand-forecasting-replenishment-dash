// Encabezado de módulo: título, subtítulo y controles a la derecha (guía visual §3).
import type { ReactNode } from 'react';

export function ModuleHeader({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="module-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
      {children && <div className="module-controls">{children}</div>}
    </header>
  );
}
