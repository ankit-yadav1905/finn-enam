import bseDirectory from '../data/bse-symbols.json' with { type: 'json' };
import { summarizePrices, classifyAnnouncement } from './finn-core.mjs';

export type Diagnostic = {provider:string;code:string;message:string};
export type FilingEvent = {id:string;ticker:string;date:string;category:string;priority:string;title:string;summary:string;url:string;exchange:string;source:string};
type Options = {hours?:number;now?:number;fetcher?:typeof fetch;cache?:boolean};
type RecordData = Record<string, any>;
export type FeedResult = {status:'ok'|'partial'|'unavailable';ticker:string;exchange:string;asOf:string;fetchedAt:string;events:FilingEvent[];diagnostics:Diagnostic[];source:string;truncated?:boolean;cached?:boolean};
const memory = new Map<string,{until:number;data:unknown}>();
const pending = new Map<string,Promise<unknown>>();
const USER_AGENT='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36';
const BSE_BASE='https://api.bseindia.com/BseIndiaAPI/api/';

export function parseSymbol(value:unknown) {
  const raw=String(value ?? '').trim().toUpperCase();
  const match=raw.match(/^([A-Z0-9][A-Z0-9&-]{0,24})(?:\.(NS|BO))?$/);
  if(!match) throw new Error('Enter an NSE symbol (INFY or INFY.NS) or a BSE symbol/scrip code (500209.BO).');
  const exchange=match[2]==='BO'?'BSE':'NSE';
  return {symbol:match[1],exchange,ticker:exchange==='BSE'?`${match[1]}.BO`:match[1],yahooSymbol:`${match[1]}.${exchange==='BSE'?'BO':'NS'}`};
}
export function normalizeFilingDate(input:unknown):string|null {
  if(typeof input!=='string'||!input.trim()) return null;
  let value=input.trim();
  const nse=value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)/);
  if(nse){const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(nse[2].toLowerCase())+1;if(!month)return null;value=`${nse[3]}-${String(month).padStart(2,'0')}-${nse[1].padStart(2,'0')}T${nse[4]}+05:30`;}
  else if(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)){value=value.replace(' ','T');if(!/(Z|[+-]\d{2}:?\d{2})$/i.test(value))value+='+05:30';}
  else return null;
  const time=Date.parse(value);return Number.isFinite(time)?new Date(time).toISOString():null;
}
export function deduplicateEvents(events:FilingEvent[]) {
  const seen=new Set<string>();return events.filter(event=>{const key=event.url&&/\.pdf(?:\?|$)/i.test(event.url)?`${event.ticker}:${event.url.split('?')[0].toLowerCase()}`:event.id;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>b.date.localeCompare(a.date));
}
export async function mapBounded<T,R>(items:T[],limit:number,fn:(item:T)=>Promise<R>):Promise<R[]> {
  const output=new Array<R>(items.length);let cursor=0;
  await Promise.all(Array.from({length:Math.min(Math.max(1,limit),items.length)},async()=>{for(;;){const i=cursor++;if(i>=items.length)return;output[i]=await fn(items[i]);}}));return output;
}
class SourceError extends Error {code:string;constructor(code:string,message:string){super(message);this.code=code;}}
function diagnostic(provider:string,error:unknown):Diagnostic {
  if(error instanceof SourceError)return {provider,code:error.code,message:error.message};
  const message=error instanceof Error?error.message:'Unknown network error';
  return {provider,code:/timeout|abort/i.test(message)?'TIMEOUT':'NETWORK_ERROR',message:message.replace(/https?:\/\/[^\s]+/g,'[provider URL]').slice(0,200)};
}
async function sourceJson(url:string,fetcher=fetch):Promise<any>{
  let response:Response;
  try{response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{Accept:'application/json','User-Agent':USER_AGENT,...(url.includes('bseindia.com')?{Referer:'https://www.bseindia.com/',Origin:'https://www.bseindia.com'}:url.includes('nseindia.com')?{Referer:'https://www.nseindia.com/'}:{})}});}catch(error){throw error;}
  if(!response.ok)throw new SourceError(`HTTP_${response.status}`,`Provider returned HTTP ${response.status}${response.status===403?' (access denied)':response.status===429?' (rate limited)':''}.`);
  if(Number(response.headers.get('content-length'))>5_000_000)throw new SourceError('TOO_LARGE','Provider response exceeds 5 MB.');
  const reader=response.body?.getReader();if(!reader)throw new SourceError('EMPTY_BODY','Provider returned an empty response.');
  let size=0,text='';const decoder=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>5_000_000){await reader.cancel();throw new SourceError('TOO_LARGE','Provider response exceeds 5 MB.');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();
  try{return JSON.parse(text);}catch{throw new SourceError('INVALID_JSON',`Provider returned ${response.headers.get('content-type')||'non-JSON content'} instead of market data.`);}
}
async function cached<T>(key:string,run:()=>Promise<T>,options:Options,ttl=300000):Promise<T>{
  if(options.fetcher&&!options.cache)return run();const hit=memory.get(key);if(hit&&hit.until>Date.now())return hit.data as T;
  const active=pending.get(key);if(active)return active as Promise<T>;
  const work=run().then(data=>{if(memory.size>180)memory.clear();memory.set(key,{data,until:Date.now()+ttl});return data;}).finally(()=>pending.delete(key));pending.set(key,work);return work;
}
export async function getMarket(input:string,options:Options={}) {
  const parsed=parseSymbol(input),now=options.now??Date.now(),diagnostics:Diagnostic[]=[];
  return cached(`market:${parsed.ticker}`,async()=>{
    let yahooSymbol=parsed.yahooSymbol;
    if(parsed.exchange==='BSE'&&/^\d{6}$/.test(parsed.symbol)){
      try{const known=(bseDirectory.symbols as Record<string,string>)[parsed.symbol];const list=known?[{SCRIP_CD:parsed.symbol,scrip_id:known}]:await bseSecurityMaster(options);const security=list.find((row:RecordData)=>String(row.SCRIP_CD)===parsed.symbol);if(security?.scrip_id)yahooSymbol=`${security.scrip_id}.BO`;else diagnostics.push({provider:'BSE',code:'SYMBOL_NOT_FOUND',message:'Scrip code was not found in the active BSE security master.'});}
      catch(error){diagnostics.push(diagnostic('BSE security master',error));}
    }
    for(const host of ['query1.finance.yahoo.com','query2.finance.yahoo.com']){
      const source=`https://${host}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=3mo&interval=1d`;
      try{
        const body=await sourceJson(source,options.fetcher);const result=body.chart?.result?.[0];
        if(!result?.timestamp||!result?.indicators?.quote?.[0])throw new SourceError('NO_DATA',String(body.chart?.error?.description||'Provider returned no daily price history.').slice(0,160));
        const quote=result.indicators.quote[0],india=new Date(now+330*60000),today=india.toISOString().slice(0,10),closed=india.getUTCHours()>=16;
        const history=result.timestamp.map((stamp:number,i:number)=>({date:new Date(stamp*1000).toISOString().slice(0,10),close:quote.close[i],volume:quote.volume[i]})).filter((row:{date:string;close:number;volume:number})=>Number.isFinite(row.close)&&row.close>0&&Number.isFinite(row.volume)&&row.volume>=0&&(row.date<today||(row.date===today&&closed)));
        if(history.length<2)throw new SourceError('INSUFFICIENT_SESSIONS','Fewer than two completed trading sessions are available.');
        return {status:'ok' as const,ticker:parsed.ticker,exchange:parsed.exchange,asOf:history.at(-1)?.date,fetchedAt:new Date(now).toISOString(),currency:result.meta?.currency||'INR',latest:summarizePrices(history),history,source,diagnostics,attribution:'Yahoo Finance. Completed daily sessions only. Raw closes; corporate actions can affect comparisons.'};
      }catch(error){diagnostics.push(diagnostic(host,error));}
    }
    return {status:'unavailable' as const,ticker:parsed.ticker,exchange:parsed.exchange,asOf:null,fetchedAt:new Date(now).toISOString(),diagnostics,message:'Neither Yahoo market endpoint returned usable completed sessions. See provider diagnostics.'};
  },options,60000);
}
async function bseSecurityMaster(options:Options):Promise<RecordData[]>{
  const list=await cached('bse:security-master',()=>sourceJson(`${BSE_BASE}ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active`,options.fetcher),options,3600000);
  if(!Array.isArray(list))throw new SourceError('INVALID_SCHEMA','BSE security master is unavailable.');
  return list;
}
async function resolveBseCode(symbol:string,options:Options):Promise<string|null>{
  if(/^\d{6}$/.test(symbol))return symbol;
  const known=Object.entries(bseDirectory.symbols).find(([,id])=>id===symbol);if(known)return known[0];
  const list=await bseSecurityMaster(options);
  const match=list.find((row:RecordData)=>String(row.scrip_id).toUpperCase()===symbol);return match?String(match.SCRIP_CD):null;
}
export async function getCompanyWebsite(input:string):Promise<string|null>{
  const parsed=parseSymbol(input);if(parsed.exchange==='BSE')return null;
  try{const row=await cached(`company:${parsed.symbol}`,()=>sourceJson(`https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(parsed.symbol)}`),{},3600000);const raw=row.info?.website||row.metadata?.website; if(typeof raw!=='string')return null;const url=new URL(raw.startsWith('http')?raw:`https://${raw}`);return url.protocol==='https:'?url.href:null;}catch{return null;}
}
function dateParts(time:number){const date=new Date(time+330*60000),y=date.getUTCFullYear(),m=String(date.getUTCMonth()+1).padStart(2,'0'),d=String(date.getUTCDate()).padStart(2,'0');return {nse:`${d}-${m}-${y}`,bse:`${y}${m}${d}`};}
function validFilingUrl(input:unknown,exchange:string){try{const url=new URL(String(input));if(url.protocol==='https:'&&(url.hostname.endsWith('.nseindia.com')||url.hostname==='nseindia.com'||url.hostname.endsWith('.bseindia.com')||url.hostname==='bseindia.com'))return url.href;}catch{}return exchange==='BSE'?'https://www.bseindia.com/corporates/ann.html':'https://www.nseindia.com/companies-listing/corporate-filings-announcements';}
export async function getAnnouncements(input:string,options:Options={}):Promise<FeedResult>{
  const parsed=parseSymbol(input),now=options.now??Date.now(),hours=Math.min(720,Math.max(1,options.hours??168)),from=now-hours*3600000,start=dateParts(from),end=dateParts(now);
  return cached(`filings:${parsed.ticker}:${hours}`,async()=>{
    const diagnostics:Diagnostic[]=[],events:FilingEvent[]=[];let source='',exchange=parsed.exchange,successful=false,truncated=false;
    if(parsed.exchange==='NSE'){
      source=`https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=${encodeURIComponent(parsed.symbol)}&from_date=${start.nse}&to_date=${end.nse}`;
      try{const rows=await sourceJson(source,options.fetcher);if(!Array.isArray(rows))throw new SourceError('INVALID_SCHEMA','NSE did not return an announcement array.');
        for(const row of rows){const date=normalizeFilingDate(row.an_dt||row.sort_date);if(!date)continue;const title=String(row.desc||row.attchmntText||'Company disclosure'),summary=String(row.attchmntText||title),url=validFilingUrl(row.attchmntFile,'NSE');events.push({id:`NSE:${row.seq_id||parsed.symbol+':'+date+':'+title}`,ticker:parsed.ticker,date,title,summary,url,exchange:'NSE',source,...classifyAnnouncement(title+' '+summary)} as FilingEvent);}successful=true;
      }catch(error){diagnostics.push(diagnostic('NSE',error));}
    }
    // BSE is an alternate primary exchange source, never a simulated replacement.
    if(!successful){
      try{const code=await resolveBseCode(parsed.symbol,options);if(!code)throw new SourceError('SYMBOL_NOT_FOUND','No exact BSE security-master symbol match was found.');exchange='BSE';
        for(let page=1;page<=5;page++){
          source=`${BSE_BASE}AnnSubCategoryGetData/w?pageno=${page}&strCat=-1&strPrevDate=${start.bse}&strScrip=${code}&strSearch=P&strToDate=${end.bse}&strType=C&subcategory=-1`;
          const data=await sourceJson(source,options.fetcher);if(!Array.isArray(data.Table))throw new SourceError('INVALID_SCHEMA','BSE did not return a filing table.');
          for(const row of data.Table){const date=normalizeFilingDate(row.DissemDT||row.NEWS_DT||row.DT_TM);if(!date)continue;const title=String(row.NEWSSUB||row.CATEGORYNAME||'Company disclosure'),summary=String(row.HEADLINE||title),attachment=String(row.ATTACHMENTNAME||''),url=attachment&&/^[a-zA-Z0-9_.-]+\.pdf$/i.test(attachment)?`https://www.bseindia.com/xml-data/corpfiling/${row.OLD?'AttachHis':'AttachLive'}/${attachment}`:'https://www.bseindia.com/corporates/ann.html';events.push({id:`BSE:${row.NEWSID||code+':'+date+':'+title}`,ticker:parsed.ticker,date,title,summary,url,exchange:'BSE',source,...classifyAnnouncement(title+' '+summary)} as FilingEvent);}
          successful=true;const total=Number(data.Table1?.[0]?.ROWCNT??data.Table.length);if(!data.Table.length||events.length>=total)break;if(page===5){truncated=true;diagnostics.push({provider:'BSE',code:'PAGE_LIMIT',message:'Five pages retrieved; shorten the time window for complete coverage.'});}
        }
      }catch(error){diagnostics.push(diagnostic('BSE',error));if(successful)truncated=true;}
    }
    const filtered=deduplicateEvents(events).filter(event=>Date.parse(event.date)>=from&&Date.parse(event.date)<=now);
    return {status:successful?(truncated?'partial':'ok'):'unavailable',ticker:parsed.ticker,exchange,asOf:new Date(now).toISOString(),fetchedAt:new Date(now).toISOString(),events:filtered,diagnostics,source,truncated};
  },options,60000);
}
export async function getDigest(inputs:string[],hours=24,options:Options={}){
  const tickers=[...new Set(inputs.map(input=>parseSymbol(input).ticker))];if(!tickers.length||tickers.length>25)throw new Error('Choose between 1 and 25 tickers.');if(!Number.isFinite(hours)||hours<1||hours>720)throw new Error('Choose a window between 1 and 720 hours.');
  const now=options.now??Date.now(),deadline=AbortSignal.timeout(35000),base=options.fetcher??fetch;
  const fetcher:typeof fetch=(url,init)=>base(url,{...init,signal:AbortSignal.any([deadline,...(init?.signal?[init.signal]:[])])});
  const feeds=await mapBounded(tickers,3,ticker=>getAnnouncements(ticker,{...options,fetcher,cache:!options.fetcher,now,hours}));
  const events=deduplicateEvents(feeds.flatMap(feed=>feed.events)),available=feeds.filter(feed=>feed.status==='ok').length;
  return {status:available===feeds.length?'ok':feeds.every(feed=>feed.status==='unavailable')?'unavailable':'partial',asOf:new Date(now).toISOString(),window:{from:new Date(now-hours*3600000).toISOString(),to:new Date(now).toISOString(),hours},events,coverage:feeds.map(feed=>({ticker:feed.ticker,status:feed.status,count:feed.events.length,exchange:feed.exchange,diagnostics:feed.diagnostics,fetchedAt:feed.fetchedAt})),totals:{companies:tickers.length,available,events:events.length,highPriority:events.filter(event=>event.priority==='high').length}};
}

