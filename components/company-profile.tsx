'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowIcon } from '@/components/arrow-icon';
import { CopyLink, ExportActions } from '@/components/export-actions';
import './company-profile-layout.css';
import { useLensData } from '@/components/lens-provider';
import { DataState, Missing } from '@/components/lens-ui';
import {CountUp,useProfileSections} from './profile-motion';
import {industryGroup} from '@/lib/industry-style';
import { categories, companyFacts, date, evidence, financialFact, found, jobs, locations, money, number, percent, safeUrl, factDate, missingCheck, socialUrl, text, title, type Company, type Fact } from '@/lib/lens-data';

const sectionIcons: Record<string, string> = { identity: 'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h4', financials: 'M3 20h18 M6 16V10 M12 16V4 M18 16V7', people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75', locations: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0', website: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c4 5 4 13 0 18 M12 3c-4 5-4 13 0 18', social: 'M8 12l8-5 M8 12l8 5 M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M22 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M22 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0', jobs: 'M3 7h18v14H3z M8 7V3h8v4 M3 12h18 M10 12v3h4v-3', news: 'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h3 M8 18h8' };
function SectionIcon({category}:{category:string}) { return <svg className="section-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sectionIcons[category] || sectionIcons.identity}/></svg>; }
const sectionNames: Record<string, string> = { identity: 'Identity', financials: 'Financials', people: 'People', locations: 'Locations', website: 'Website', social: 'Social', jobs: 'Jobs', news: 'News' };
const metrics = [ ['revenue', 'Revenue'], ['operating_result', 'Operating result'], ['profit_before_tax', 'Profit before tax'], ['annual_result', 'Annual result'], ['assets', 'Total assets'], ['equity', 'Equity'], ['debt', 'Debt'] ] as const;
const metricLabels: Record<string,string> = Object.fromEntries(metrics);
const factIcons:Record<string,string>={municipality:sectionIcons.locations,industry_text:'M3 21V9l6 3V8l6 3V3h6v18z M7 17h1 M12 17h1 M17 17h1',ceo:sectionIcons.people,employees:sectionIcons.people,latest_revenue:'M20 8c0 3-16 3-16 0s16-3 16 0 M4 8v5c0 3 16 3 16 0V8 M4 13v5c0 3 16 3 16 0v-5',latest_profit:sectionIcons.financials,revenue_growth:sectionIcons.financials};
function FactIcon({field}:{field:string}){return <svg className="profile-metric-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={factIcons[field]||sectionIcons.identity}/></svg>;}
function Section({title,children,id}:{title:string;children:ReactNode;id?:string}){
  const icons:Record<string,string>={'overview':'identity','key-facts':'identity','website-social':'website','history':'financials','recorded-gaps':'news'};
  return <section className="ledger-section" id={id}><h2><SectionIcon category={icons[id||'']||id||'identity'}/>{title}</h2>{children}</section>;
}
function compactMoney(value: unknown, currency: unknown) {
  const amount = number(value);
  if (amount === null) return '';
  const magnitude = Math.abs(amount);
  const divisor = magnitude >= 1e9 ? 1e9 : magnitude >= 1e6 ? 1e6 : magnitude >= 1e3 ? 1e3 : 1;
  const suffix = divisor === 1e9 ? ' bn' : divisor === 1e6 ? ' m' : divisor === 1e3 ? ' k' : '';
  return `${text(currency) || 'NOK'} ${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(amount / divisor)}${suffix}`;
}
const label = (v: unknown) => metricLabels[text(v)] || title(text(v).replace(/_/g,' ')).replace(/\b(Of|The|And|In|To|Before)\b/g, x => x.toLowerCase());
function SourceMarker({company,facts,name}:{company:Company;facts:Fact[];name:string}) {
  const {openSource,t}=useLensData();
  if(!facts.length)return null;
  return <button type="button" className="profile-source-marker" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:44,minHeight:44,padding:8,verticalAlign:'middle',border:0,background:'transparent',color:'inherit',textDecoration:'none'}} onClick={()=>openSource(company,facts)} aria-label={`${t('Source')}: ${name}`} title={`${t('Source')}: ${name}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7"/></svg></button>;
}
function SourceButton({company,facts}:{company:Company;facts:Fact[]}) {
  return <SourceMarker company={company} facts={facts} name={label(facts[0]?.metric)||label(facts[0]?.field)||title(company.legal_name)}/>;
}
const integer = (value: unknown) => number(value) === null ? '' : new Intl.NumberFormat('en-GB', {maximumFractionDigits:0}).format(number(value)!);
function Display({ value }: { value: unknown }) { return text(value) && text(value) !== 'Not found' ? <>{text(value)}</> : <Missing />; }
function Unchecked({ company, category }: { company: Company; category: string }) {
  const { language, facts } = useLensData();
  if (hasSectionFacts(company, facts, category)) return null;
  return <div className="section-empty"><p className="missing">{sectionReason(company, facts, category, language === 'no')}</p></div>;
}
function Checked({ company, facts, category }: { company: Company; facts: Fact[]; category: string }) {
  const { language } = useLensData();
  const records = facts.filter(f => f.org_number === company.org_number && f.category === category);
  if (!records.length && !found(company, category)) return null;
  return <div className="section-check-context"><p className="section-checked muted text-xs">{sectionReason(company, facts, category, language === 'no')}{records.length > 0 && <SourceButton company={company} facts={records} />}</p></div>;
}
function FactRow({ company, name, value, facts = [] }: { company: Company; name: string; value: ReactNode; facts?: Fact[] }) {
  const { t, language } = useLensData();
  const stamp = facts[0] ? factDate(facts[0], language === 'no') : '';
  return <div className="data-row"><dt>{t(name)}</dt><dd className="min-w-0 break-words"><span className="profile-fact-row-value">{value}{stamp && <small className="muted profile-fact-date">{stamp}</small>}</span><SourceMarker company={company} facts={facts} name={t(name)} /></dd></div>;
}
function Field({ company, facts, field, name, category, format = text }: { company: Company; facts: Fact[]; field: string; name: string; category: string; format?: (v: unknown) => string }) {
  const { language } = useLensData();
  const industry = field === 'industry_text' && language === 'en';
  if (!found(company, category) || !text(company[field])) return <FactRow company={company} name={name} value={<span className="missing">{missingCheck(company, category, language === 'no')}</span>} />;
  return <FactRow company={company} name={name} value={<><Display value={found(company, category) ? (industry ? text(company.industry_text_en) || text(company[field]) : format(company[field])) : ''} />{industry && found(company,category) && text(company.industry_text_en) && text(company.industry_text) && <small className="muted" style={{display:'block'}} lang="nb">{text(company.industry_text)}</small>}</>} facts={found(company, category) && text(company[field]) ? evidence(company, facts, field) : []} />;
}
function Sparkline({company, facts, metric}:{company:Company;facts:Fact[];metric:'revenue'|'annual_result'}) {
  const {t, openSource,language} = useLensData();
  const years = [...new Set(companyFacts(company,facts,'financials').filter(f => text(f.metric) === metric && /^\d{4}$/.test(text(f.year)) && number(f.amount) !== null).map(f => text(f.year)))].sort((a,b) => Number(a)-Number(b)).slice(-3);
  const records = years.flatMap(year => { const f = financialFact(company,facts,metric,year); return f ? [f] : []; });
  if (!records.length) return null;
  const values = records.map(f => number(f.amount)!);
  const low = Math.min(...values), high = Math.max(...values), span = high-low || 1;
  const points = values.map((value,index) => `${values.length === 1 ? 80 : 8+index/(values.length-1)*144},${40-(value-low)/span*32}`).join(' ');
  const trend=values.length>=2?values[values.length-1]-values[values.length-2]:null;
  const name = t(metric === 'revenue' ? 'Revenue' : 'Annual Result');
  const description = records.map(f => `${text(f.year)}: ${money(f.amount,undefined,company.currency)}`).join('; ');
  return <button type="button" className="profile-sparkline" style={{display:'block',width:'100%',minHeight:44,padding:0,border:0,background:'transparent',color:'var(--revenue-green, #087451)',textAlign:'left'}} onClick={() => openSource(company,records)} aria-label={`${t('Source')}: ${name}. ${description}`}><svg viewBox="0 0 160 48" width="160" height="120" style={{width:'100%',height:120,display:'block'}} role="img" aria-label={`${name}: ${description}`}><path d="M8 44h144" stroke="currentColor" opacity=".16"/>{values.length > 1 && <path d={`M8 44 L${points.replaceAll(' ', ' L')} L152 44 Z`} fill="currentColor" opacity=".12"/>}{values.length > 1 && <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}{values.map((value,index) => <circle key={index} cx={values.length === 1 ? 80 : 8+index/(values.length-1)*144} cy={40-(value-low)/span*32} r="2.5" fill="currentColor"/>)}</svg>{trend!==null&&<span className="revenue-trend" data-trend={trend>0?'up':trend<0?'down':'flat'} role="img" aria-label={`${name}: ${trend>0?(language==='no'?'økte':'increased'):trend<0?(language==='no'?'falt':'decreased'):(language==='no'?'uendret':'unchanged')} ${years[years.length-2]}–${years[years.length-1]}`}>{trend>0?'↗':trend<0?'↘':'→'} </span>}<span className="muted" style={{fontSize:11}}>{years[0]}{years.length > 1 ? `–${years[years.length-1]}` : ''} · {t('Source')}</span></button>;
}
function Financials({ company: c, facts }: { company: Company; facts: Fact[] }) {
  const { t, openSource, language } = useLensData();
  const [activeBar, setActiveBar] = useState('');
  if (!found(c, 'financials')) return <Unchecked company={c} category="financials" />;
  const financials = companyFacts(c, facts, 'financials');
  const years = [...new Set(financials.filter(f => metrics.some(([metric]) => metric === text(f.metric)) && /^\d{4}$/.test(text(f.year)) && number(f.amount) !== null).map(f => text(f.year)))].sort((a, b) => Number(b) - Number(a));
  const chartYears = [...years].reverse();
  const chartFacts = financials.filter(f => ['revenue', 'annual_result'].includes(text(f.metric)) && number(f.amount) !== null && /^\d{4}$/.test(text(f.year)));
  const high = Math.max(...chartFacts.map(f => number(f.amount)!), 0);
  const low = Math.min(...chartFacts.map(f => number(f.amount)!), 0);
  const span = high - low || 1;
  const zero = high / span * 100;
  return <>

    <figure className="financial-chart mb-7 rounded-md border border-[#dde5e0] p-4 sm:p-5" aria-labelledby="financial-chart-title">
      <figcaption id="financial-chart-title" className="mb-4 font-medium">{t('Revenue')} & {t('Annual Result')} · {text(c.currency) || 'NOK'}</figcaption>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs muted mb-5"><span><span className="inline-block h-2 w-2 mr-2 rounded-sm bg-[#087f5b]" />{t('Revenue')}</span><span><span className="inline-block h-2 w-2 mr-2 rounded-sm profile-result-legend" />{t('Annual Result')}</span></div>
      {chartFacts.length ? <div className="profile-column-chart"><div className="profile-chart-baseline" style={{top:`${zero}%`}} aria-hidden="true"><span>0</span></div>{chartYears.map(year => <div className="profile-chart-year" key={year}><div className="profile-chart-pair">{(['revenue','annual_result'] as const).map(metric => {
        const f = financialFact(c, facts, metric, year);
        const value = f ? number(f.amount) : null;
        if (!f || value === null) return <span key={metric} className="profile-chart-empty" />;
        const id = `${year}-${metric}`;
        const description = `${year} · ${t(metric === 'revenue' ? 'Revenue' : 'Annual result')}: ${money(value, undefined, c.currency)}`;
        return <button type="button" key={metric} className={`profile-chart-bar profile-chart-${metric}${value<0?' profile-chart-negative':''}`} style={{top:`${value >= 0 ? (high-value)/span*100 : zero}%`,height:value===0?'0px':`max(4px, ${Math.abs(value)/span*100}%)`,minHeight:0}} title={description} aria-label={description} aria-pressed={activeBar===id} onClick={()=>setActiveBar(id)} onFocus={()=>setActiveBar(id)}><span className="profile-chart-tooltip">{description}</span></button>;
      })}</div><span className="profile-chart-year-label">{year}</span></div>)}</div> : <span className="missing">{missingCheck(c, 'financials', language === 'no')}</span>}
    </figure>
      {activeBar && <p className="profile-chart-selection" role="status">{(() => { const [year,...parts] = activeBar.split('-'); const f = financialFact(c,facts,parts.join('-'),year); return f ? <>{year} · {t(text(f.metric)==='revenue'?'Revenue':'Annual result')}: {money(f.amount,undefined,c.currency)} <button type="button" className="source-button" onClick={()=>openSource(c,[f])}>{t('Source')}</button></> : null; })()}</p>}
    {years.length ? <div className="profile-annual-table"><h3>{t('Annual financial figures')} · {text(c.currency)||'NOK'}</h3><table><thead><tr><th scope="col">{t('Year')}</th><th scope="col">{t('Metric')}</th><th scope="col">{t('Amount')}</th><th scope="col">{t('Source')}</th></tr></thead>{years.map(year=><tbody key={year}>{metrics.map(([metric,name],index)=>{const f=financialFact(c,facts,metric,year);return <tr key={metric} className={index===0?'profile-year-start':undefined}><th scope="row">{year}</th><td>{t(name)}</td><td>{f ? <Display value={money(f.amount,undefined,c.currency)}/> : <span className="missing">{missingCheck(c, 'financials', language === 'no')}</span>}</td><td>{f&&<SourceButton company={c} facts={[f]}/>}</td></tr>;})}</tbody>)}</table></div> : <p className="missing">{missingCheck(c, 'financials', language === 'no')}</p>}
  </>;
}
function People({ company: c, facts }: { company: Company; facts: Fact[] }) {
  if (!found(c, 'people')) return <Unchecked company={c} category="people" />;
  const people = companyFacts(c, facts, 'people');
  const included = new Set([...(text(c.ceo) ? evidence(c, facts, 'ceo') : []), ...(text(c.board_chair) ? evidence(c, facts, 'board_chair') : [])]);
  return <dl><Field company={c} facts={facts} field="ceo" name="CEO" category="people" format={title} /><Field company={c} facts={facts} field="board_chair" name="Board Chair" category="people" format={title} />{people.filter(f => !included.has(f)).map((f, i) => <FactRow key={i} company={c} name={label(f.field) || 'Person'} value={<Display value={title(f.value)} />} facts={[f]} />)}</dl>;
}
function WebSection({ company: c, facts, category }: { company: Company; facts: Fact[]; category: 'website' | 'social' }) {
  const {language,openSource}=useLensData();
  if (!found(c, category)) return <Unchecked company={c} category={category} />;
  const items = companyFacts(c, facts, category);
  const website = category === 'website' ? safeUrl(c.website) : '';
  const link = (url: string, name: string) => <a className="profile-value-link break-all" href={url} target="_blank" rel="noopener noreferrer">{name} <ArrowIcon direction="external"/></a>;
  return <>{category === 'website' && website && <div className="profile-website-actions"><a className="button secondary" href={website} target="_blank" rel="noopener noreferrer">{language === 'no' ? 'Besøk nettsted' : 'Visit website'}</a>{evidence(c,facts,'website').length>0 && <button type="button" className="button secondary" onClick={()=>openSource(c,evidence(c,facts,'website'))}>{language === 'no' ? 'Dokumentasjon for nettsted' : 'Website evidence'}</button>}</div>}<dl>{category === 'website' && <FactRow company={c} name="Website" value={website ? link(website, website) : <span className="missing">{missingCheck(c, category, language === 'no')}</span>} facts={website ? evidence(c, facts, 'website') : []} />}{items.filter(f => !(website && safeUrl(f.value) === website)).map((f, i) => <FactRow key={i} company={c} name={label(f.field) || sectionNames[category]} value={(category === 'social' ? socialUrl(f) : safeUrl(f.value)) ? link(category === 'social' ? socialUrl(f) : safeUrl(f.value), category === 'social' ? text(f.field) || text(f.value) : text(f.value)) : <Display value={f.value} />} facts={[f]} />)}{category === 'social' && !items.length && <span className="missing">{missingCheck(c, category, language === 'no')}</span>}</dl></>;
}
function compactSectionState(c:Company,facts:Fact[],category:string,no:boolean) {
  const records=facts.filter(f=>f.org_number===c.org_number&&f.category===category);
  if(records.length){
    const retrieved=records.map(f=>text(f.retrieved_at)).filter(v=>v&&Number.isFinite(Date.parse(v))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
    return retrieved ? `✓ ${new Intl.DateTimeFormat(no?'nb-NO':'en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(retrieved))}` : (no?'✓ Dokumentert':'✓ Sourced');
  }
  const state=text(c.sections[category]);
  return state==='not_found' ? (no?'Ingen funnet':'None found') : state==='ambiguous' ? (no?'Holdt tilbake':'Withheld') : (no?'Kunne ikke sjekke':"Couldn't check");
}
function sectionDate(c: Company, category: string) {
  const checked = c.checked_at;
  return checked && typeof checked === 'object' && !Array.isArray(checked) ? text((checked as Record<string, unknown>)[category]) : '';
}
function hasSectionFacts(c: Company, facts: Fact[], category: string) {
  return facts.some(f => f.org_number === c.org_number && f.category === category);
}
function sectionReason(c: Company, facts: Fact[], category: string, no: boolean) {
  const records = facts.filter(f => f.org_number === c.org_number && f.category === category);
  if (records.length && text(c.sections[category]) !== 'not_found') {
    const retrieved = records.map(f => text(f.retrieved_at)).filter(value => value && Number.isFinite(Date.parse(value))).sort((a,b) => Date.parse(b) - Date.parse(a))[0];
    return retrieved ? `${no ? 'Sjekket' : 'Checked'} ${date(retrieved)}` : (no ? 'Sjekkdato utilgjengelig' : 'Check date unavailable');
  }
  if (text(c.sections[category]) === 'not_found' || (found(c, category) && !records.length)) return missingCheck(c, category, no);
  const checked = sectionDate(c, category);
  const reasons: Record<string, [string, string]> = {
    source_error: ["Couldn't be checked – source unreachable", 'Kunne ikke sjekkes – kilden var utilgjengelig'],
    blocked: ['Not checked – site blocks automated access', 'Ikke sjekket – nettstedet blokkerer automatisert tilgang'],
    ambiguous: ["Withheld – couldn't confirm it's this company", 'Holdt tilbake – kunne ikke bekrefte at det er dette selskapet'],
  };
  const reason = reasons[text(c.sections[category])];
  const explanation = reason ? reason[no ? 1 : 0] : (no ? 'Ingen dokumentasjon tilgjengelig' : 'No evidence available');
  if (!checked || !Number.isFinite(Date.parse(checked))) return `${explanation} · ${no ? 'Sjekkdato utilgjengelig' : 'Check date unavailable'}`;
  return `${explanation} · ${date(checked)}`;
}
function Profile({ company: c, facts }: { company: Company; facts: Fact[] }) {
  const { t, openSource, language, selected, toggle } = useLensData();
  const no = language === 'no';
  const local = (en: string, nb: string) => no ? nb : en;
  const sourced = (value: ReactNode, sources: Fact[], name: string) => <span className="profile-sourced-value" style={{overflowWrap:'anywhere'}}>{value}{sources.length ? <SourceMarker company={c} facts={sources} name={name}/> : null}</span>;
  const identitySources = (field: string) => identity ? evidence(c, facts, field) : [];
  const {items:pageSections,active:activeSection,navigate}=useProfileSections(c.org_number,language);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('ncl-recent') || '[]');
      const ids = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string' && /^\d{9}$/.test(id)) : [];
      localStorage.setItem('ncl-recent', JSON.stringify([c.org_number, ...ids.filter(id => id !== c.org_number)].slice(0, 8)));
    } catch {}
  }, [c.org_number]);
  const identity = found(c, 'identity');
  const financial = found(c, 'financials');
  const website = found(c, 'website') ? safeUrl(c.website) : '';
  const places = locations(c, facts);
  const workplaceFacts = companyFacts(c,facts,'identity').filter(f => text(f.field).toLowerCase() === 'registered workplaces (count)' && /^\d+$/.test(text(f.value)));
  // Count facts may store numeric strings; the shared number()/integer()
  // helpers intentionally accept numbers only. Convert after validating above.
  const parsedWorkplaceCount = workplaceFacts[0] ? Number(text(workplaceFacts[0].value)) : null;
  const workplaceCount = parsedWorkplaceCount !== null && Number.isSafeInteger(parsedWorkplaceCount) ? parsedWorkplaceCount : null;
  const ads = jobs(c, facts);
  const news = companyFacts(c, facts, 'news').filter(f => text(f.value)).sort((a, b) => {
    const timestamp = (v: unknown) => { const n = Date.parse(text(v)); return Number.isFinite(n) ? n : -Infinity; };
    return timestamp(b.reporting_period) - timestamp(a.reporting_period);
  });
  const summary = [
    { field: 'municipality', name: 'Municipality', value: identity ? title(c.municipality) : '' },
    { field: 'industry_text', name: 'Industry', value: identity ? (no ? text(c.industry_text) : text(c.industry_text_en) || text(c.industry_text)) : '' },
    { field: 'employees', name: 'Employees', value: identity ? integer(c.employees) : '' },
    { field: 'ceo', name: 'CEO', value: found(c, 'people') ? title(c.ceo) : '' },
    { field: 'founded', name: 'Founded', value: identity && text(c.founded) ? date(c.founded) : '' },
    { field: 'legal_form', name: 'Legal Form', value: identity ? text(c.legal_form) : '' },
  ].map(part => ({ ...part, sources: evidence(c, facts, part.field) }));
  const sectionIds: Record<string, string> = { identity: 'key-facts', financials: 'financials', people: 'people', locations: 'locations', website: 'website', social: 'social', jobs: 'jobs', news: 'news' };
  const history = Array.isArray(c.history) ? c.history.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry)).filter(entry => text(entry.date) && text(entry.field) && (text(entry.old_value) || text(entry.new_value))) : [];
  const heroSummary=[identity&&text(c.municipality)?`${title(c.municipality)}${local('-based company','-basert selskap')}`:'',identity?(no?text(c.industry_text):text(c.industry_text_en)||text(c.industry_text)):'',found(c,'people')&&text(c.ceo)?`CEO ${title(c.ceo)}`:'',financial&&number(c.latest_revenue)!==null?`${local('Revenue','Omsetning')} ${money(c.latest_revenue,undefined,c.currency)}${evidence(c,facts,'latest_revenue')[0] ? ` (${factDate(evidence(c,facts,'latest_revenue')[0],no)})` : ''}`:''].filter(Boolean).join(' · ');
  return <div className="company-profile-surface" data-industry={industryGroup(c)}>
    <div className="profile-header-band" data-industry={industryGroup(c)}><header className="profile-sticky-header"><span className="profile-hero-avatar" data-industry={industryGroup(c)} aria-hidden="true">{title(c.legal_name).charAt(0)||'·'}</span><div className="eyebrow">{t('Company Profile')}</div>
      <div className="profile-title-row"><h1 className="break-words">{sourced(title(c.legal_name) || <Missing />, identity ? companyFacts(c, facts, 'identity').filter(f => /^(legal name|registered legal name|company name|name)$/i.test(text(f.field))) : [], t('Registered Legal Name'))}</h1></div>
      <div className="profile-identity-row">
        <span className="profile-identity-pill">{sourced(`Org. ${c.org_number}`,identitySources('org_number'),t('Organisation Number'))}</span>
        {identity && text(c.legal_form) && <span className="profile-identity-pill">{sourced(text(c.legal_form),identitySources('legal_form'),t('Legal Form'))}</span>}
        {text(c.status)&&!['not found','unknown','unavailable','not_available','n/a','null','undefined'].includes(text(c.status).toLowerCase())&&<span className="profile-identity-pill">{t('Status')}: {sourced(text(c.status),identitySources('status'),t('Status'))}</span>}
        {workplaceCount !== null && <span className="profile-identity-pill">{local('Registered workplaces','Registrerte arbeidssteder')}: {sourced(<>{integer(workplaceCount)}{workplaceFacts[0]&&<small className="muted">{factDate(workplaceFacts[0],no)}</small>}</>,workplaceFacts,local('Registered workplaces','Registrerte arbeidssteder'))}</span>}
        {website && <span className="profile-identity-pill"><a href={website} target="_blank" rel="noopener noreferrer" aria-label={local('Visit website','Besøk nettsted')}>{t('Website')} <ArrowIcon direction="external"/></a></span>}
      </div>
      {heroSummary&&<p className="profile-hero-summary">{heroSummary}</p>}
      <div className="profile-website-actions">
        {website && <a className="button secondary" href={website} target="_blank" rel="noopener noreferrer">{local('Visit website','Besøk nettsted')}</a>}
        {companyFacts(c,facts,'social').filter(f=>socialUrl(f)).map((f,i)=><span key={i}><a href={socialUrl(f)} target="_blank" rel="noopener noreferrer" aria-label={`${local('Visit','Besøk')} ${text(f.field)||t('Social')}`}>{text(f.field)||t('Social')} <ArrowIcon direction="external"/></a><SourceMarker company={c} facts={[f]} name={text(f.field)||t('Social')}/></span>)}
      </div>
    </header>
    </div>
    <div className="profile-content-grid">
    <aside className="profile-sidebar" aria-label={local('Company summary','Selskapssammendrag')}>
      <nav className="profile-page-nav profile-sidebar-card" aria-label={local('On this page','På denne siden')}><h2>{local('On this page','På denne siden')}</h2><div className="profile-nav-track">{pageSections.length>0&&<span className="profile-nav-dot" aria-hidden="true" style={{top:24+Math.max(0,pageSections.findIndex(item=>item.id===activeSection))*48}}/>}{pageSections.map(({id,name})=><a key={id} href={`#${id}`} onClick={event=>navigate(event,id)} aria-current={activeSection===id?'location':undefined}>{name}</a>)}</div></nav>
      <section className="profile-sidebar-card profile-key-card"><h2>{local('Key figures','Nøkkeltall')}</h2><dl className="profile-key-figures">{[
        {field:'latest_revenue',name:'Latest Revenue',value:financial?compactMoney(c.latest_revenue,c.currency):'',full:money(c.latest_revenue,undefined,c.currency)},
        {field:'latest_profit',name:'Annual Result',value:financial?compactMoney(c.latest_profit,c.currency):'',full:money(c.latest_profit,undefined,c.currency)},
        {field:'revenue_growth',name:'Revenue Change',value:financial?percent(c.revenue_growth):'',full:percent(c.revenue_growth)},
        {field:'employees',name:'Employees',value:identity?integer(c.employees):'',full:integer(c.employees)},
      ].map(part=>({...part,year:evidence(c,facts,part.field)[0]?factDate(evidence(c,facts,part.field)[0],no):''})).map(part=><div className="profile-key-figure" key={part.field}><dt><FactIcon field={part.field}/>{t(part.name)}</dt><dd><span className="profile-key-value" title={part.full}>{part.value&&number(c[part.field])!==null?<CountUp value={number(c[part.field])!} formatted={part.value} format={value=>part.field==='employees'?new Intl.NumberFormat('en-GB',{maximumFractionDigits:0}).format(value):part.field==='revenue_growth'?percent(value):compactMoney(value,c.currency)}/>:<span className="missing">{missingCheck(c, part.field==='employees'?'identity':'financials', no)}</span>}</span><SourceMarker company={c} facts={part.value?evidence(c,facts,part.field):[]} name={`${t(part.name)} — ${part.full}`}/></dd>{part.value&&part.year&&<small className="muted">{part.year}</small>}</div>)}</dl></section>
    <section className="coverage-bar" aria-labelledby="coverage-bar-heading" style={{marginBottom:24}}><h2 id="coverage-bar-heading"><span className="profile-coverage-desktop">{local('Data coverage','Datadekning')}</span><span className="profile-coverage-mobile">{local('Coverage','Dekning')}</span></h2><div className="profile-coverage-grid">{categories.map(category => <details key={category} className={`coverage-segment coverage-${hasSectionFacts(c,facts,category) ? 'available' : text(c.sections[category])}`} style={{borderTop:`4px solid ${hasSectionFacts(c,facts,category) ? 'var(--primary)' : 'var(--rule, #dde5e0)'}`,padding:'8px 10px',minWidth:0}}><summary title={`${t(sectionNames[category])}: ${sectionReason(c,facts,category,no)}`}><span className="coverage-section-name"><SectionIcon category={category}/>{t(sectionNames[category])}</span><span className={`badge ${hasSectionFacts(c,facts,category) ? 'found' : 'unchecked'}`} title={sectionReason(c,facts,category,no)} style={{whiteSpace:'nowrap',marginTop:8}}>{compactSectionState(c,facts,category,no)}</span></summary><p className="text-xs muted" style={{overflowWrap:'anywhere',marginTop:8}}>{sectionReason(c,facts,category,no)}</p><a href={`#${sectionIds[category]}`}>{local('View section', 'Se avsnitt')} <ArrowIcon/></a></details>)}</div></section>
      {financial&&<section className="profile-sidebar-card profile-trend-card"><h2>{local('Financial trend','Finansiell utvikling')}</h2><Sparkline company={c} facts={facts} metric="revenue"/><a className="profile-financial-link" href="#financials">{local('See financials ↓','Se regnskap ↓')}</a></section>}
      <div className="profile-sidebar-actions"><button type="button" className={`button ${selected.includes(c.org_number)?'selected':'secondary'}`} aria-pressed={selected.includes(c.org_number)} disabled={!selected.includes(c.org_number)&&selected.length>=3} onClick={()=>toggle(c.org_number)}>{selected.includes(c.org_number)?local('✓ Added','✓ Lagt til'):selected.length>=3?local('Limit reached','Grensen er nådd'):local('+ Compare','+ Sammenlign')}</button><CopyLink url={`/company?org=${c.org_number}`}/>{evidence(c,facts,'website').length>0&&<button type="button" className="button secondary" onClick={()=>openSource(c,evidence(c,facts,'website'))}>{local('Website evidence','Dokumentasjon for nettsted')}</button>}</div>
    </aside><div className="profile-main-column">
      <Section title={local('Overview','Oversikt')} id="overview"><dl className="profile-top-facts profile-summary-grid">{summary.map(part=><div key={part.field} className={`profile-overview-${part.field}`}><dt className="small-label"><FactIcon field={part.field}/>{t(part.name)}</dt><dd>{sourced(part.field==='employees'&&part.value?<span className="profile-overview-number"><CountUp value={number(c.employees)!} formatted={part.value} format={integer}/></span>:part.field==='industry_text'?<span className="profile-industry-value" title={part.value}>{part.value||<span className="missing">{missingCheck(c, 'identity', no)}</span>}</span>:part.value||<span className="missing">{missingCheck(c, part.field==='ceo'?'people':'identity', no)}</span>,part.sources,t(part.name))}{part.value&&part.sources[0]&&<small className="muted">{factDate(part.sources[0],no)}</small>}{part.field==='industry_text'&&!no&&text(c.industry_text_en)&&text(c.industry_text)&&<small className="muted" lang="nb">{text(c.industry_text)}</small>}</dd></div>)}</dl></Section>
      <Section title={local('Key facts','Nøkkelopplysninger')} id="key-facts"><Checked company={c} facts={facts} category="identity" />{identity ? <dl><FactRow company={c} name="Organisation Number" value={c.org_number} facts={evidence(c, facts, 'org_number')} /><Field company={c} facts={facts} field="legal_form" name="Legal Form" category="identity" /><Field company={c} facts={facts} field="municipality" name="Municipality" category="identity" format={title} /><Field company={c} facts={facts} field="industry_text" name="Industry" category="identity" /><Field company={c} facts={facts} field="industry_code" name="Industry Code" category="identity" /><Field company={c} facts={facts} field="founded" name="Founded" category="identity" format={v => text(v) ? date(v) : ''} /><Field company={c} facts={facts} field="employees" name="Employees" category="identity" format={integer} /></dl> : <Unchecked company={c} category="identity" />}</Section>
      <Section title={t('People')} id="people"><Checked company={c} facts={facts} category="people" /><People company={c} facts={facts} /></Section>
      <Section title={t('Financials')} id="financials"><Checked company={c} facts={facts} category="financials" /><Financials company={c} facts={facts} /></Section>
      <Section title={t('Locations')} id="locations"><Checked company={c} facts={facts} category="locations" />{places.length || hasSectionFacts(c,facts,'locations') ? <><p className="muted text-sm">{t('Number of Locations')}: {integer(places.length)}</p>{places.length ? <ul className="list-none p-0 m-0">{places.map((place, i) => <li className="data-row" key={i}><span className="break-words min-w-0">{place.value}<small className="muted" style={{display:'block'}}>{place.roles.map(role => role === 'Business address' ? local('Business address','Forretningsadresse') : local('Registered workplace','Registrert arbeidssted')).join(' / ')}</small></span><SourceButton company={c} facts={place.facts.length ? place.facts : evidence(c, facts, 'address')} /></li>)}</ul> : <span className="missing">{missingCheck(c, 'locations', no)}</span>}</> : <Unchecked company={c} category="locations" />}</Section>
      <Section title={t('Website & Social')} id="website-social"><div id="website" className="profile-section-anchor"><h3>{t('Website')}</h3><Checked company={c} facts={facts} category="website" /><WebSection company={c} facts={facts} category="website" /></div><div id="social" className="profile-section-anchor"><h3 className="mt-6">{t('Social')}</h3><Checked company={c} facts={facts} category="social" /><WebSection company={c} facts={facts} category="social" /></div></Section>
      <Section title={t('Jobs')} id="jobs"><Checked company={c} facts={facts} category="jobs" />{found(c, 'jobs') ? <>{ads.length ? <><p className="muted text-sm">{t('Number of Job Ads')}: {integer(ads.length)}</p><ul className="list-none m-0 p-0">{ads.map((f, i) => { const [occupation, ...place] = text(f.value).split('·'); return <li key={i} className="border-b border-[#dde5e0] py-4 last:border-0"><h3 className="mb-2">{occupation.trim() || <Missing />}</h3><p className="muted text-sm mb-1">{t('Place')}: <Display value={title(place.join('·').trim())} /></p><p className="muted text-sm mb-0">{factDate(f,no)}</p><SourceButton company={c} facts={[f]} /></li>; })}</ul></> : <span className="missing">{missingCheck(c, 'jobs', no)}</span>}</> : <Unchecked company={c} category="jobs" />}</Section>
      <Section title={t('News')} id="news"><Checked company={c} facts={facts} category="news" />{found(c, 'news') ? news.length ? <ul className="list-none m-0 p-0">{news.map((f, i) => <li key={i} className="border-b border-[#dde5e0] py-4 last:border-0"><p className="muted text-xs mb-2">{factDate(f,no)}</p><h3 className="mb-0 break-words">{text(f.value)}</h3><SourceButton company={c} facts={[f]} /></li>)}</ul> : <span className="missing">{missingCheck(c, 'news', no)}</span> : <Unchecked company={c} category="news" />}</Section>
      {history.length > 0 && <Section title={t('What changed')} id="history"><ol className="change-timeline">{history.map((entry, i) => <li key={i}><time dateTime={text(entry.date)}>{date(entry.date)}</time><p>{label(entry.field)}: {text(entry.old_value) || t('Not found')} <ArrowIcon/> {text(entry.new_value) || t('Not found')}</p>{safeUrl(entry.source_url) && <a href={safeUrl(entry.source_url)} target="_blank" rel="noopener noreferrer">{t('Source')} <ArrowIcon direction="external"/></a>}</li>)}</ol></Section>}
      <Section title={local("What we couldn't find", 'Det vi ikke fant')} id="recorded-gaps"><p className="muted">{local('Missing information is part of the record, not proof of absence. These are the gaps recorded by the dataset.', 'Manglende informasjon er en del av dokumentasjonen, ikke bevis på fravær. Dette er manglene registrert i datasettet.')}</p><ul>{categories.filter(category=>!hasSectionFacts(c,facts,category)).map(category=><li key={category}><strong>{t(sectionNames[category])}</strong><p className="muted">{sectionReason(c,facts,category,no)}</p></li>)}</ul>{categories.every(category=>hasSectionFacts(c,facts,category))&&<p className="muted">{local('All sections have sourced records.','Alle avsnitt har kildebelagte opplysninger.')}</p>}</Section>
      <div className="profile-exports"><ExportActions companies={[c]} facts={facts}/></div>
    </div></div>
  </div>;
}

