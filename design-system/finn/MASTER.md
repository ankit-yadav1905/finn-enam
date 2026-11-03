# FINN UI/UX system

Applied skill: ui-ux-pro-max from https://github.com/nextlevelbuilder/ui-ux-pro-max-skill, installed 3 November 2026.

## Verified guidance and product adaptation

Searches: investment intelligence dashboard / financial analytics dashboard --design-system; keyboard focus modal --domain ux; accessible forms dashboard --stack react.

Verified style match: Minimalism & Swiss Style, suitable for enterprise dashboards. The generator's Enterprise Gateway landing pattern did not fit the working investment tool after one narrower retry; it was rejected rather than persisted as a verified application layout. The layout below is a product-specific adaptation of the skill's accessibility and hierarchy guidance.

## Direction

A quiet, credible analyst workspace. Preserve FINN's emerald identity. A dark forest navigation rail anchors a light, readable workspace. Filings form the primary column; market signals and provider controls form a secondary desk. No marketing hero, motion library or decorative imagery.

## Semantic tokens

Background #F5F7F4; surface #FFFFFF; foreground #172C27; muted text #536760; primary #17664B; on-primary #FFFFFF; primary-soft #E6F1E9; border #DCE5DF; focus #087A5C; warning text #80520D on #FFF2D8; destructive text #A03F32 on #FAEAE6. Defined centrally in app/globals.css.

Typography: existing DM Sans body and Manrope headings retained to preserve identity and avoid extra assets. Tabular numerals for financial values. Body16px on mobile; supporting text12px or larger where practical. Compact metadata10-11px is supplementary, never the sole actionable label.

## Interactions

- Native button/input/select/summary semantics with clear names and selected state.
- Prominent focus rings, skip link, safe bottom navigation clearance and 44px primary pointer targets.
- Native modal dialog provides focus containment, Escape dismissal and focus return.
- Category settings and diagnostics are progressively disclosed; source availability remains visibly summarised.
- Bookmarks are SVG controls with pressed state. Saved navigation reads the same live-signal store.
- Async controls show busy state, disclosure skeletons reserve space, and one polite region announces contextual coverage.
- Reduced motion disables nonessential transitions/animation. No new motion dependency.
- Long financial text and URLs wrap. Horizontal overflow is limited to intentionally scrollable financial tables.

## Responsive contract

375px and phone landscape: one disclosure column, 3 compact summary cells, secondary desk after filings, bottom navigation. Tablet: two-column desk when space permits. Desktop:228px navigation rail, flexible filing stream,310-340px secondary desk.

## Scope

This pass changes presentation, visible hierarchy, saved-item navigation and preferences accessibility. It preserves APIs, finance calculations, model configuration, document provenance, monitoring rules and deployment audience.

## Editorial refresh override - 3 November 2026

The user subsequently requested an interactive, image-led experience inspired by the Mirko Romanelli Dribbble reference. `pages/discover.md` supersedes the presentation/layout/motion decisions above for the new Discover view and shared editorial navigation. Functional APIs, finance/provenance conventions and accessibility requirements remain applicable. This is a visual iteration, not a claim that the separate audit's backend gaps have been repaired.
