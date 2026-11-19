import { t } from '../i18n';

export function Loading() {
  return <p className="muted">{t().common.loading}</p>;
}

/** Error de carga visible: dice qué faltó y que el dato no está disponible. */
export function LoadError({ error }: { error: Error }) {
  return (
    <div className="error-box">
      <strong>{t().common.dataNA}</strong> {error.message}
    </div>
  );
}

/** Fuente que el proyecto de datos aún no publica (meta.pending o archivo ausente). */
export function Pending({ what }: { what: string }) {
  return <div className="note pending">{t().common.pending(what)}</div>;
}
