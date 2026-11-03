import { getAnnouncements } from '../../../lib/finn-data';
import { normalizeTicker } from '../../../lib/finn-core.mjs';
export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get('ticker') || '';
  let ticker; try { ticker = normalizeTicker(input); } catch (e) { return Response.json({status:'error',message:(e as Error).message},{status:400}); }
  try { return Response.json(await getAnnouncements(ticker)); } catch { return Response.json({status:'unavailable',ticker,events:[],message:'The NSE announcement feed is unavailable. Historical replay remains available; it is not a live feed.'},{status:503}); }
}
