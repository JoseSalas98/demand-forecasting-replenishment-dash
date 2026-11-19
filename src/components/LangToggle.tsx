// Botón ES | EN (spec 003): cambia el idioma de toda la interfaz y lo recuerda en el navegador.
import { LANGS, setLang, t, useLang } from '../i18n';

export function LangToggle({ big = false }: { big?: boolean }) {
  const lang = useLang();
  return (
    <div className={`lang-toggle${big ? ' big' : ''}`} role="group" aria-label={t().common.language}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          className={`lang-btn${l === lang ? ' active' : ''}`}
          aria-pressed={l === lang}
          title={t().common.langName[l]}
          onClick={() => setLang(l)}
        >
          {big ? t().common.langName[l] : l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
