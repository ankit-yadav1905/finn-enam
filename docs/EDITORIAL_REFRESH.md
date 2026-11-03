# Editorial UI refresh - 3 November 2026

The user requested a more interactive, image-led website inspired by the Mirko Romanelli industrial-design reference. FINN now opens with a Discover view: oversized typography, original material imagery, research previews, a numbered process accordion and a company explorer. Shared navigation gives direct access to the existing Briefing, Portfolio, Research and Saved workflows.

Three local WebP artworks total 242,998 bytes. They are illustrative, not company photographs or financial evidence. Details are in public/images/ASSET_PROVENANCE.md. No new runtime dependency was added.

Interaction includes finite hero entrance, scroll reveals, small pointer-only image tilt/zoom, preview-dialog transitions, mobile gallery previous/next controls and hover/press feedback. A persistent user animation toggle and system reduced-motion CSS/JS paths are provided. Dialogs retain native focus containment, Escape dismissal and focus return.

Verification: TypeScript and production build passed; the two new React components passed the existing ESLint configuration. Desktop and mobile previews opened, Escape returned focus, animation pause exposed all reveal content, mobile gallery navigation advanced, Dixon search and no-match state worked, and 18 portfolio tiles rendered. No page overflow at 375, 768, 1024 or 1440 pixels in tested views. The live briefing returned all 18 source checks; a case-study action prefilled an Asian Paints question, and research returned eight original-document passages. No captured browser errors/warnings in those representative interactions.

The native OS reduced-motion setting was not changed during browser testing; its implementation was inspected and the app's explicit pause control was exercised. These checks are not a complete accessibility certification.

This refresh changes presentation and interaction. It does not implement the outstanding backend/model/extraction items documented by the earlier audit. That audit remains a snapshot of its named source commit.
