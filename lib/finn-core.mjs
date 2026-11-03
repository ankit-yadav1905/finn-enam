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
    [/resignation|appointment.*(ceo|cfo|director)|management change/, 'management_change', 'high'],
    [/financial result|quarterly result|audited.*result/, 'results', 'high'],
    [/acquisition|merger|demerger|joint venture/, 'M&A', 'high'],
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
export function retrievePassages(text, question, limit = 4) {
  const terms = [...new Set(String(question).toLowerCase().match(/[a-z]{4,}/g) || [])];
  // Split on sentence whitespace, never decimal points inside financial figures.
  const chunks = String(text).split(/(?<=[.!?])\s+/);
  return chunks.map((text, index) => ({text: text.trim(), index, score: terms.reduce((score, word) => score + (text.toLowerCase().includes(word) ? 1 : 0), 0)}))
    .filter(row => row.score > 0 && row.text.length > 30).sort((a,b) => b.score - a.score || a.index - b.index).slice(0, limit).map(row => row.text.slice(0, 1600));
}
export function trustedSourceUrl(value, companyHost = '') {
  let url; try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
  const host = url.hostname.toLowerCase();
  const allowed = ['nseindia.com', 'nsearchives.nseindia.com', 'archives.nseindia.com', 'bseindia.com', companyHost.toLowerCase().replace(/^www\./, '')].filter(Boolean);
  return allowed.some(domain => host === domain || host.endsWith('.' + domain)) ? url.href : null;
}
