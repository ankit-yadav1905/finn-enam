import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTicker, percentageChange, summarizePrices, classifyAnnouncement, trustedSourceUrl, retrievePassages, compareResults } from '../lib/finn-core.mjs';
test('valid NSE tickers normalize, query injection is rejected', () => {
  assert.equal(normalizeTicker(' infy.ns '), 'INFY'); assert.equal(normalizeTicker('M&M'), 'M&M');
  assert.throws(() => normalizeTicker('INFY?symbol=OTHER'));
});
test('growth uses positive comparable base only', () => {
  assert.equal(percentageChange(120,100),20); assert.equal(percentageChange(2,0),null); assert.equal(percentageChange(2,-1),null);
});
test('volume baseline excludes current session and uses prior 20', () => {
  const history=Array.from({length:22},(_,i)=>({date:String(i),close:100+i,volume:i===21?300:100}));
  const latest=summarizePrices(history); assert.equal(latest.volumeRatio,3); assert.equal(latest.baselineSessions,20); assert.ok(Math.abs(latest.changePercent-100/120)<1e-9);
});
test('priority distinguishes material results and routine meetings', () => {
  assert.equal(classifyAnnouncement('Quarterly financial results').priority,'high'); assert.equal(classifyAnnouncement('Investor meeting schedule').priority,'low');
});
test('only HTTPS primary hosts accepted including strict host boundaries', () => {
  assert.equal(trustedSourceUrl('http://nseindia.com/file'),null); assert.equal(trustedSourceUrl('https://nseindia.com.evil.com/file'),null); assert.equal(trustedSourceUrl('https://127.0.0.1/file'),null);
  assert.equal(trustedSourceUrl('https://www.infosys.com/report','infosys.com'),'https://www.infosys.com/report');
});
test('retrieval abstains without matching source passages', () => {
  assert.deepEqual(retrievePassages('The company reported revenue growth of six percent.','cash conversion'),[]);
  assert.equal(retrievePassages('The company reported revenue growth of six percent.','revenue growth').length,1);
});
test('financial comparison identifies QoQ across fiscal year and YoY', () => {
  const a={period:'Q1 FY25',basis:'consolidated',unit:'INR crore',revenue:120,pat:10};
  const b={...a,period:'Q4 FY24',revenue:100,pat:-2};
  const result=compareResults(a,b);
  assert.equal(result.comparison,'QoQ'); assert.equal(result.metrics.revenue.changePercent,20); assert.equal(result.metrics.pat.changePercent,null);
  assert.equal(compareResults(a,{...b,period:'Q1 FY24'}).comparison,'YoY');
});
test('financial comparisons reject mismatched basis units and periods', () => {
  const current={period:'Q4 FY25',basis:'consolidated',unit:'INR crore',revenue:100};
  const prior={...current,period:'Q3 FY25'};
  for (const bad of [{...prior,basis:'standalone'},{...prior,unit:'USD million'},{...prior,period:'FY24'},{...prior,period:'Q2 FY25'},{...prior,basis:''}]) assert.equal(compareResults(current,bad).comparable,false);
});
test('source retrieval accepts short exact management excerpts', () => {
  assert.equal(retrievePassages('The new guidance is 3.75% to 4.5% growth in constant currency.','guidance').length,1);
});

test('price-only sessions retain closes without inventing missing volume',()=>{
 const result=summarizePrices([{date:'2026-11-01',close:100,volume:null},{date:'2026-11-02',close:110,volume:null}]);
 assert.equal(result.close,110);assert.equal(result.changePercent,10);assert.equal(result.volume,null);assert.equal(result.volumeRatio,null);assert.equal(result.baselineSessions,0);
});
