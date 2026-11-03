import { env } from 'cloudflare:workers';
type Row=Record<string,any>;
export async function persistEvents(ticker:string,events:Row[]){
 if(!env.DB)return;const now=new Date().toISOString();
 const batch=events.filter(e=>e.id&&e.date&&e.url).map(e=>env.DB!.prepare('INSERT INTO events (id,ticker,published_at,category,priority,title,summary,url,fetched_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category=excluded.category,priority=excluded.priority,title=excluded.title,summary=excluded.summary,url=excluded.url,fetched_at=excluded.fetched_at').bind(e.id,ticker,e.date,e.category,e.priority,e.title,e.summary||e.title,e.url,now));
 for(let i=0;i<batch.length;i+=50)await env.DB.batch(batch.slice(i,i+50));
}
export async function readEvents(tickers:string[],from:string){
 if(!env.DB||!tickers.length)return [];
 const r=await env.DB.prepare(`SELECT id,ticker,published_at AS date,category,priority,title,summary,url,fetched_at AS fetchedAt FROM events WHERE ticker IN (${tickers.map(()=>'?').join(',')}) AND published_at>=? ORDER BY published_at DESC LIMIT 500`).bind(...tickers,from).all();return r.results as Row[];
}
export async function saveMarket(ticker:string,payload:Row){if(env.DB)await env.DB.prepare('INSERT INTO market_cache (ticker,payload,fetched_at) VALUES (?,?,?) ON CONFLICT(ticker) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at').bind(ticker,JSON.stringify(payload),new Date().toISOString()).run()}
export async function readMarket(ticker:string){if(!env.DB)return null;const row=await env.DB.prepare('SELECT payload,fetched_at FROM market_cache WHERE ticker=?').bind(ticker).first<{payload:string;fetched_at:string}>();return row?{...JSON.parse(row.payload),cached:true,stale:true,cachedAt:row.fetched_at}:null}
