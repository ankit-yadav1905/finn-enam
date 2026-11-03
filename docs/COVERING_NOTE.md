To: assessment@enam.com
Subject: ENAM - IIT screening - 2027

Dear ENAM team,

Please find my FINN prototype, built around two investor workflows: an attention-ranked portfolio briefing and evidence-backed company investigation.

Prototype: [insert assessment-accessible deployed URL]
GitHub repository: [insert repository URL]
AI build history: [attach/export the original Codex conversation or insert share link]

FINN uses a mock portfolio of 18 Indian listed companies, with verified historical dossiers for Infosys, TCS and HCLTech. The central research demonstration tracks successive Infosys FY25 growth forecasts against the eventual 4.2% constant-currency outcome. Each forecast retains its date, target period, evidence and supersession context. Quarterly comparisons are calculated in code and suppressed when periods, units or reporting basis do not match.

I prioritised a mobile workflow with a materiality-ranked inbox, collapsible routine filings, saved signals, financial comparisons and inspectable sources. The historical replay is dated clearly. Live end-of-day and exchange adapters are separate; source failures do not silently become simulated data.

To keep the prototype economical, evidence retrieval works without a paid model key. Optional server-side model synthesis uses retrieved passages only. Cached source reads, a compact corpus and deterministic arithmetic reduce cost and improve traceability.

The deliberate trade-offs are limited curated coverage, offline PDF indexing, browser-local state, and refresh-time alerts. NSE blocked requests from the build environment; its adapter reports that limitation. The bundled answer corpus contains verified transcript passages, while annual reports are linked for inspection. Background notifications, broader primary-document extraction, and production ingestion monitoring would be the next steps.

The repository documents setup, data provenance, validation and limitations. Please start with the Infosys signal in the briefing, open its guidance timeline, and ask what changed in revenue growth guidance.

Regards,
[Your name]
