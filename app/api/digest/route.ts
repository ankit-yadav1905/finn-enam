import { getDigest, deduplicateEvents, type FilingEvent } from '../../../lib/finn-feeds';
import { persistEvents, readEvents } from '../../../lib/finn-store';
export async function GET(request:Request){
  const params=new URL(request.url).searchParams;
  try{
    const result=await getDigest((params.get('tickers')||'').split(',').filter(Boolean),Number(params.get('hours')||24));
    let storageMessage:string|undefined;
    try{for(const company of result.coverage){if(company.status!=='unavailable')await persistEvents(company.ticker,result.events.filter(event=>event.ticker===company.ticker));}}catch{storageMessage='Some new filings could not be saved to durable storage.';}
    let cachedEvents:FilingEvent[]=[];try{const unavailable=result.coverage.filter(company=>company.status!=='ok').map(company=>company.ticker);cachedEvents=(await readEvents(unavailable,result.window.from)).map(event=>({id:String(event.id),ticker:String(event.ticker),date:String(event.date),category:String(event.category),priority:String(event.priority),title:String(event.title),summary:String(event.summary),url:String(event.url),exchange:String(event.id).startsWith('BSE:')?'BSE':'NSE',source:String(event.url),cached:true,stale:true}));}catch{storageMessage='Durable filing history is temporarily unavailable.';}
    const events=deduplicateEvents([...result.events,...cachedEvents]).filter(event=>event.date<=result.window.to);
    return Response.json({...result,status:result.status==='unavailable'&&cachedEvents.length?'stale':result.status,events,cachedCount:cachedEvents.length,storageMessage,totals:{...result.totals,events:events.length,highPriority:events.filter(event=>event.priority==='high').length}},{status:result.status==='unavailable'&&!cachedEvents.length?503:200});
  }
  catch(error){return Response.json({status:'error',message:error instanceof Error?error.message:'Invalid digest request.'},{status:400});}
}
