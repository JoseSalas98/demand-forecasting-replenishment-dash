import { NOT_AVAILABLE } from '../format';

export function Loading() {
  return <p className="muted">Cargando…</p>;
}

/** Error de carga visible: dice qué faltó y que el dato no está disponible. */
export function LoadError({ error }: { error: Error }) {
  return (
    <div className="error-box">
      <strong>Dato {NOT_AVAILABLE}.</strong> {error.message}
    </div>
  );
}

/** Fuente que el proyecto de datos aún no publica (meta.pending o archivo ausente). */
export function Pending({ what }: { what: string }) {
  return <div className="note pending">No disponible: el proyecto de datos aún no publica {what}.</div>;
}
