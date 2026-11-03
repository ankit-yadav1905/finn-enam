import { research } from '../../../lib/finn-data';
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length')) > 100000) return Response.json({status:'error',message:'Request too large.'},{status:413});
  try { const text = await request.text(); if (text.length > 100000) return Response.json({status:'error',message:'Request too large.'},{status:413}); const body = JSON.parse(text); return Response.json(await research(body)); }
  catch (error) { return Response.json({status:'error',message:error instanceof Error ? error.message : 'Invalid research request.'},{status:400}); }
}
