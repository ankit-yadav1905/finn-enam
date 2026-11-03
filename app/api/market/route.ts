import { getMarket, parseSymbol } from '../../../lib/finn-feeds';
import { saveMarket, readMarket } from '../../../lib/finn-store';
export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get('ticker') || '';
  let ticker; try { ticker = parseSymbol(input).ticker; } catch (e) { return Response.json({status:'error',message:(e as Error).message},{status:400}); }
  const result=await getMarket(ticker);
  if(result.status==='ok'){try{await saveMarket(ticker,result);}catch{/* A storage outage must not hide a successful provider response. */}return Response.json(result);}
  try{const saved=await readMarket(ticker);if(saved)return Response.json({...saved,status:'stale',diagnostics:result.diagnostics,message:'Live refresh failed. Showing the last successfully retrieved market snapshot.'});}catch{}
  return Response.json(result,{status:503});
}
