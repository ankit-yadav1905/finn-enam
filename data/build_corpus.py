"""Small verified transcript excerpt index; PDF page numbers are one-based."""
import json,importlib.util
from pathlib import Path
root=Path(__file__).resolve().parents[1]
demo=json.loads((root/'data/demo.json').read_text(encoding='utf-8'))
sources={s['id']:s for c in demo['companies'] for s in c['sources']}
rows=[
 ('INFY','infy-call1',5,'we have revised our revenue growth guidance for the full financial year to 3% to 4% growth in constant currency.'),
 ('INFY','infy-call2',4,'The new guidance is 3.75% to 4.5% growth in constant currency.'),
 ('INFY','infy-call3',4,'we are revising our revenue growth guidance to growth of 4.5% to 5% in constant currency.'),
 ('INFY','infy-call4',3,'Our revenues grew at 4.2% in constant currency terms. Our operating margin was 21.1%.'),
 ('HCLTECH','hcl-call4',10,'revenue growth guidance for the full year is 2% to 5% in constant currency. EBIT margin guidance is at 18% to 19%.'),
 ('TCS','tcs-call1',12,"We have said that FY'25 will be better than FY'24 overall."),
]
docs=[]
for ticker,sid,page,text in rows:
 assert len(text.split())<=25,(sid,len(text.split()))
 s=sources[sid]
 docs.append(dict(ticker=ticker,title=s['title'],url=s['url'],date=s['date'],kind='transcript',coverage='excerpt',provenance='Verified short excerpt from official company earnings-call transcript; one-based PDF page; historical replay as of 2025-04-22',pages=[dict(page=page,text=text)]))
spec=importlib.util.spec_from_file_location('ingest',root/'scripts/ingest-pdf.py')
ingest=importlib.util.module_from_spec(spec);spec.loader.exec_module(ingest)
path=root/'data/corpus.json'
existing=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'documents':[]}
# Never downgrade a full downloaded document to the small bootstrap excerpt.
corpus=ingest.migrate_corpus(dict(documents=existing['documents']+docs))
path.write_text(json.dumps(corpus,indent=2,ensure_ascii=False),encoding='utf-8')
print('Wrote',len(docs),'verified transcript excerpts')
