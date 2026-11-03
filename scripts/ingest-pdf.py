"""Index local primary-source PDFs for FINN research; never uploads files.

python scripts/ingest-pdf.py report.pdf --ticker INFY --url https://www.infosys.com/... --kind annual_report
Requires pypdf. Adds page-level evidence to data/corpus.json; rebuild to deploy.
The operator must verify that the local PDF matches its stated company source URL.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlparse
from pypdf import PdfReader

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('pdf', type=Path)
parser.add_argument('--ticker', required=True)
parser.add_argument('--url', required=True)
parser.add_argument('--kind', choices=['annual_report','transcript','results'], required=True)
parser.add_argument('--title')
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'data/corpus.json')
args = parser.parse_args()
ticker = args.ticker.upper().removesuffix('.NS')
if not re.fullmatch(r'[A-Z0-9][A-Z0-9&-]{0,24}', ticker):
    parser.error('Invalid NSE ticker')
url = urlparse(args.url)
if url.scheme != 'https' or not url.hostname or url.username or url.password:
    parser.error('Provide the HTTPS URL of the original company/exchange document')
reader = PdfReader(args.pdf)
pages = [{'page': i+1, 'text': page.extract_text() or ''} for i,page in enumerate(reader.pages)]
pages = [page for page in pages if len(page['text'].strip()) > 40]
if not pages:
    parser.error('No readable text; scanned documents require OCR before indexing')
sha = hashlib.sha256(args.pdf.read_bytes()).hexdigest()
document = {'id':sha[:16], 'ticker':ticker, 'url':args.url, 'title':args.title or args.pdf.stem, 'kind':args.kind, 'sha256':sha, 'provenance':'Operator-provided primary PDF; verify source URL matches the original file', 'pages':pages}
corpus = json.loads(args.output.read_text(encoding='utf-8')) if args.output.exists() else {'documents':[]}
corpus['documents'] = [doc for doc in corpus['documents'] if doc['id'] != document['id']] + [document]
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(corpus, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Indexed {len(pages)} pages for {ticker}; SHA-256 {sha}. Rebuild to update deployed research.")
