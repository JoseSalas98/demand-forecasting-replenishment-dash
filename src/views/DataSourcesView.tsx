import { ModuleHeader } from '../components/ModuleHeader';
import { LoadError, Loading } from '../components/StateViews';
import { useData } from '../data';
import { fmtDate, na } from '../format';
import { t } from '../i18n';
import type { Meta } from '../types';

export function DataSourcesView() {
  const meta = useData<Meta>('meta.json');
  if (meta.status === 'error') return <LoadError error={meta.error} />;
  if (meta.status !== 'ready') return <Loading />;
  const m = meta.data;
  const pending = m.pending ?? [];
  const s = t().sources;
  return (
    <>
      <ModuleHeader
        title={s.title}
        subtitle={s.subtitle(fmtDate(m.exported_at), m.exporter_version)}
      />
      <div className="card">
        <h2>{s.read}</h2>
        <div className="table-wrap">
          <table>
            <thead><tr>{s.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {m.sources.map((src) => (
                <tr key={src.name}>
                  <td>{src.name}</td>
                  <td>{src.path}</td>
                  <td>{src.saved_at ?? src.frozen_at ?? (src.max_day ? s.untilDay(String(src.max_day)) : na())}</td>
                  <td title={src.sha256 ?? src.manifest_sha256}>{(src.sha256 ?? src.manifest_sha256 ?? '—').slice(0, 12)}</td>
                  <td>{src.check}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid-2 section">
        <div className="card">
          <h2>{s.pending}</h2>
          {pending.length === 0 ? (
            <p className="muted">{s.none}</p>
          ) : (
            <ul>{pending.map((p) => <li key={p.name}>{p.name} — {p.reason}</li>)}</ul>
          )}
        </div>
        <div className="card">
          <h2>{s.versions}</h2>
          <p>{Object.entries(m.versions).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
        </div>
      </div>
      <div className="card section">
        <h2>{s.checks}</h2>
        {s.asExported && <p className="small muted">{s.asExported}</p>}
        <ul>
          {m.checks.map((c) => (
            <li key={c.name}>{c.passed ? '✔' : '✘'} {c.name}{c.detail ? ` — ${c.detail}` : ''}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
