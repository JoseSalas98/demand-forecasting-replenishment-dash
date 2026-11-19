// Cómo usar (specs 002 US4 y 003): para qué sirve el tablero, para qué sirve cada sección y glosario en tabla.
import { useEffect, useState } from 'react';
import { ModuleHeader } from '../components/ModuleHeader';
import { fmtNumber } from '../format';
import { glossary, glossaryEntry, GLOSSARY_GROUPS, groupName, type GlossaryEntry } from '../glossary';
import { t } from '../i18n';
import { hashFor } from '../router';

const MODULES: { key: 'home' | 'segments' | 'item' | 'impact'; icon: string; path: string }[] = [
  { key: 'home', icon: '⌂', path: '/' },
  { key: 'segments', icon: '▦', path: '/segmentacion' },
  { key: 'item', icon: '∿', path: '/articulo' },
  { key: 'impact', icon: '$', path: '/impacto' },
];

export function GuideView({ term }: { term?: string }) {
  const g = t().guide;
  const [q, setQ] = useState(() => (term ? glossaryEntry(term)?.term ?? '' : ''));
  // Un enlace a un término (#/guia/glosario/:term) lleva directo al glosario
  useEffect(() => {
    if (term) document.getElementById('glosario')?.scrollIntoView?.();
  }, [term]);
  const query = q.trim().toLowerCase();
  const all = glossary();
  const match = (e: GlossaryEntry) => !query || `${e.term} ${e.definition} ${e.technical}`.toLowerCase().includes(query);
  const groups = GLOSSARY_GROUPS.map((grp) => ({ grp, rows: all.filter((e) => e.group === grp && match(e)) })).filter((x) => x.rows.length);
  const p = g.purpose;

  return (
    <>
      <ModuleHeader title={g.title} subtitle={g.subtitle} />
      <div className="card">
        <h2>{g.purposeTitle}</h2>
        <p className="prose">
          {p[0]}<b>{p[1]}</b>{p[2]}<b>{p[3]}</b>{p[4]}<b>{p[5]}</b>{p[6]}<b>{p[7]}</b>{p[8]}
        </p>
        <div className="strip">
          <span><b>10</b>{g.stripStores}</span>
          <span><b>2011–2016</b>{g.stripYears}</span>
          <span><b>{fmtNumber(3049)}</b>{g.stripCatalog}</span>
          <span><b className="accent">517</b>{g.stripForecast}</span>
        </div>
        <p className="small muted">{g.purposeNote}</p>
      </div>

      <div className="grid-2 section">
        {MODULES.map((m) => {
          const mod = g.modules[m.key];
          return (
            <div key={m.key} className="card mod">
              <div className="card-head">
                <h2><span aria-hidden="true">{m.icon}</span> {mod.title}</h2>
                <a className="btn small" href={hashFor(m.path, 'A')}>{g.goTo(mod.title)} <span aria-hidden="true">→</span></a>
              </div>
              <p><b>{g.purposeLabel}</b> {mod.purpose}</p>
              <ul className="steps">{mod.steps.map((st) => <li key={st}>{st}</li>)}</ul>
            </div>
          );
        })}
      </div>

      <div className="card section" id="glosario">
        <div className="card-head">
          <h2>{g.glossary}</h2>
          <input className="glo-search" placeholder={g.search} aria-label={g.searchAria} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {groups.length === 0 ? (
          <p className="small muted">{g.noTerms}</p>
        ) : (
          <div className="table-wrap">
            <table className="glo-tbl">
              <colgroup><col style={{ width: '22%' }} /><col /><col style={{ width: '22%' }} /></colgroup>
              <thead><tr><th className="left">{g.colTerm}</th><th className="left">{g.colMeaning}</th><th className="left">{g.colTechnical}</th></tr></thead>
              <tbody>
                {groups.flatMap(({ grp, rows }) => [
                  <tr key={grp} className="glo-grp"><th colSpan={3} className="left">{groupName(grp)}</th></tr>,
                  ...rows.map((e) => (
                    <tr key={e.id} id={`term-${e.id}`}>
                      <td className="left glo-t">{e.term}</td>
                      <td className="left">{e.definition}{e.unit && <span className="muted">{g.unit(e.unit)}</span>}</td>
                      <td className="left glo-tec">{e.technical}</td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
