# Verification - 3 November 2026

## Automated checks

- 24 Node tests: arithmetic, compatible reporting bases, relevance/abstention, materiality, symbol parsing, dates, deduplication, bounded concurrency, provider fallback, edge-compatible redirects and real PDF parser extraction.
- 3 Python tests: migration of legacy ID-less documents, idempotent reimport, and URL validation.
- TypeScript check passes; production bundle builds.

## Actual integration checks in local Worker

- INFY and ASIANPAINT EOD endpoints returned HTTP200 with completed session 2026-11-02.
- Eighteen-company 24-hour exchange digest returned HTTP200, all18 source checks available,11 disclosures and4 high-priority events at test time. Counts are time-dependent.
- Portfolio threshold scan returned real price and volume crossings. Missing symbols/providers were shown explicitly, not as zero changes.
- HCLTech original transcript was fetched, parsed and persisted:25 pages. Repeated import returned duplicate:true with the same ID.
- ASIANPAINT research returned annual-report cashflow passages. INFY cashflow question abstained when its small indexed corpus lacked cashflow evidence.
- D1 storage health returned true. Live market and event persistence enabled.

## Root cause corrected

Cloudflare fetch rejects redirect:'error'; the previous generic API catch concealed this. Providers never received those requests. Both feed and document code now use redirect:'manual' and reject non-success response statuses, preserving the redirect boundary without the unsupported option.

## Remaining verification/setup

- Public-host checks must pass after deployment; local success is not treated as proof of public success.
- Optional model synthesis remains unconfigured/untested as requested.
- Background scheduling requires the authenticated Site tool to be connected and an actual cloud-task refresh/readback. Do not claim it is active from the endpoint's existence.
- GitHub and original chat export remain separate submission steps.

Price-only sessions retain close and price change when an exchange/provider omits volume. Volume and volume ratio remain null, never zero.
