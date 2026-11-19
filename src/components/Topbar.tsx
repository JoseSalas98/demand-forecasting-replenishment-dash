// Barra superior: etiqueta de dinero global (constitución II.4) y botón de idioma (spec 003).
import { t } from '../i18n';
import { LangToggle } from './LangToggle';

export function Topbar() {
  return (
    <div className="topbar">
      <span className="chip" title={t().common.moneyNoteTitle}>
        <span className="chip-icon" aria-hidden="true">$</span>
        {t().common.moneyNote}
      </span>
      <LangToggle />
    </div>
  );
}
