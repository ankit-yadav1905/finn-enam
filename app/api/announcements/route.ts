import { getAnnouncements, parseSymbol } from '../../../lib/finn-feeds';
import { persistEvents, readEvents } from '../../../lib/finn-store';
export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get('ticker') || '';
  let ticker; try { ticker = parseSymbol(input).ticker; } catch (e) { return Response.json({status:'error',message:(e as Error).message},{status:400}); }
  const hours=Number(new URL(request.url).searchParams.get('hours')||168);if(!Number.isFinite(hours)||hours<1||hours>720)return Response.json({status:'error',message:'hours must be between 1 and 720.'},{status:400});
  const result=await getAnnouncements(ticker,{hours});
  if(result.status!=='unavailable'){try{await persistEvents(ticker,result.events);}catch{}return Response.json(result);}
  try{const saved=await readEvents([ticker],new Date(Date.now()-hours*3600000).toISOString());if(saved.length)return Response.json({...result,status:'stale',cached:true,stale:true,events:saved,message:'Exchange refresh failed. Showing previously retrieved filings within this window.'});}catch{}
  return Response.json(result,{status:503});
}