export function CompanyProfile() {
  const params = useSearchParams();
  const org = params.get('org')?.trim() || '';
  const { companies, facts, loading, error, settledCompanyOrg, retry, t, language } = useLensData();
  const [backHref,setBackHref] = useState('/');
  useEffect(()=>{try{const saved=sessionStorage.getItem('ncl-search-url');if(saved && (saved==='/' || saved.startsWith('/?')))setBackHref(saved);}catch{}},[]);
  if (error && settledCompanyOrg === org && !loading) return <div className="empty-state" role="alert"><h2>{language==='no'?'Kunne ikke laste dette selskapet':"Couldn't load this company"}</h2><button className="button" onClick={retry}>{language==='no'?'Prøv igjen':'Retry'}</button></div>;
  if (loading || (/^\d{9}$/.test(org) && settledCompanyOrg !== org)) return <div className="empty-state skeleton-state" role="status" aria-label={t('Loading Company Records…')}><span>{t('Loading Company Records…')}</span><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div>;
  const company = /^\d{9}$/.test(org) ? companies.find(c => c.org_number === org) : undefined;
  return <div><nav className="profile-breadcrumb" aria-label={t('Company Profile')}><Link className="back-link" href={backHref}><ArrowIcon direction="left"/> {t('Back to Company Search')}</Link></nav>{company ? <><Profile key={org} company={company} facts={facts} /></> : <div className="empty-state"><h1 className="text-3xl">{t(!org ? 'Choose a Company' : !/^\d{9}$/.test(org) ? 'Check the Organisation Number' : 'Company not found')}</h1><p>{t(!org ? 'Search for a company to view its profile and evidence.' : !/^\d{9}$/.test(org) ? 'An organisation number must contain nine digits.' : 'No company matches this organisation number in the current records.')}</p><Link className="button" href="/">{t('Search Companies')}</Link></div>}</div>;
}
