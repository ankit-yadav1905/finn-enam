import { env } from 'cloudflare:workers';
export async function GET(){return Response.json({storage:Boolean(env.DB),features:{liveDigest:true,marketScan:true,primaryPdfImport:true,modelSynthesis:Boolean(process.env.OPENAI_API_KEY&&process.env.OPENAI_MODEL)},asOf:new Date().toISOString()})}

