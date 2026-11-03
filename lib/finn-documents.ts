import { env } from 'cloudflare:workers';
import { extractText, getDocumentProxy } from 'unpdf';
import corpus from '../data/corpus.json';
import { normalizeTicker, cleanHtml, trustedSourceUrl } from './finn-core.mjs';
import { getCompanyWebsite } from './finn-feeds';

export type EvidencePage = {page:number;text:string};
export type EvidenceDocument = {id:string;ticker:string;title:string;url:string;kind:string;date?:string|null;sha256?:string;provenance:string;coverage?:string;pages:EvidencePage[]};
const primaryDomains:Record<string,string>={INFY:'infosys.com',TCS:'tcs.com',HCLTECH:'hcltech.com',ASIANPAINT:'asianpaints.com',RELIANCE:'ril.com',HDFCBANK:'hdfcbank.com',ICICIBANK:'icicibank.com',SUNPHARMA:'sunpharma.com',CIPLA:'cipla.com',ITC:'itcportal.com',HINDUNILVR:'hul.co.in',TATAMOTORS:'tatamotors.com',MARUTI:'marutisuzuki.com',LT:'larsentoubro.com',ULTRACEMCO:'ultratechcement.com',TATASTEEL:'tatasteel.com',BHARTIARTL:'airtel.in',DIXON:'dixoninfo.com',PERSISTENT:'persistent.com'};
function database(){return env.DB;}
function inferredKind(doc:{kind?:string;title:string}){return doc.kind||(/annual report/i.test(doc.title)?'annual_report':/transcript|earnings call/i.test(doc.title)?'transcript':'results');}
export async function documentHost(ticker:string){
 const known=primaryDomains[ticker]; if(known)return known;
 const indexed=(corpus.documents as unknown as EvidenceDocument[]).find(d=>d.ticker===ticker&&!/nseindia|bseindia/.test(new URL(d.url).hostname));
 if(indexed)return new URL(indexed.url).hostname.replace(/^www\./,'');
 const website=await getCompanyWebsite(ticker);return website?new URL(website).hostname.replace(/^www\./,''):'';
}
export async function getDocuments(input:string):Promise<{documents:EvidenceDocument[];warnings:string[]}>{
 const ticker=normalizeTicker(input),warnings:string[]=[];
 const bundled=(corpus.documents as unknown as EvidenceDocument[]).filter(doc=>doc.ticker===ticker).map((doc,i)=>({...doc,id:doc.id||`bundled-${ticker}-${i}`,kind:inferredKind(doc)}));
 const db=database();if(!db)return {documents:bundled,warnings:['Persistent document storage is not configured.']};
 try{
  const rows=await db.prepare('SELECT d.id,d.ticker,d.title,d.url,d.kind,d.published_at,d.sha256,d.ingested_at,p.page,p.text FROM documents d JOIN document_pages p ON p.document_id=d.id WHERE d.ticker=? ORDER BY d.ingested_at DESC,p.page ASC').bind(ticker).all();
  const documents=new Map<string,EvidenceDocument>();
  for(const raw of rows.results||[]){const row=raw as Record<string,unknown>;const id=String(row.id);let doc=documents.get(id);if(!doc){doc={id,ticker,title:String(row.title),url:String(row.url),kind:String(row.kind),date:row.published_at?String(row.published_at):null,sha256:String(row.sha256),provenance:'Fetched from a verified company/exchange host; parsed and indexed by FINN',coverage:'full_document',pages:[]};documents.set(id,doc)}doc.pages.push({page:Number(row.page),text:String(row.text)})}
  const stored=[...documents.values()],storedUrls=new Set(stored.map(d=>d.url));
  return {documents:[...stored,...bundled.filter(d=>!storedUrls.has(d.url))],warnings};
 }catch(error){console.warn('FINN document storage read failed',{ticker,reason:error instanceof Error?error.message:'unknown'});return {documents:bundled,warnings:['Saved document storage could not be read; bundled evidence remains available.']}}
}
export async function listDocuments(ticker:string){const result=await getDocuments(ticker);return {ticker:normalizeTicker(ticker),documents:result.documents.map(({pages,...doc})=>({...doc,pageCount:pages.length})),warnings:result.warnings,allowedHost:await documentHost(normalizeTicker(ticker))};}
export async function fetchPrimaryDocument(input:{ticker:string;url:string;kind:string;title?:string;publishedAt?:string}):Promise<EvidenceDocument>{
 const ticker=normalizeTicker(input.ticker),host=await documentHost(ticker),verified=trustedSourceUrl(input.url,host);
 if(!verified)throw new Error(host?`Use an original document on ${host}, NSE or BSE.`:'Company website could not be verified. Use an NSE/BSE source or an indexed company.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 let bytes:Uint8Array,contentType='';
 try{
  const response=await fetch(verified,{redirect:'manual',signal:controller.signal,headers:{Accept:'application/pdf,text/html;q=0.9','User-Agent':'Mozilla/5.0 FINN-Research/1.0'}});
  if(!response.ok)throw new Error(`Primary source returned HTTP ${response.status}.`);
  contentType=response.headers.get('content-type')||'';
  if(Number(response.headers.get('content-length'))>16_000_000)throw new Error('Document exceeds the 16 MB limit.');
  const reader=response.body?.getReader();if(!reader)throw new Error('Primary source returned no content.');
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>16_000_000){await reader.cancel();throw new Error('Document exceeds the 16 MB limit.')}chunks.push(value)}
  bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 }finally{clearTimeout(timer)}
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.buffer as ArrayBuffer))).map(b=>b.toString(16).padStart(2,'0')).join('');
 let pages:EvidencePage[]=[];
 if(contentType.includes('pdf')||new TextDecoder().decode(bytes.slice(0,5))==='%PDF-'){
  const pdf=await getDocumentProxy(bytes,{isEvalSupported:false,useSystemFonts:false});
  try{if(pdf.numPages>600)throw new Error('Document exceeds the 600-page processing limit.');const parsed=await extractText(pdf,{mergePages:false});const texts=Array.isArray(parsed.text)?parsed.text:[parsed.text];pages=texts.map((text,i)=>({page:i+1,text})).filter(p=>p.text.trim().length>40)}finally{await pdf.destroy()}
 }else if(contentType.includes('html')||contentType.includes('text/plain')){
  const text=cleanHtml(new TextDecoder().decode(bytes));pages=text.length>40?[{page:1,text:text.slice(0,2_000_000)}]:[];
 }else throw new Error('Source must be a readable PDF or primary HTML disclosure.');
 if(!pages.length)throw new Error('No readable text was found. Scanned PDFs require OCR.');
 if(pages.reduce((sum,p)=>sum+p.text.length,0)>4_000_000)throw new Error('Extracted text exceeds the processing limit.');
 // Exchange hosts contain many companies; establish the requested ticker in the actual disclosure.
 if(/(?:^|\.)(?:nseindia|bseindia)\.com$/.test(new URL(verified).hostname)&&!pages.slice(0,4).some(p=>new RegExp(`\\b${ticker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(p.text)))throw new Error('The exchange disclosure does not identify the requested ticker in its opening pages.');
 return {id:`${ticker}-${sha.slice(0,24)}`,ticker,title:input.title||`${ticker} ${input.kind.replaceAll('_',' ')}`,url:verified,kind:input.kind,date:input.publishedAt||null,sha256:sha,coverage:'full_document',provenance:'Fetched directly from a verified company/exchange HTTPS host; page text extracted by FINN',pages};
}
export async function saveDocument(doc:EvidenceDocument){
 const db=database();if(!db)throw new Error('Persistent document storage is not configured.');
 const existing=await db.prepare('SELECT id FROM documents WHERE id=?').bind(doc.id).first();if(existing)return {id:doc.id,duplicate:true,pageCount:doc.pages.length};
 // Keep existing evidence until a complete replacement has been parsed. Immutable IDs make retries idempotent.
 await db.batch([db.prepare('INSERT OR IGNORE INTO documents(id,ticker,title,url,kind,published_at,sha256,ingested_at) VALUES(?,?,?,?,?,?,?,?)').bind(doc.id,doc.ticker,doc.title,doc.url,doc.kind,doc.date||null,doc.sha256||'',new Date().toISOString()),...doc.pages.map(p=>db.prepare('INSERT OR IGNORE INTO document_pages(document_id,page,text) VALUES(?,?,?)').bind(doc.id,p.page,p.text))]);
 return {id:doc.id,duplicate:false,pageCount:doc.pages.length};
}

