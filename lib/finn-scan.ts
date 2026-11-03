import {getMarket,mapBounded,parseSymbol} from './finn-feeds';
import {saveMarket,readMarket} from './finn-store';
export async function scanPortfolio(tickers:string[],price=3,volume=2){
 const unique=[...new Set(tickers.map(t=>parseSymbol(t).ticker))].slice(0,20);
 const coverage=await mapBounded(unique,4,async ticker=>{try{const result=await getMarket(ticker);if(result.status==='ok'){try{await saveMarket(ticker,result)}catch{}return result}try{const old=await readMarket(ticker);if(old)return {...old,status:'stale'};}catch{}return result}catch(e){return {ticker,status:'unavailable',message:e instanceof Error?e.message:'Price provider unavailable'}}});
 const alerts=coverage.flatMap((c:any)=>{
  if(!c.latest||c.stale)return [];const latest=c.latest,messages=[];
  if(Number.isFinite(latest.changePercent)&&Math.abs(latest.changePercent)>=price)messages.push(`price ${latest.changePercent>=0?'+':''}${latest.changePercent.toFixed(2)}%`);
  if(Number.isFinite(latest.volumeRatio)&&latest.volumeRatio>=volume)messages.push(`volume ${latest.volumeRatio.toFixed(2)}× recent average`);
  return messages.length?[{id:`${c.ticker}:${latest.date}:${price}:${volume}`,ticker:c.ticker,date:latest.date,message:messages.join(' · '),source:c.source}]:[];
 });
 return {status:coverage.some((c:any)=>c.status==='ok')?'ok':'unavailable',asOf:new Date().toISOString(),thresholds:{price,volume},alerts,coverage};
}
