# Data and research backend

## Endpoints

- `GET /api/market?ticker=INFY`: last three months of Yahoo daily bars; excludes today's unfinished session before 16:00 IST. Returns latest close, prior-session percentage change, and volume divided by the preceding twenty available sessions. Null denominators remain null. Historical raw closes are not adjusted for corporate actions; the response identifies this limitation.
- `GET /api/announcements?ticker=INFY`: NSE corporate announcements, normalized and classified by transparent keyword rules. Feed restrictions/timeouts return `503` with `status: unavailable`, never simulated live filings.
- `POST /api/research`: `{ "ticker": "INFY", "question": "What did management say about revenue growth?", "documents": [{ "url": "https://…", "title": "Annual report" }] }`. Documents are optional. Searches the bundled page-level corpus first, otherwise attempts NSE discovery and primary HTML extraction. Responds with `answer`, `sources`, `mode`, `status`, and warnings. Provided `text` is deliberately ignored: the server fetches URLs itself rather than treating caller content as independently verified evidence.

The current demo supports arbitrary valid NSE ticker syntax. Actual live data availability depends on the upstream host. It does not claim universal company coverage. Server HTML retrieval accepts only company domains obtained from exchange metadata and exchange domains. Redirects and non-HTTPS URLs are rejected. PDF extraction occurs during ingestion, not inside the Worker.

## Indexing a primary PDF

Install Python `pypdf`, then:

```sh
python scripts/ingest-pdf.py company-annual-report.pdf --ticker INFY --url https://www.infosys.com/path/to/original-report.pdf --kind annual_report
```

Verify the local file matches the original primary URL before indexing. The packet records SHA-256, exact page text and page numbers. Rebuild the site after changing `data/corpus.json`. Scanned PDFs without extractable text fail explicitly and require OCR.

## Optional model synthesis

Set server-only `OPENAI_API_KEY` and `OPENAI_MODEL` to a model available in the account. No key is shipped to the browser. The Responses API receives retrieved source passages, not the whole document. It is instructed to ground claims in those passages and cite source identifiers. If credentials or model service are unavailable, the endpoint still returns extractive passages, clearly labelled `mode: extractive`; it does not claim to have performed model reasoning. Model synthesis has not been live-tested without an API key.

## Reliability and boundaries

- Successful provider reads are cached for five minutes in a bounded process-local cache. Worker restarts clear it.
- Fetches have a twelve-second deadline and three-megabyte response cap.
- No background scheduler, Web Push delivery, persistent multiuser store, OCR or production rate limiting is implemented.
- Run `node --test tests/finn-core.test.mjs` for nine checks covering arithmetic, volume baselines, QoQ/YoY compatibility, input validation, classification, source-host validation and abstention. The full TypeScript check also passes.
- A permitted read-only network check returned Yahoo HTTP 200 and NSE HTTP 403. NSE blocks this host; its API returns an explicit unavailable state. Production access must be checked separately; cached replay is explicitly distinct from live data.

Official references: [NSE corporate announcements](https://www.nseindia.com/companies-listing/corporate-filings-announcements), [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create).
