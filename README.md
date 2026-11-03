# FINN - investment intelligence

Mobile-first portfolio briefing and company research prototype for the ENAM AI Engineer Build Challenge.

## Run

Node 22.13+ is required. From this directory:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. No API key is needed for the verified historical demo or extractive research. To enable optional synthesis, set server-only OPENAI_API_KEY and OPENAI_MODEL before starting the server. Never put keys in public files.

## Try this in three minutes

1. Open the briefing. Its replay date is April 22, 2025. Change the digest window, search a company, save a signal, and collapse routine announcements.
2. Investigate Infosys. Compare Q4 revenue/profit changes; then follow the FY25 growth guidance revisions from 1-3% through the final 4.5-5% range, against the reported 4.2% outcome. Original forecasts are explicitly marked as superseded.
3. Ask "What changed in revenue growth guidance?" Matching transcript passages include source IDs and PDF page links.
4. Open Portfolio, select a company, and check latest data. Yahoo end-of-day prices and NSE announcements are attempted independently. Unavailable sources are identified.
5. Configure price and volume thresholds. Refreshing market data evaluates those thresholds. Save/review state and preferences persist in this browser.

## Product decisions

The home screen allocates attention: material events first, routine filings collapsed, and a concise explanation of why each event matters. Research connects management claims to outcomes instead of producing a generic company essay. Financial arithmetic runs in code; missing data stays missing. Evidence, reported facts, and inference are visibly distinguished.

## Architecture

- React client served by Vinext/Vite with Next-compatible routes; production deployment targets a Cloudflare Worker.
- `/api/market`: Yahoo daily bars, completed-session checks, price change and prior-session volume baseline.
- `/api/announcements`: NSE announcements classified by transparent rules, with timeout and failure handling.
- `/api/research`: ticker-scoped retrieval from indexed primary document pages; optional model synthesis with evidence citations.
- `data/corpus.json`: bundled verified transcript excerpts. `scripts/ingest-pdf.py` indexes additional annual reports/transcripts for any valid NSE ticker with page text and SHA-256.
- `public/data/demo.json`: dated curated replay. `data/build_demo.py` reproduces it. See `data/PROVENANCE.md` and `docs/BACKEND.md`.
- Successful upstream responses have a bounded, five-minute process cache. Models receive selected evidence only.

## Validation

```sh
node --test tests/finn-core.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Nine financial/data tests cover percentage arithmetic, missing/zero/negative bases, compatible QoQ/YoY periods, units/accounting basis, volume baselines, ticker validation, source hosts, and announcement classification.

## Scope and limitations

- Mock portfolio: 18 companies across 10 sectors. Deep historical dossiers: Infosys, TCS and HCLTech; seven curated signals. This replay is not a complete exchange announcement archive.
- Research accepts arbitrary NSE ticker syntax; automatic coverage depends on accessible upstream documents. Additional PDFs can be indexed locally, then require a rebuild. It is not universal automated PDF ingestion.
- In this environment Yahoo responded successfully; NSE returned HTTP 403. Exchange data failure is explicit. No news or broker research substitutes for primary-source analysis.
- Annual-report source links are provided, but the small bundled retrieval corpus currently contains transcript excerpts. Broader balance-sheet and cash-flow questions may abstain.
- EBITDA is not extracted in the demo. Operating profit is never relabelled EBITDA. Reporting units and consolidated accounting basis are preserved. TCS has a YoY comparator only, HCLTech a single quarter.
- Push is an in-app digest and refresh-time threshold evaluation. Background polling, device notifications and multiuser persistence are future work.
- Optional model synthesis has not been tested with an API key. Extractive research works without one.
- GitHub publishing and model setup were deferred by the user. A hosted private preview is not an externally accessible assessment link until its sharing is deliberately configured.

## Submission

See `docs/COVERING_NOTE.md`, `docs/BUILD_HISTORY.md`, and `docs/SUBMISSION_CHECKLIST.md`. The build history is a decision log, not a substitute for the original coding-agent conversation export requested by the brief.
