'use client';

import Link from 'next/link';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useLensData} from './lens-provider';
import {readAsset} from '@/lib/data-client';
import {categories,companyFacts,companyHref,found,money,number,parseFacts,text,title,type Company,type Fact} from '@/lib/lens-data';
import './company-card.css';
import {industryGroup} from '@/lib/industry-style';

const badgePaths={
  website:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c4 5 4 13 0 18 M12 3c-4 5-4 13 0 18',
  social:'M8 12l8-5 M8 12l8 5 M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M22 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M22 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  jobs:'M3 7h18v14H3z M8 7V3h8v4 M3 12h18 M10 12v3h4v-3',
  news:'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h3 M8 18h8'
};
function BadgeIcon({kind}:{kind:keyof typeof badgePaths}){return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={badgePaths[kind]}/></svg>;}

export function CompanyCard({company:c,highlight}:{company:Company;highlight:(value:string)=>ReactNode}){
  const {language,t,selected,toggle,metadata,facts,prefetchFacts}=useLensData();
  const local=(en:string,no:string)=>language==='no'?no:en;
  const card=useRef<HTMLElement>(null);
  const [loadedFacts,setLoadedFacts]=useState<Fact[]>([]);
  // Load real annual records only as a financial card enters the viewport. The
  // shared asset cache deduplicates this against profile/hover prefetch requests.
  useEffect(()=>{
    const element=card.current;
    if(!element||!found(c,'financials'))return;
    let disposed=false;
    const load=()=>{void readAsset('/data/facts/'+c.org_number+'.json',metadata.version).then(parseFacts).then(records=>{if(!disposed)setLoadedFacts(records);}).catch(()=>{});};
    if(!('IntersectionObserver' in window)){load();return()=>{disposed=true;};}
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();load();}},{rootMargin:'100px'});
    observer.observe(element);
    return()=>{disposed=true;observer.disconnect();};
  },[c.org_number,c.sections.financials,metadata.version]);
  const records=companyFacts(c,loadedFacts.length?loadedFacts:facts,'financials');
  const annual=new Map<string,number>();
  for(const fact of records){const year=text(fact.year),amount=number(fact.amount);if(text(fact.metric)==='revenue'&&/^\d{4}$/.test(year)&&amount!==null&&!annual.has(year))annual.set(year,amount);}
  const years=[...annual.entries()].sort(([a],[b])=>Number(a)-Number(b)).slice(-5);
  const values=years.map(([,value])=>value),low=Math.min(...values),span=Math.max(...values)-low||1;
  const points=values.map((value,index)=>`${3+index/(values.length-1)*82},${27-(value-low)/span*22}`).join(' ');
  const active=selected.includes(c.org_number),name=title(c.legal_name)||t('Not found');
  const trend=values.length>=2?values[values.length-1]-values[values.length-2]:null;
  const coverage=categories.filter(category=>found(c,category)).length;
  const count=Number(metadata.evidenceCounts[c.org_number]||0).toLocaleString(language==='no'?'nb-NO':'en-US');
  const amount=found(c,'financials')?number(c.latest_revenue):null;
  const industry=found(c,'identity')?((language==='en'?text(c.industry_text_en):'')||text(c.industry_text)):'';
  return <article ref={card} className="result-card lens-company-card" data-industry={industryGroup(c)} onMouseEnter={()=>prefetchFacts(c.org_number)} onFocusCapture={()=>prefetchFacts(c.org_number)}>
    <div className="lens-card-heading"><span className="lens-card-avatar" aria-hidden="true">{name.charAt(0)}</span><h2><Link className="lens-card-link" href={companyHref(c)} onKeyDown={event=>{if(event.key===' '){event.preventDefault();if(!event.repeat)event.currentTarget.click();}}}>{highlight(name)}</Link></h2><span className="lens-card-arrow" aria-hidden="true">→</span></div>
    <p className="lens-card-meta">{highlight(c.org_number)}{text(c.legal_form)&&` · ${text(c.legal_form)}`} · {highlight(found(c,'identity')?title(c.municipality)||t('Not found'):t('Not found'))}</p>
    <p className="lens-card-industry">{highlight(industry||t('Not found'))}{language==='en'&&text(c.industry_text_en)&&text(c.industry_text)&&found(c,'identity')&&<small lang="nb">{text(c.industry_text)}</small>}</p>
    <div className="lens-card-financial"><div><span className="lens-card-label">{t('Latest Revenue')}</span><div className="lens-card-amount" title={amount!==null?money(amount,c.latest_year,c.currency):undefined}>{amount===null?<span className="missing">{t('Not found')}</span>:<>{text(c.currency)||'NOK'} {new Intl.NumberFormat(language==='no'?'nb-NO':'en-US',{notation:'compact',maximumFractionDigits:2}).format(amount)}</>}</div>{amount!==null&&text(c.latest_year)&&<small className="lens-card-year">FY {text(c.latest_year)}</small>}</div>{years.length>=2&&<svg className="lens-card-sparkline" width="88" height="34" viewBox="0 0 88 34" role="img" aria-label={`${t('Revenue')}: ${years.map(([year,value])=>`${year}: ${money(value,undefined,c.currency)}`).join('; ')}`}><path d={`M3 31 L${points.replaceAll(' ', ' L')} L85 31 Z`} fill="currentColor" opacity=".12"/><path d="M3 31h82" stroke="currentColor" opacity=".2"/><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}{trend!==null&&<span className="revenue-trend" data-trend={trend>0?'up':trend<0?'down':'flat'} role="img" aria-label={`${local('Revenue','Omsetning')} ${years[years.length-2][0]}–${years[years.length-1][0]}: ${trend>0?local('increased','økte'):trend<0?local('decreased','falt'):local('unchanged','uendret')}`}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={trend>0?'M5 18 19 4M9 4h10v10':trend<0?'M5 6l14 14M9 20h10V10':'M4 12h16m-6-6 6 6-6 6'}/></svg></span>}</div>
    <div className="lens-card-evidence"><div><span>{count} {local('sourced facts','kildebelagte opplysninger')}</span><small>{coverage}/{categories.length} {local('sections','avsnitt')}</small></div><div className="lens-card-meter" role="meter" aria-label={local('Sections with evidence','Avsnitt med dokumentasjon')} aria-valuemin={0} aria-valuemax={categories.length} aria-valuenow={coverage}><span style={{width:`${coverage/categories.length*100}%`}}/></div></div>
    <div className="lens-card-badges">{c.website_verified===1&&<span className="lens-card-badge" data-kind="website"><BadgeIcon kind="website"/>{local('Verified website','Verifisert nettside')}</span>}{(['social','jobs','news'] as const).filter(category=>found(c,category)).map(category=><span className="lens-card-badge" data-kind={category} key={category}><BadgeIcon kind={category}/>{t(category==='social'?'Social':category==='jobs'?'Jobs':'News')}</span>)}</div>
    <div className="lens-card-actions"><button type="button" className={`button ${active?'selected':'secondary'} card-compare-action`} aria-label={`${active?local('Remove from comparison','Fjern fra sammenligning'):local('Compare','Sammenlign')}: ${name}`} aria-pressed={active} disabled={!active&&selected.length>=3} title={!active&&selected.length>=3?t('Maximum 3 companies'):undefined} onClick={event=>{event.stopPropagation();toggle(c.org_number);}}>{active?local('✓ Added','✓ Lagt til'):selected.length>=3?local('Limit reached','Grensen er nådd'):local('+ Compare','+ Sammenlign')}</button></div>
  </article>;
}
