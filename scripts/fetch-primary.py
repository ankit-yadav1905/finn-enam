"""Download verified source URLs into ignored work/primary; never changes the corpus."""
import json,urllib.request,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sources=[]
for c in json.loads((root/'data/demo.json').read_text(encoding='utf-8'))['companies']:
 for s in c['sources']:
  if s['type'] in ['annual_report','transcript']:sources.append(dict(s,ticker=c['ticker']))
sources += [dict(id='asian-ar25',ticker='ASIANPAINT',title='Asian Paints Integrated Annual Report FY25',url='https://static.asianpaints.com/content/dam/annual-folder-2425/pdf/Asian%20Paints%20IR%202024-25.pdf',type='annual_report',date='2025-06-02'),dict(id='asian-call3',ticker='ASIANPAINT',title='Asian Paints Q3 FY25 earnings call',url='https://www.asianpaints.com/content/dam/asianpaints/website/secondary-navigation/investors/announcements-pdfs/2024-2025/TranscriptQ3FY25.pdf',type='transcript',date='2025-02-07')]
out=root/'work/primary';out.mkdir(parents=True,exist_ok=True)
(out/'manifest.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
def get(s):
 p=out/(s['id']+'.pdf')
 if p.exists():return s['id']+' cached '+str(p.stat().st_size)
 try:
  req=urllib.request.Request(s['url'],headers={'User-Agent':'Mozilla/5.0','Accept':'application/pdf,*/*','Referer':s['url'].split('/investor')[0]})
  with urllib.request.urlopen(req,timeout=60) as r:data=r.read(80_000_001)
  if not data.startswith(b'%PDF') or len(data)>80_000_000:raise ValueError('Not an accepted PDF')
  p.write_bytes(data);return s['id']+' downloaded '+str(len(data))
 except Exception as e:return s['id']+' FAILED '+str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for line in pool.map(get,sources): print(line,flush=True)
