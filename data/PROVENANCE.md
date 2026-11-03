# Curated replay provenance

The demo is a historical replay with a 22 April 2025 cutoff, not a live market dashboard. Its 18-company portfolio is illustrative. Financial figures and announcements are actual company disclosures, not simulated prices or fabricated news. Coverage is concentrated on Infosys, TCS and HCLTech. Every source is linked in `public/data/demo.json`.

## Extraction and conventions

- Infosys quarterly consolidated IFRS results are in INR crore. Shareholder PAT is the after-minority-interest figure. Q4 FY24 is the comparative column in the FY25 Q4 release. The FY25 quarterly sequence has separate quarter-end dates and publication dates.
- TCS results are consolidated IFRS in USD million. The dataset includes Q4 FY24 and Q4 FY25, enabling a year-on-year comparison only. Revenue/PBT/shareholder net income are read from the consolidated statements in the official Q4 FY25 release. FY24 operating margin is rounded from 1,914 / 7,363.
- HCLTech Q4 FY25 revenue and net income are USD million, read from the earnings-call transcript, PDF pages 10–11. PBT is not extracted.
- EBITDA is null in this extraction. Operating margin/EBIT must never be presented as EBITDA.
- Infosys guidance comes from the original April FY24 results and FY25 Q1/Q2/Q3 transcripts: PDF pages 5, 4 and 4 respectively. Actual FY25 constant-currency growth of 4.2% and operating margin of 21.1% appear on page 3 of the Q4 FY25 call transcript.
- The initial 1–3%, July 3–4%, October 3.75–4.5% and January 4.5–5% figures are successive FY25 forecasts, not four independent quarterly promises. Earlier forecasts were superseded. Comparing each with the eventual annual result illustrates forecast evolution.
- HCLTech FY26 guidance is pending at the replay cutoff. The app must not compare it with FY25 actuals. TCS qualitative commentary is deliberately marked not comparable.
- Annual reports are FY24 reports available before the replay cutoff. TCS publication date is unknown and deliberately null.
- Dividend declarations and earnings-call availability are separated for interaction testing but originate from the same results cycle. They should not be counted as independent risk events.
- Primary document links were inspected with web tools on 3 November 2026. Some company origins block scripted downloads (Infosys returned HTTP 403 in this environment). Link availability in a browser does not imply automated ingestion always succeeds.

`build_demo.py` reproducibly writes the curated JSON to both `data/demo.json` and `public/data/demo.json`. It is a data-generation script, not a live scraper. Summaries and bull/bear points are curated inferences, clearly marked as such. No statement implies a runtime model call or exhaustive portfolio monitoring.

## Expanded research corpus, 3 November 2026

The research corpus is separate from the historical portfolio replay. It now indexes the complete text layer of four downloaded official PDFs: HCLTech FY24 annual report (364 PDF pages), HCLTech Q4 FY25 call (25 pages), Asian Paints FY25 annual report (282 PDF pages), and Asian Paints Q3 FY25 call (40 PDF pages). Asian Paints is intentionally outside the demo portfolio, proving that the same page retrieval path works for another company. Its FY25 annual report was published after the portfolio replay cutoff and must not be described as evidence available on 22 April 2025.

The annual report uses two-page spreads; citations identify one-based **PDF** pages, not the printed page numbers. For example, Asian Paints consolidated operating cash flows appear on PDF page 225. HCL cash conversion is on PDF page 12 of the Q4 FY25 call. The remaining Infosys and TCS documents are explicitly labelled `coverage: excerpt` because the source origins rejected automated download with HTTP 403. They are not represented as complete documents.

Raw source PDFs and the download manifest are in ignored `work/primary/`. `scripts/fetch-primary.py` fetches verified original company URLs. `scripts/ingest-pdf.py` imports the text with a PDF-byte SHA-256 plus a stable source identity derived from ticker and canonical URL. Reimporting replaces the existing source; legacy excerpts missing IDs migrate without duplication. `data/build_corpus.py` adds bootstrap excerpts without overwriting full documents. Schema version 2 records `coverage`, `pageCount`, and `indexedPageCount`. Extraction covers the text layer; charts or scanned-only text need OCR and are not claimed searchable.
