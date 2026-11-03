import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSymbol,normalizeFilingDate,deduplicateEvents,mapBounded,getMarket,getAnnouncements,getDigest} from '../lib/finn-feeds.ts';
const json=value=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
test('exchange suffix is retained and injection is rejected',()=>{assert.equal(parseSymbol('infy.ns').ticker,'INFY');assert.equal(parseSymbol('500209.BO').exchange,'BSE');assert.throws(()=>parseSymbol('INFY?x=1'));});
test('NSE and timezone-less BSE timestamps are interpreted as IST',()=>{assert.equal(normalizeFilingDate('03-Nov-2026 12:00:00'),'2026-11-03T06:30:00.000Z');assert.equal(normalizeFilingDate('2026-11-03T12:00:00.500'),'2026-11-03T06:30:00.500Z');assert.equal(normalizeFilingDate('bad'),null);});
test('same PDF is deduplicated without conflating different companies',()=>{const event={id:'1',ticker:'INFY',date:'2026-11-03',url:'https://nseindia.com/a.pdf'};assert.equal(deduplicateEvents([event,{...event,id:'2'},{...event,id:'3',ticker:'TCS'}]).length,2);});
test('portfolio fetching respects bounded concurrency and keeps input order',async()=>{let active=0,max=0;const output=await mapBounded([1,2,3,4,5],2,async n=>{max=Math.max(max,++active);await new Promise(resolve=>setTimeout(resolve,5));active--;return n*2;});assert.equal(max,2);assert.deepEqual(output,[2,4,6,8,10]);});
test('Yahoo host failure falls back and excludes unfinished session',async()=>{let calls=0;const now=Date.parse('2026-11-03T08:00:00Z');const fetcher=async()=>{if(++calls===1)return new Response('',{status:429});return json({chart:{result:[{timestamp:['2026-10-30','2026-11-02','2026-11-03'].map(d=>Date.parse(d)/1000),meta:{currency:'INR'},indicators:{quote:[{close:[100,110,120],volume:[100,200,400]}]}}]}});};const result=await getMarket('INFY',{now,fetcher});assert.equal(result.status,'ok');assert.equal(result.diagnostics[0].code,'HTTP_429');assert.equal(result.latest.date,'2026-11-02');assert.equal(result.latest.close,110);});
test('exchange failure uses exact BSE symbol mapping and normalizes filings',async()=>{const now=Date.parse('2026-11-03T10:00:00Z');const fetcher=async url=>{if(String(url).includes('www.nseindia'))return new Response('',{status:403});if(String(url).includes('ListofScripData'))return json([{scrip_id:'INFY',SCRIP_CD:'500209'}]);return json({Table:[{NEWSID:'abc',NEWSSUB:'Quarterly financial results',NEWS_DT:'2026-11-03T12:00:00',ATTACHMENTNAME:'file.pdf'}],Table1:[{ROWCNT:1}]});};const result=await getAnnouncements('INFY',{now,hours:24,fetcher});assert.equal(result.status,'ok');assert.equal(result.exchange,'BSE');assert.equal(result.events[0].date,'2026-11-03T06:30:00.000Z');assert.equal(result.events[0].priority,'high');assert.equal(result.diagnostics[0].code,'HTTP_403');});
test('all providers denied yields unavailable, never fake empty-success coverage',async()=>{const result=await getDigest(['INFY','TCS'],24,{fetcher:async()=>new Response('',{status:403})});assert.equal(result.status,'unavailable');assert.equal(result.events.length,0);assert.equal(result.coverage.length,2);assert.equal(result.totals.available,0);});


test('edge runtime fetch uses manual redirect rejection, never unsupported error mode',async()=>{
 let seen;
 const result=await getAnnouncements('INFY',{fetcher:async(_url,init)=>{seen=init.redirect;assert.equal(init.redirect,'manual');return json([])}});
 assert.equal(seen,'manual');assert.equal(result.status,'ok');
});
