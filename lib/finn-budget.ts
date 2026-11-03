import {env} from 'cloudflare:workers';
/** Atomic, persistent daily limits survive Worker restarts and parallel requests.
 * Missing storage fails closed for paid model work and document imports. */
export async function takeBudget(bucket:string,limit:number){
 const db=env.DB;if(!db)return false;
 const now=new Date(),date=now.toISOString().slice(0,10),expires=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1)).toISOString();
 const row=await db.prepare('INSERT INTO request_budgets(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(`${bucket}:${date}`,expires,limit).first<{count:number}>();
 return Boolean(row&&row.count<=limit);
}
