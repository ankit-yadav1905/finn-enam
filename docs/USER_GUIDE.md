# How to use FINN

**Open the site:** https://finn-enam-ashis.matangisharma2020.chatgpt.site/

FINN is a mobile-first investment research prototype. Use it to find portfolio disclosures that deserve attention, check unusual daily price/volume moves, and investigate company questions using original reports and earnings-call transcripts.

Public visitors can browse the site and research existing evidence without configuring an API key. Importing additional documents requires sign-in.

## A five-minute walkthrough

1. Open **Discover** and select a research card to preview a case study. Choose its research button to investigate the company, or select **Open your briefing**.
2. In **Briefing**, keep **Live portfolio** selected. Review the latest disclosures and **Source coverage**. If the last 24 hours are quiet, select **Last 7 days** or **Last 30 days**.
3. Choose **Needs attention**, open a disclosure with **Read filing**, and bookmark one you want to revisit. Find it later under **Saved**.
4. In **Research**, enter `ASIANPAINT`, select **Research**, and scroll to **Ask a better question.** Ask: `What does the annual report say about cash flow from operations?` Select **Investigate**, then open the returned source links and check the cited pages.
5. Enter `INFY` to explore its historical dossier. Compare management's successive FY25 forecasts with the reported annual outcome under **Promises vs. performance**. The historical figures are dated, not current market results.

## Find your way around

The navigation is at the top on desktop and at the bottom on mobile. Tap the FINN logo to return to Discover.

| Page | What to do | Information available |
| --- | --- | --- |
| **Discover** | Preview Infosys, HCLTech and Asian Paints case studies; search or filter the company universe | Research starting points and links into the briefing, portfolio and research workspace |
| **Briefing** | Change the date window, search disclosures, filter attention categories and inspect market signals | Portfolio exchange filings, filing dates, categories, source links, coverage and daily market threshold crossings |
| **Portfolio** | Select a company from the 18-company mock watchlist | Company name, NSE ticker, sector and whether a curated historical dossier is available |
| **Research** | Enter an NSE ticker, check latest data, inspect a dossier or ask a source-backed question | Available market data, announcements, historical financials and guidance, relevant document passages and original evidence |
| **Saved** | Return to bookmarked disclosures | Your saved filings within the selected briefing mode and date window |

The image cards are illustrative artwork; the linked company documents provide the financial evidence. Use the motion control near the top of the site to pause or enable decorative animations.

## Use the live portfolio briefing

Open **Briefing > Live portfolio**. The default window is the last 24 hours; the other options are 7 days and 30 days.

- **All disclosures** shows the current filtered stream, with higher-priority items first.
- **Needs attention** filters to the announcement categories you selected.
- **Alert categories** lets you select results, M&A, management changes, legal/regulatory events, credit ratings, dividends, capital spending and promoter pledging.
- **Include routine filings** expands lower-priority disclosures.
- **Read filing** opens the original exchange/company document. **Research** opens that company's workspace.
- The bookmark icon saves or removes a disclosure. Saved items and preferences are stored in the current browser, not synced between devices.
- **Refresh filings** requests a new check. The live briefing also checks every five minutes while the view is open.

Check **Source coverage** alongside the feed. A company with zero new filings and a company whose provider could not be reached are different outcomes. An empty feed does not prove that nothing happened.

## Check price and volume signals

The **Market watch** panel surfaces completed end-of-day sessions that cross your thresholds. It is not an intraday price feed.

1. Open the bell icon (**Alert preferences**).
2. Choose a daily price movement threshold and a volume multiple. Defaults are **+/-3% price** and **2x recent average volume**.
3. Select **Save preferences**.
4. In Market watch, select **Check market data** to apply the saved thresholds immediately.
5. Expand **Session coverage** to inspect each company's session date, close, volume and availability. Select a signal to research the company.

These controls configure the current browser's checks. They do not enable phone push notifications or email delivery. Separately configured scheduled monitoring has its own thresholds. Raw-close changes may reflect corporate actions, so inspect the original disclosures for context.

## Research a company

Enter a plain NSE ticker, such as `INFY`, `HCLTECH` or `ASIANPAINT`, and select **Research**. You can also start from a Portfolio card or a filing.

Select **Check latest data** to request the latest available completed-session close, daily percentage change and volume ratio, plus exchange announcement links. Check the displayed session date before interpreting a number.

For companies with a curated dossier, scroll through:

- **Business snapshot:** what the company does and its operating context.
- **The numbers, in context:** historical revenue, PBT and PAT, with comparable QoQ/YoY changes where available, units and source links. A dash means a value was not extracted or is not comparable; EBITDA is not populated in the curated tables.
- **Promises vs. performance:** management guidance, target period, reported outcome, status and supporting sources.
- **Insight cards:** selected historical observations and bull/bear considerations where provided.
- **Open the evidence:** original documents supporting the dossier.

These dossier sections are curated historical examples. They do not automatically become current when you check the latest market data. Infosys's successive forecasts relate to the same FY25 annual period; an earlier forecast can be superseded rather than represent a separate quarterly promise.

### Ask questions of the evidence

Under **Ask a better question.**, type a question and select **Investigate**. Useful examples include:

| Ticker | Question to try |
| --- | --- |
| `ASIANPAINT` | What does the annual report say about cash flow from operations? |
| `ASIANPAINT` | What does management say about demand conditions? |
| `HCLTECH` | What guidance does management give for revenue growth? |
| `INFY` | What changed in management's growth outlook? |

Availability depends on the indexed documents. HCLTech and Asian Paints have complete reports/transcripts indexed; Infosys and TCS have more limited verified excerpts. Example questions are starting points, not guarantees of an answer.

In the current deployment, an optional language-model key is not configured. Research therefore returns matching source passages rather than model-written analysis. Read the document/page references and coverage counts, and open the originals for context. When evidence is insufficient, FINN reports the gap instead of supplying an unsupported answer.

### Investigate another NSE ticker

The research workflow accepts tickers beyond the demo companies and attempts source discovery. A new ticker may have no curated dossier or accessible evidence.

To add evidence, expand **Add primary evidence**, choose **Annual report**, **Earnings transcript** or **Results filing**, and paste the original company/exchange document URL. Select **Import evidence** and follow the sign-in prompt if shown. After a successful import, ask the question again. **Indexed documents** lists the available documents and their coverage.

Imports accept supported official sources, not arbitrary news articles or broker research. Blocked, scanned or oversized PDFs may not be indexable; runtime limits are 16 MB and 600 pages. Existing indexed evidence remains available to public readers.

## Explore the historical replay

In **Briefing** or **Saved**, choose **Historical replay**. This uses a curated dataset dated **22 April 2025** with FY25 company dossiers. Search and filter the example signals, inspect **Why it matters**, open an original filing, or choose **Investigate** to continue into research.

Live and replay bookmarks are separate. If a saved filing is missing, check the mode and date window and include routine filings if needed. Switch back to **Live portfolio** for current source checks.

## When a result is missing

| Situation | What to try |
| --- | --- |
| No disclosures match | Widen the date window, clear search, include routine filings and check Source coverage. |
| Market data is unavailable or cached | Read Session coverage and the session date; retry with Check market data. |
| Research finds no supporting evidence | Ask a more specific question, inspect Indexed documents, or import an accessible official document after signing in. |
| A company has no dossier | Use Check latest data and the question box; curated historical sections are available only for the demo dossiers. |
| A source lacks a number | Open the original document. Missing figures are not zero, and historical figures are not current results. |

The prototype supports evidence review and a focused daily research workflow. Coverage depends on accessible providers and documents; it does not produce a complete automated investment report for every ticker.
