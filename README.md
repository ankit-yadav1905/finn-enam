# FINN - investment intelligence

Public prototype: https://finn-enam-ashis.matangisharma2020.chatgpt.site

Source repository: https://github.com/ankit-yadav1905/finn-enam

## Run

Node 22.13+; `npm ci`, then `npm run dev`. Open http://127.0.0.1:5173.
The app runs without an LLM key. Optional server-only OPENAI_API_KEY and OPENAI_MODEL enable evidence-grounded synthesis after a persistent daily-budget check.

For a fresh local database, build once (`npm run build`) and execute each pending SQL file under drizzle/ in order using:

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fast_bullseye.sql
```

Repeat with 0001_brown_storm.sql on a fresh database. Do not replay applied migrations. Hosted deployment applies schema migrations independently.

## Try it

1. Live portfolio starts with the last 24 hours. Check exchange coverage, expand routine filings, and inspect source links. Price/volume and filings refresh every five minutes while the view is open.
2. Set price and volume thresholds with the bell button; select material announcement categories in the briefing. Market scans show completed-session evidence and provider coverage.
3. Research ASIANPAINT and ask about operating cash flow. Its complete annual report and earnings-call transcript are indexed with page citations. HCLTECH also has a complete report/transcript.
4. To research another company, enter its NSE ticker. The engine attempts exchange discovery. Paste an official report/transcript URL under Add primary evidence; sign in to index and persist the document. Evidence remains available to public readers.
5. Switch to Historical replay for the three curated FY25 dossiers and the Infosys forecast-evolution tracker. That dataset is explicitly dated April 22, 2025.

## Architecture

- Vinext/React frontend; Cloudflare Worker API; D1 documents, pages, filings, last-success market snapshots and request budgets.
- Yahoo EOD bars with primary/alternate host fallback; NSE dated announcements with alternate BSE disclosure support. An official BSE security-directory snapshot resolves numeric scrip codes.
- Portfolio aggregation uses bounded concurrency, ISO timestamps, URL/ID deduplication and coverage per company. Provider failures and stale cached data are labelled.
- Runtime PDF extraction uses unpdf. Only verified company/exchange URLs are accepted; redirects are rejected through edge-compatible manual redirect handling.
- Research ranks relevant passages across pages, enforces financial-topic gates, preserves source/period metadata, and abstains on missing evidence. Model synthesis is optional; extractive mode is labelled.
- Document imports require sign-in, same-origin requests and persistent processing budgets. Public research has a request limit; paid synthesis has a persistent global budget.
- /mcp exposes an authenticated refresh_portfolio tool for unattended monitoring. Its persistent alert IDs prevent repeated delivery. A connected cloud task must be enabled and verified before claiming background monitoring is active.

## Verification

```
node --test tests/finn-core.test.mjs tests/evidence-quality.test.mjs tests/finn-feeds.test.mjs tests/pdf-parser.test.mjs
python -m unittest discover -s tests -p "test_*.py"
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
```

Python importer tests require pypdf and reportlab. See docs/VALIDATION.md for observed integration outcomes and data/PROVENANCE.md for document provenance.

## Honest scope

- Full indexed reports/transcripts: HCLTECH and ASIANPAINT. Infosys/TCS retain verified short excerpts where their origins denied downloads. Automated exchange discovery is opportunistic; a document URL can be supplied when discovery has no matching filing in the window.
- Known-company host directory plus exchange metadata verifies company origins. A completely unknown company whose metadata cannot be fetched may need a verified exchange URL.
- Scanned PDFs require OCR; runtime import limits are 16 MB and 600 pages. Larger documents can be indexed locally with scripts/ingest-pdf.py, then deployed. The operator must verify a local file matches its stated source URL.
- Historical financial tables, bull/bear cards and guidance outcomes are curated. Runtime research returns source passages, not fabricated financial ratios or model-generated analysis without a configured model.
- EBITDA is unavailable in the curated tables. Generic four-quarter promise-versus-delivery extraction and executive-biography enrichment remain extensions.
- Mobile/browser alert preferences are device-local. Unattended tool defaults are 3% price/2x volume unless the cloud task passes alternatives. Device push/email delivery is not implemented.
- Raw-close price changes can reflect corporate actions. Check source documents before interpreting a threshold crossing.
- The source and visible AI conversation export are published in this repository. Optional model setup remains deferred; the covering note still needs the submitter's name and manual email submission.

Price-only sessions retain close and price change when an exchange/provider omits volume. Volume and volume ratio remain null, never zero.
