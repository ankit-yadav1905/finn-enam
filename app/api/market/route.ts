import { getMarket } from '../../../lib/finn-data';
import { normalizeTicker } from '../../../lib/finn-core.mjs';
export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get('ticker') || '';
  let ticker; try { ticker = normalizeTicker(input); } catch (e) { return Response.json({status:'error',message:(e as Error).message},{status:400}); }
  try { return Response.json(await getMarket(ticker)); } catch { return Response.json({status:'unavailable',ticker,message:'The price provider could not return completed daily sessions. Try again later; no prices have been invented.'},{status:503}); }
}
