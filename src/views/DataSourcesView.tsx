import { ModuleHeader } from '../components/ModuleHeader';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { NOT_AVAILABLE } from '../format';
import type { Meta } from '../types';

export function DataSourcesView() {
  const meta = useData<Meta>('meta.json');
  if (meta.status === 'error') return <LoadError error={meta.error} />;
  if (meta.status !== 'ready') return <Loading />;
  const m = meta.data;
  const pending = m.pending ?? [];
  return (
    <>
      <ModuleHeader
        title="Origen de los datos"
        subtitle={`Exportado el ${m.exported_at} (exportador ${m.exporter_version}). El sitio solo lee esta copia versionada; las cifras no se recalculan.`}
      />
      <div className="card">
        <h2>Fuentes leídas</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fuente</th><th>Ruta</th><th>Fecha</th><th>Hash</th><th>Verificación</th></tr></thead>
            <tbody>
              {m.sources.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.path}</td>
                  <td>{s.saved_at ?? s.frozen_at ?? (s.max_day ? `hasta el día ${s.max_day}` : NOT_AVAILABLE)}</td>
                  <td title={s.sha256 ?? s.manifest_sha256}>{(s.sha256 ?? s.manifest_sha256 ?? '—').slice(0, 12)}</td>
                  <td>{s.check}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid-2 section">
        <div className="card">
          <h2>Pendientes</h2>
          {pending.length === 0 ? (
            <p className="muted">ninguno</p>
          ) : (
            <ul>{pending.map((p) => <li key={p.name}>{p.name} — {p.reason}</li>)}</ul>
          )}
        </div>
        <div className="card">
          <h2>Versiones</h2>
          <p>{Object.entries(m.versions).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
        </div>
      </div>
      <div className="card section">
        <h2>Verificaciones</h2>
        <ul>
          {m.checks.map((c) => (
            <li key={c.name}>{c.passed ? '✔' : '✘'} {c.name}{c.detail ? ` — ${c.detail}` : ''}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
