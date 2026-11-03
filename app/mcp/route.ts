import {env} from 'cloudflare:workers';
import {getDigest} from '../../lib/finn-feeds';
import {scanPortfolio} from '../../lib/finn-scan';
import {persistEvents} from '../../lib/finn-store';
import demo from '../../data/demo.json';
const tools=[{name:'refresh_portfolio',description:'Refresh FINN portfolio filings and completed EOD market data. Return only new material filing/threshold alerts; preserve source links and unavailable-provider coverage.',inputSchema:{type:'object',properties:{price:{type:'number',minimum:0.5,maximum:50},volume:{type:'number',minimum:1,maximum:20}},additionalProperties:false}}];
async function refresh(args:Record<string,unknown>){
 const price=Number(args.price??3),volume=Number(args.volume??2);if(!Number.isFinite(price)||price<.5||price>50||!Number.isFinite(volume)||volume<1||volume>20)throw Error('Invalid thresholds');
 const tickers=demo.portfolio.map(c=>c.ticker),[digest,scan]=await Promise.all([getDigest(tickers,24),scanPortfolio(tickers,price,volume)]);
 for(const ticker of tickers)await persistEvents(ticker,digest.events.filter(e=>e.ticker===ticker));
 const candidates=[...digest.events.filter(e=>e.priority==='high').map(e=>({id:e.id,ticker:e.ticker,message:e.title,date:e.date,url:e.url})),...scan.alerts];
 const newAlerts=[];if(!env.DB)throw Error('Persistent alert storage unavailable');
 for(const a of candidates){const result=await env.DB.prepare('INSERT OR IGNORE INTO request_budgets(key,count,expires_at) VALUES(?,1,?)').bind('delivered-alert:'+a.id,new Date(Date.now()+90*86400000).toISOString()).run();if(result.meta.changes)newAlerts.push(a)}
 return {asOf:digest.asOf,newAlerts,filingCoverage:digest.coverage,marketCoverage:scan.coverage.map((c:any)=>({ticker:c.ticker,status:c.status,asOf:c.asOf})),thresholds:{price,volume}};
}
export async function POST(request:Request){
 let id:unknown=null;try{const raw=await request.text();if(raw.length>6000)throw Error('Request too large');const body=JSON.parse(raw);id=body.id??null;
 if(body.method==='server/discover')return Response.json({jsonrpc:'2.0',id,result:{supportedVersions:['2026-07-28'],capabilities:{tools:{}}}});
 if(body.method==='initialize')return Response.json({jsonrpc:'2.0',id,result:{protocolVersion:'2026-07-28',capabilities:{tools:{}},serverInfo:{name:'FINN',version:'1.0.0'}}});
 if(body.method==='tools/list')return Response.json({jsonrpc:'2.0',id,result:{tools}});
 if(body.method==='tools/call'){
 if(!request.headers.get('oai-authenticated-user-id'))return Response.json({jsonrpc:'2.0',id,result:{isError:true,content:[{type:'text',text:'Authenticated Site tool access is required.'}]}});
 if(body.params?.name!=='refresh_portfolio')throw Error('Unknown tool');
 return Response.json({jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(await refresh(body.params.arguments||{}))}]}});
 }
 if(String(body.method).startsWith('notifications/'))return new Response(null,{status:202});throw Error('Unsupported method');
 }catch(e){return Response.json({jsonrpc:'2.0',id,error:{code:-32602,message:e instanceof Error?e.message:'Invalid request'}})}
}
