"""Index local primary PDFs with stable identity and one-based page evidence."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,unquote
from pypdf import PdfReader

def canonical_url(value):
    u=urlsplit(value)
    if u.scheme!='https' or not u.hostname or u.username or u.password or u.port not in (None,443):
        raise ValueError('Provide the original HTTPS company/exchange document URL')
    return urlunsplit(('https',u.hostname.lower(),unquote(u.path),u.query,''))

def document_id(ticker,url):
    return hashlib.sha256((ticker.upper()+'\n'+canonical_url(url)).encode()).hexdigest()

def migrate_corpus(corpus):
    """Idempotent ID-less migration. Prefer full docs to excerpts; dedupe source URLs."""
    documents={}
    for original in corpus.get('documents',[]):
        doc=dict(original)
        doc['ticker']=doc['ticker'].strip().upper().removesuffix('.NS')
        doc['id']=document_id(doc['ticker'],doc['url'])
        doc.setdefault('kind','transcript' if 'call' in doc.get('title','').lower() else 'annual_report')
        doc.setdefault('date',None)
        doc.setdefault('coverage','excerpt')
        doc['indexedPageCount']=sum(bool(p.get('text','').strip()) for p in doc.get('pages',[]))
        doc.setdefault('pageCount',None)
        old=documents.get(doc['id'])
        completeness=lambda d:(d.get('coverage')=='full_document',sum(len(p.get('text','')) for p in d.get('pages',[])))
        if old is None or completeness(doc)>=completeness(old):documents[doc['id']]=doc
    return dict(corpus,schemaVersion=2,documents=list(documents.values()))

def ingest(pdf,ticker,url,kind,title=None,date=None,output=None):
    ticker=ticker.strip().upper().removesuffix('.NS')
    if not re.fullmatch(r'[A-Z0-9][A-Z0-9&-]{0,24}',ticker):raise ValueError('Invalid NSE ticker')
    canonical_url(url)
    reader=PdfReader(pdf)
    pages=[{'page':i+1,'text':page.extract_text() or ''} for i,page in enumerate(reader.pages)]
    readable=[page for page in pages if page['text'].strip()]
    if not readable:raise ValueError('No readable text; scanned documents require OCR before indexing')
    sha=hashlib.sha256(Path(pdf).read_bytes()).hexdigest()
    doc=dict(id=document_id(ticker,url),ticker=ticker,url=url,title=title or Path(pdf).stem,kind=kind,date=date,sha256=sha,coverage='full_document',pageCount=len(pages),indexedPageCount=len(readable),provenance='Full text extracted from downloaded primary PDF; one-based PDF pages; blank/image-only pages contain no searchable text',pages=pages)
    target=Path(output) if output else Path(__file__).resolve().parents[1]/'data/corpus.json'
    corpus=migrate_corpus(json.loads(target.read_text(encoding='utf-8-sig')) if target.exists() else {'documents':[]})
    corpus['documents']=[d for d in corpus['documents'] if d['id']!=doc['id']]+[doc]
    target.parent.mkdir(parents=True,exist_ok=True)
    temp=target.with_suffix('.json.tmp')
    temp.write_text(json.dumps(corpus,ensure_ascii=False,indent=2),encoding='utf-8')
    temp.replace(target)
    return doc

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf',type=Path)
    parser.add_argument('--ticker',required=True)
    parser.add_argument('--url',required=True)
    parser.add_argument('--kind',choices=['annual_report','transcript','results'],required=True)
    parser.add_argument('--title')
    parser.add_argument('--date',help='Verified publication date YYYY-MM-DD; omit if unknown')
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    try:doc=ingest(**vars(args))
    except (ValueError,KeyError) as e:parser.error(str(e))
    print(f"Indexed {doc['indexedPageCount']}/{doc['pageCount']} pages for {doc['ticker']}; SHA-256 {doc['sha256']}. Rebuild deployed research.")

if __name__=='__main__':main()
