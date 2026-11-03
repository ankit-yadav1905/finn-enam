import {z} from 'zod';
import {normalizeTicker} from '../../../lib/finn-core.mjs';
import {fetchPrimaryDocument,listDocuments,saveDocument} from '../../../lib/finn-documents';
import {getChatGPTUser,chatGPTSignInPath} from '../../chatgpt-auth';
import {takeBudget} from '../../../lib/finn-budget';
const schema=z.object({ticker:z.string().min(1).max(30),url:z.string().url().max(2000),kind:z.enum(['annual_report','transcript','results']),title:z.string().min(1).max(200).optional(),publishedAt:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()});
const limits=new Map<string,{count:number;until:number}>();
export async function GET(request:Request){try{return Response.json(await listDocuments(new URL(request.url).searchParams.get('ticker')||''))}catch(error){return Response.json({status:'error',message:error instanceof Error?error.message:'Invalid ticker.'},{status:400})}}
export async function POST(request:Request){
 try{
  const user=await getChatGPTUser();if(!user)return Response.json({status:'error',message:'Sign in to add a primary document to the shared research library.',signInUrl:chatGPTSignInPath('/')},{status:401});
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({status:'error',message:'Document imports must originate from this site.'},{status:403});
  if(!await takeBudget('document-import:'+user.userId,12)||!await takeBudget('document-import-global',60))return Response.json({status:'error',message:'Daily document import budget reached. Try again tomorrow.'},{status:429});
  const key=request.headers.get('cf-connecting-ip')||'local',now=Date.now(),prior=limits.get(key);if(prior&&prior.until>now&&prior.count>=6)return Response.json({status:'error',message:'Document processing limit reached. Try again in an hour.'},{status:429});
  if(limits.size>1000)limits.clear();limits.set(key,{count:prior&&prior.until>now?prior.count+1:1,until:prior&&prior.until>now?prior.until:now+3600000});
  if(Number(request.headers.get('content-length'))>6000)return Response.json({status:'error',message:'Request too large.'},{status:413});
  const raw=await request.text();if(raw.length>6000)return Response.json({status:'error',message:'Request too large.'},{status:413});
  const parsed=schema.safeParse(JSON.parse(raw));if(!parsed.success)return Response.json({status:'error',message:'Provide a ticker, original document URL and valid document kind.'},{status:400});
  const ticker=normalizeTicker(parsed.data.ticker),doc=await fetchPrimaryDocument({...parsed.data,ticker}),saved=await saveDocument(doc);
  return Response.json({status:'ok',ticker,...saved,title:doc.title,url:doc.url,message:saved.duplicate?'This document is already indexed.':'Primary document indexed and available for research.'});
 }catch(error){const message=error instanceof Error?error.message:'Document could not be indexed.';console.warn('FINN document indexing failed',{reason:message});return Response.json({status:'unavailable',message},{status:422})}
}

