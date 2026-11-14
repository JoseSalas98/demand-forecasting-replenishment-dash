// Panel lateral con los 4 módulos (diseno/guia_visual.md §3).
import type { ComponentType } from 'react';
import { useData } from '../data';
import { MONEY_LABEL } from '../format';
import { hashFor, type RouteName } from '../router';
import type { Meta, Scenario } from '../types';
import { IconDollar, IconGrid, IconHelp, IconHome, IconPulse } from './Icons';

const MODULES: { key: string; label: string; path: string; routes: RouteName[]; Icon: ComponentType }[] = [
  { key: 'home', label: 'Inicio', path: '/', routes: ['home'], Icon: IconHome },
  { key: 'seg', label: 'Segmentación', path: '/segmentacion', routes: ['segmentation', 'segment'], Icon: IconGrid },
  { key: 'item', label: 'Artículo', path: '/articulo', routes: ['item', 'playground'], Icon: IconPulse },
  { key: 'impact', label: 'Impacto', path: '/impacto', routes: ['impact'], Icon: IconDollar },
  { key: 'guide', label: 'Cómo usar', path: '/guia', routes: ['guide'], Icon: IconHelp },
];

export function Sidebar({ route, scenario, itemId }: { route: RouteName; scenario: Scenario; itemId?: string }) {
  const meta = useData<Meta>('meta.json');
  return (
    <aside className="sidebar">
      <div className="logo">DDR</div>
      <div className="logo-sub">Demand Driven Replenishment</div>
      <nav aria-label="Módulos">
        {MODULES.map(({ key, label, path, routes, Icon }) => {
          const active = routes.includes(route);
          // El módulo Artículo recuerda el artículo abierto
          const target = key === 'item' && itemId ? `/articulo/${itemId}` : path;
          return (
            <a key={key} className={`nav-item${active ? ' active' : ''}`} href={hashFor(target, scenario)} aria-current={active ? 'page' : undefined}>
              <Icon />
              {label}
            </a>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <a href={hashFor('/datos', scenario)} className={route === 'sources' ? 'active' : ''}>Origen de los datos</a>
        {meta.status === 'ready' && <div>Exportado el {meta.data.exported_at.slice(0, 10)}</div>}
        <div>Todo valor monetario está {MONEY_LABEL}.</div>
      </div>
    </aside>
  );
}
