export type Company = Record<string, unknown> & { org_number: string; sections: Record<string, unknown> };
export type Fact = Record<string, unknown> & { org_number: string; category: string };
export const categories = ['identity','financials','people','locations','website','social','jobs','news'] as const;
export type Category = typeof categories[number];
export const text = (v: unknown): string => typeof v === 'string' ? v.trim() : typeof v === 'number' && Number.isFinite(v) ? String(v) : '';
export const number = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;
export function title(v: unknown) {
  let index = 0;
  return text(v).replace(/\p{L}+/gu, word => {
    const lower = word.toLocaleLowerCase('nb-NO');
    const first = index++ === 0;
    if (['og', 'i', 'på', 'av', 'for', 'med', 'til'].includes(lower)) return first ? lower[0].toLocaleUpperCase('nb-NO') + lower.slice(1) : lower;
    if (/^\p{Lu}{2,3}$/u.test(word)) return word;
    return lower[0].toLocaleUpperCase('nb-NO') + lower.slice(1);
  });
}
export function address(v: unknown) { return text(v).replace(/\b[\p{Lu}][\p{Lu}\s-]+$/u, x => title(x)); }
export function safeUrl(v: unknown) { try { const u = new URL(text(v)); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
export function factDate(f: Fact | undefined, no = false) { if (!f) return ''; const period = text(f.reporting_period) || text(f.year); return period || (text(f.retrieved_at) ? `${no ? 'Sjekket' : 'Checked'} ${date(f.retrieved_at)}` : ''); }
// Missing-data checks must use the supplied category check, never a retrieval or financial date.
export function missingCheck(c: Company, category: string, no = false): string {
  const checks = c.checked_at;
  const checked = checks && typeof checks === 'object' && !Array.isArray(checks) ? text((checks as Record<string, unknown>)[category]) : '';
  if (!checked || !Number.isFinite(Date.parse(checked))) return no ? 'Sjekkdato utilgjengelig' : 'Check date unavailable';
  return `${no ? 'Sjekket' : 'Checked'} ${date(checked)} – ${no ? 'ingenting funnet' : 'nothing found'}`;
}
export function socialUrl(f: Fact) {
  const url = safeUrl(f.value); if (!url) return '';
  const u = new URL(url), host = u.hostname.toLowerCase().replace(/^www\./, '');
  const platforms: Record<string,string[]> = {facebook:['facebook.com','fb.com'],linkedin:['linkedin.com'],instagram:['instagram.com'],twitter:['twitter.com','x.com'],youtube:['youtube.com','youtu.be'],tiktok:['tiktok.com']};
  const field = text(f.field).toLowerCase();
  const expected = Object.entries(platforms).find(([name]) => field.includes(name));
  const allowed = expected ? expected[1] : Object.values(platforms).flat();
  return u.pathname !== '/' && allowed.some(domain => host === domain || host.endsWith(`.${domain}`)) ? url : '';
}
export function status(c: Company, category: string) { const s = text(c.sections[category]); return s === 'available' ? 'Found' : s === 'not_found' ? 'Not found' : 'Could not check'; }
export const found = (c: Company, category: string) => status(c, category) === 'Found';
export function money(v: unknown, year?: unknown, currency: unknown = 'NOK') { const n=number(v); return n === null ? 'Not found' : `${text(currency) || 'NOK'} ${new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n)}${text(year) ? ` (${text(year)})` : ''}`; }
export function percent(v: unknown) { const n=number(v); return n === null ? 'Not found' : `${n > 0 ? '+' : ''}${new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n*100)}%`; }
export function date(v: unknown) { const s=text(v); const d=new Date(s); return s && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(d) : s || 'Not found'; }
export const companyHref = (c: Company) => `/company?org=${encodeURIComponent(c.org_number)}`;
export function companyFacts(c: Company, facts: Fact[], category?: string) { return facts.filter(f => f.org_number===c.org_number && (!category || f.category===category) && found(c,f.category)); }
export function financialFact(c: Company, facts: Fact[], metric: string, year: unknown) { return companyFacts(c,facts,'financials').find(f => text(f.metric)===metric && text(f.year)===text(year) && number(f.amount)!==null); }
export function growthFacts(c: Company, facts: Fact[]) { const year=text(c.latest_year); const first=financialFact(c,facts,'revenue',year); const prior=/^\d{4}$/.test(year) ? financialFact(c,facts,'revenue',String(Number(year)-1)) : undefined; return first && prior ? [first,prior] : []; }
const aliases: Record<string,string[]> = {legal_form:['legal form','organisasjonsform'],municipality:['municipality','kommune'],industry_code:['industry code','industry','næringskode'],industry_text:['industry','industry text','næring'],founded:['founded','stiftelsesdato'],employees:['employees','number of employees'],ceo:['ceo','daglig leder'],board_chair:['board chair','styreleder'],website:['website','nettside'],org_number:['organisation number','organization number','org number'],address:['address','registered address']};
export function evidence(c: Company, facts: Fact[], field: string): Fact[] { if(field==='latest_revenue') { const f=financialFact(c,facts,'revenue',c.latest_year); return f?[f]:[]; } if(field==='latest_profit') { const f=financialFact(c,facts,'annual_result',c.latest_year); return f?[f]:[]; } if(field==='revenue_growth') return growthFacts(c,facts); const names=aliases[field] || [field.replaceAll('_',' ')]; return companyFacts(c,facts).filter(f=>names.includes(text(f.field).toLowerCase())); }
export type Location = { value: string; fact: Fact | undefined; facts: Fact[]; roles: string[] };
export function locations(c: Company, facts: Fact[]): Location[] {
  const entries = facts.filter(f => f.org_number === c.org_number && text(f.value) && !/count|antall/i.test(text(f.field)) && (f.category === 'locations' || (f.category === 'identity' && /address|adresse|workplace|arbeidssted/i.test(text(f.field)))));
  if (!found(c, 'locations') && !entries.length) return [];
  const key = (value: string) => value.normalize('NFKC').toLocaleLowerCase('nb-NO').replace(/[\p{P}\p{Z}\s]+/gu, '');
  const merged = new Map<string, Location>();
  const add = (value: string, role: string, fact?: Fact) => {
    const id = key(value);
    if (!id) return;
    let place = merged.get(id);
    if (!place) { place = { value: address(value).replace(/\s+/g, ' '), fact, facts: [], roles: [] }; merged.set(id, place); }
    if (!place.roles.includes(role)) place.roles.push(role);
    if (fact && !place.facts.includes(fact)) { place.facts.push(fact); place.fact ??= fact; }
  };
  if (text(c.address)) add(text(c.address), 'Business address');
  for (const fact of entries) add(text(fact.value), /workplace|arbeidssted/i.test(text(fact.field)) ? 'Registered workplace' : 'Business address', fact);
  return [...merged.values()];
}
export function jobs(c: Company, facts: Fact[]) { return companyFacts(c,facts,'jobs').filter(f=>text(f.value)); }
export function parseCompanies(raw: unknown): Company[] { if(!Array.isArray(raw)) throw new Error('Company data must be an array.'); const seen=new Set<string>(); return raw.flatMap(v=>{ if(!v || typeof v!=='object' || Array.isArray(v)) return []; const id=text(v.org_number); if(!/^\d{9}$/.test(id)||seen.has(id)) return []; seen.add(id); return [{...v,org_number:id,sections:v.sections && typeof v.sections==='object' && !Array.isArray(v.sections) ? v.sections : {}}]; }); }
export function parseFacts(raw: unknown): Fact[] { if(!Array.isArray(raw)) throw new Error('Fact data must be an array.'); return raw.flatMap(v=>v && typeof v==='object' && !Array.isArray(v) && /^\d{9}$/.test(text(v.org_number)) && categories.includes(v.category) ? [{...v,org_number:text(v.org_number),category:text(v.category)}] : []); }
export function normalize(v: string) { return v.toLowerCase().replaceAll('æ','ae').replaceAll('ø','o').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function distance(a:string,b:string){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}}return row[b.length];}
export function matches(c: Company, query: string) { const q=normalize(query.trim()),name=normalize(text(c.legal_name)); if(!q||name.includes(q)||[c.municipality,c.industry_text,c.industry_text_en,c.industry_code].some(v=>normalize(text(v)).includes(q)))return true;if(/^[\d\s.-]+$/.test(q))return c.org_number.includes(q.replace(/\D/g,''));return q.length>=3&&q.split(/\s+/).every(part=>name.split(/\s+/).some(word=>distance(part,word)<= (part.length>5?2:1))); }
