import {z} from 'zod';
import {research} from '../../../lib/finn-data';
const schema=z.object({ticker:z.string().min(1).max(30),question:z.string().trim().min(4).max(1500),documents:z.array(z.object({url:z.string().url().max(2000),kind:z.enum(['annual_report','transcript','results']).optional(),title:z.string().max(200).optional()})).max(3).optional()});
const limits=new Map<string,{count:number;until:number}>();
export async function POST(request:Request){
 try{
  const key=request.headers.get('cf-connecting-ip')||'local',now=Date.now(),prior=limits.get(key);
  if(prior&&prior.until>now&&prior.count>=30)return Response.json({status:'error',message:'Research request limit reached. Please wait a minute.'},{status:429});
  if(limits.size>2000)limits.clear();limits.set(key,{count:prior&&prior.until>now?prior.count+1:1,until:prior&&prior.until>now?prior.until:now+60000});
  if(Number(request.headers.get('content-length'))>10000)return Response.json({status:'error',message:'Request too large.'},{status:413});
  const text=await request.text();if(text.length>10000)return Response.json({status:'error',message:'Request too large.'},{status:413});
  let body:unknown;try{body=JSON.parse(text)}catch{return Response.json({status:'error',message:'Send valid JSON.'},{status:400})}
  const parsed=schema.safeParse(body);if(!parsed.success)return Response.json({status:'error',message:'Provide a valid ticker and a question of 4–1,500 characters. Document entries require an original URL and valid kind.'},{status:400});
  return Response.json(await research(parsed.data));
 }catch(error){console.warn('FINN research failed',{reason:error instanceof Error?error.message:'unknown'});return Response.json({status:'error',message:error instanceof Error?error.message:'Research could not complete.'},{status:400})}
}
