// Panel lateral con los 4 módulos (diseno/guia_visual.md §3).
import type { ComponentType } from 'react';
import { useData } from '../data';
import { fmtDate } from '../format';
import { t } from '../i18n';
import { hashFor, type RouteName } from '../router';
import type { Meta, Scenario } from '../types';
import { IconDollar, IconGrid, IconHelp, IconHome, IconPulse } from './Icons';

const MODULES: { key: 'home' | 'segments' | 'item' | 'impact' | 'guide'; path: string; routes: RouteName[]; Icon: ComponentType }[] = [
  { key: 'home', path: '/', routes: ['home'], Icon: IconHome },
  { key: 'segments', path: '/segmentacion', routes: ['segmentation', 'segment'], Icon: IconGrid },
  { key: 'item', path: '/articulo', routes: ['item', 'itemDetail', 'playground'], Icon: IconPulse },
  { key: 'impact', path: '/impacto', routes: ['impact'], Icon: IconDollar },
  { key: 'guide', path: '/guia', routes: ['guide'], Icon: IconHelp },
];

export function Sidebar({ route, scenario, itemId }: { route: RouteName; scenario: Scenario; itemId?: string }) {
  const meta = useData<Meta>('meta.json');
  return (
    <aside className="sidebar">
      <div className="logo">DDR</div>
      <div className="logo-sub">{t().nav.logoSub}</div>
      <nav aria-label={t().nav.modules}>
        {MODULES.map(({ key, path, routes, Icon }) => {
          const active = routes.includes(route);
          // El módulo Artículo recuerda el artículo abierto
          const target = key === 'item' && itemId ? `/articulo/${itemId}` : path;
          return (
            <a key={key} className={`nav-item${active ? ' active' : ''}`} href={hashFor(target, scenario)} aria-current={active ? 'page' : undefined}>
              <Icon />
              {t().nav[key]}
            </a>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <a href={hashFor('/datos', scenario)} className={route === 'sources' ? 'active' : ''}>{t().nav.sources}</a>
        {meta.status === 'ready' && <div>{t().nav.exported(fmtDate(meta.data.exported_at))}</div>}
      </div>
    </aside>
  );
}
