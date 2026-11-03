/** Pure, deterministic finance and evidence utilities; no model arithmetic. */
export function normalizeTicker(value) {
  const ticker = String(value ?? '').trim().toUpperCase().replace(/\.NS$/, '');
  if (!/^[A-Z0-9][A-Z0-9&-]{0,24}$/.test(ticker)) throw new Error('Enter a valid NSE ticker, for example INFY.');
  return ticker;
}
export function percentageChange(current, previous) {
  return Number.isFinite(current) && Number.isFinite(previous) && previous > 0
    ? (current - previous) / previous * 100 : null;
}
/** Compare quarterly statements only when accounting basis, unit and periods align. */
export function compareResults(current, prior) {
  const rejected = reason => ({comparable:false,reason,comparison:null,metrics:{}});
  if (!current || !prior) return rejected('Both reporting periods are required.');
  const normalize = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g,' ');
  if (!current.basis || !prior.basis || normalize(current.basis) !== normalize(prior.basis)) return rejected('Reporting basis differs or is missing.');
  if (!current.unit || !prior.unit || normalize(current.unit) !== normalize(prior.unit)) return rejected('Reporting units differ or are missing.');
  const ordinal = period => { const match = String(period ?? '').match(/^Q([1-4])\s+FY(\d{2}|\d{4})$/i); return match ? (Number(match[2]) % 100 + 2000) * 4 + Number(match[1]) : null; };
  const now = ordinal(current.period), before = ordinal(prior.period);
  if (now === null || before === null) return rejected('Only identified quarterly periods are comparable.');
  const gap = now - before;
  if (gap !== 1 && gap !== 4) return rejected('Periods must be adjacent quarters or the same quarter one year apart.');
  const metrics = Object.fromEntries(['revenue','ebitda','pbt','pat'].map(key => [key,{
    current: Number.isFinite(current[key]) ? current[key] : null,
    previous: Number.isFinite(prior[key]) ? prior[key] : null,
    changePercent: percentageChange(current[key],prior[key]),
    reason: !Number.isFinite(current[key]) || !Number.isFinite(prior[key]) ? 'Missing figure' : prior[key] <= 0 ? 'Percentage growth is not meaningful against a zero or negative base' : null,
  }]));
  return {comparable:true,reason:null,comparison:gap === 1 ? 'QoQ' : 'YoY',metrics};
}
export function summarizePrices(history) {
  const valid = history.filter(row => Number.isFinite(row.close) && row.close > 0 && Number.isFinite(row.volume) && row.volume >= 0);
  if (valid.length < 2) throw new Error('Insufficient completed trading sessions.');
  const latest = valid.at(-1), prior = valid.slice(-21, -1);
  const average = prior.reduce((sum, row) => sum + row.volume, 0) / prior.length;
  return { ...latest, changePercent: percentageChange(latest.close, valid.at(-2).close), volumeRatio: average > 0 ? latest.volume / average : null, baselineSessions: prior.length };
}
export function classifyAnnouncement(title) {
  const value = String(title).toLowerCase();
  const rules = [
    [/resignation|(?:appointment|cessation|retirement|change).*(?:\bceo\b|\bcfo\b|chief\s+(?:financial|executive)\s+officer|managing\s+director|director)|(?:\bceo\b|\bcfo\b|chief\s+(?:financial|executive)\s+officer|managing\s+director).*(?:appointment|cessation|retirement|change)|management change/, 'management_change', 'high'],
    [/financial result|quarterly result|audited.*result/, 'results', 'high'],
    [/acquisition|merger|demerger|joint venture|scheme\s+of\s+(?:arrangement|amalgamation)/, 'M&A', 'high'],
    [/litigation|penalty|fine imposed|insolvency/, 'litigation', 'high'],
    [/transcript|earnings call|conference call/, 'earnings_call', 'medium'],
    [/credit rating/, 'credit_rating', 'medium'],
    [/dividend/, 'dividend', 'medium'],
    [/investor meet|analyst meet|schedule of.*meet/, 'investor_meetings', 'low'],
  ];
  const rule = rules.find(([pattern]) => pattern.test(value));
  return rule ? {category: rule[1], priority: rule[2]} : {category: 'unclassified', priority: 'low'};
}
export function cleanHtml(html) {
  return String(html).replace(/<(script|style|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
const STOP_WORDS = new Set('the a an and or to of for from with by in on at is are was were be been being it its this that these those what which who how why when where do does did can could would should please tell show explain about company companies business latest recent reported report reports annual quarter quarterly year years financial fiscal performance give me us their our they has have had'.split(' '));
const tokens = text => [...new Set((String(text).toLowerCase().match(/[a-z][a-z0-9]+/g) || []).filter(word => !STOP_WORDS.has(word)))];
const INTENTS = [
  {query:/\bcash\b|cashflow|\bfcf\b/, evidence:/cash[\s-]*flow|cash.*(?:operat|generat|conver)|operat.*cash|\bfcf\b/},
  {query:/\bmargin|profitability|\bebitda?\b/,evidence:/\bmargin|profitability|\bebitda?\b|operating profit/},
  {query:/guidance|outlook|forecast|promis|commitment/,evidence:/guidance|outlook|forecast|expect|target|anticipat/},
  {query:/\bdebt|leverage|borrow|balance sheet/,evidence:/\bdebt|leverage|borrow|balance sheet|liabilit/},
  {query:/\brevenue|\bsales|\bgrowth/,evidence:/\brevenue|\bsales|\bgrowth/},
];
/** Score globally comparable passages. Intent gates prevent shared filler words
 * (e.g. 'operating' in a cash-flow question) from manufacturing evidence. */
export function rankPassages(text, question, limit = 4) {
  const query=String(question).toLowerCase();
  const terms=tokens(query);
  if (!terms.length) return [];
  const intents=INTENTS.filter(intent=>intent.query.test(query));
  // Normalize PDF line wrapping; preserve decimal points inside numbers.
  const sentences=String(text).replace(/\s+/g,' ').trim().split(/(?<=[.!?])\s+/);
  // Bound long table/sentence spans before scoring so matched evidence is never
  // discarded by truncating a long page after the score has been computed.
  const chunks=sentences.flatMap(sentence=>{
    if(sentence.length<=1600)return [sentence];
    const spans=[];for(let i=0;i<sentence.length;i+=1200)spans.push(sentence.slice(i,i+1600));return spans;
  });
  return chunks.map((text,index)=>{
    const lower=text.toLowerCase(), words=new Set(tokens(text));
    const intentHits=intents.filter(intent=>intent.evidence.test(lower)).length;
    const hits=terms.filter(term=>words.has(term) || (term.length>4 && [...words].some(word=>word.startsWith(term) || term.startsWith(word)))).length;
    const boilerplate=/hereby certify|to the best of our knowledge|auditor.s responsibility|table of contents/.test(lower);
    const quantitativeCash=/net cash.{0,35}operating|free cash flow|cash.{0,30}(?:conversion|net income)/.test(lower);
    const score=(intents.length && !intentHits)?0:hits+intentHits*4+(quantitativeCash && /cash|fcf/.test(query)?3:0)-(boilerplate?12:0);
    return {text:text.trim(),index,score};
  }).filter(row=>row.score>0 && row.text.length>30)
    .sort((a,b)=>b.score-a.score || a.index-b.index)
    .filter((row,index,rows)=>rows.findIndex(other=>other.text===row.text)===index)
    .slice(0,Math.max(0,limit));
}
export function retrievePassages(text,question,limit=4) {
  return rankPassages(text,question,limit).map(row=>row.text);
}
export function trustedSourceUrl(value, companyHost = '') {
  let url; try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
  const host = url.hostname.toLowerCase();
  const allowed = ['nseindia.com', 'nsearchives.nseindia.com', 'archives.nseindia.com', 'bseindia.com', companyHost.toLowerCase().replace(/^www\./, '')].filter(Boolean);
  return allowed.some(domain => host === domain || host.endsWith('.' + domain)) ? url.href : null;
}
