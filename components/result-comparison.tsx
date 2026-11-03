import { compareResults } from '../lib/finn-core.mjs';
type Row=Record<string,any>;
export function ResultComparison({results}:{results:Row[]}){
 const current=[...results].sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(!current)return null;
 const comparisons=results.filter(r=>r!==current).map(r=>compareResults(current,r)).filter(c=>c.comparable);
 return <div className="comparison-cards">{comparisons.map(c=><div className="quiet-card" key={c.comparison}><div className="eyebrow">{current.period} · {c.comparison}</div><div className="comparison-metrics">{Object.entries(c.metrics).map(([key,value]:[string,any])=><div key={key}><small>{key.toUpperCase()}</small><strong>{value.changePercent==null?'—':`${value.changePercent>0?'+':''}${value.changePercent.toFixed(1)}%`}</strong></div>)}</div></div>)}</div>
}
