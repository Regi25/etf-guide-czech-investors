# Commit-hash map (before and after the e-mail rewrite)

On 2026-10-14, before the first public push, the Git history was rewritten once with `git filter-repo` to replace the author's personal e-mail address with a GitHub noreply address in the commit metadata, and to redact the one occurrence of that address in `ai-log/2026-10-11-m1-to-m5.txt` (see `ai-log/README.md`). Commit contents, messages, names and dates are otherwise unchanged, but every commit hash changed.

The session exports in `ai-log/` were not edited to follow the new hashes, so they still cite the **old** ones. This table, generated from filter-repo's `commit-map`, maps each old hash to the new one (oldest first).

| Old | New | Date | Subject |
|---|---|---|---|
| `4bccd5e` | `dd9d47c` | 2026-10-11 11:14 | docs: add research report (verified ETF data) and implementation plan |
| `78d79f4` | `1596386` | 2026-10-11 11:18 | feat: landing page structure, responsive styles and verified ETF comparison |
| `163e614` | `2f28f61` | 2026-10-11 11:22 | feat: lead form (demo mode), immediate PDF access, thank-you and draft privacy page |
| `ae8a50f` | `f058486` | 2026-10-11 11:24 | feat: UTM attribution and ad-matched headline variants |
| `c9b68d9` | `2506ce2` | 2026-10-11 11:26 | feat: funnel analytics with GoatCounter events and debug log |
| `685862d` | `91e3989` | 2026-10-11 11:27 | chore: Netlify config with strict CSP and security headers, 404 page |
| `28ef92d` | `5f34178` | 2026-10-11 11:29 | feat: two ad variants (A problem, B comparison) as HTML and 1080x1350 PNG |
| `a5c04b0` | `50b2d5c` | 2026-10-11 11:30 | docs: README (concept, decisions, conversion and A/B hypotheses, funnel, deploy, test status) and ai-log folder note |
| `76eb31f` | `b39ea81` | 2026-10-11 12:18 | docs: add Claude Code session export (research and MVP) |
| `637b21c` | `53d3275` | 2026-10-11 12:36 | fix(analytics): record page_view, track compare button, fire comparison_view on what phones see |
| `6f69453` | `592d04f` | 2026-10-11 13:02 | fix(content): accurate verification wording, starred exceptions on page and in PDF |
| `cca889a` | `bccc2c2` | 2026-10-11 13:02 | chore: add .gitignore (macOS, temp/backup, editor and local tooling files) |
| `04249c4` | `e9cb0c2` | 2026-10-11 13:02 | docs(ai-log): decisions and corrections log (reviewed by owner) |
| `2825aee` | `ff3373a` | 2026-10-11 13:33 | docs: rename project brief and adopt the name "ETF Guide for Czech Investors" |
| `3ab7a0e` | `8413dcc` | 2026-10-11 13:51 | fix: make US ETF comparison readable on mobile |
| `e18473f` | `ef4a9ce` | 2026-10-11 14:13 | style: editorial design tokens and typography (M2) |
| `7e05276` | `25c7853` | 2026-10-11 14:14 | feat: ticker-first UCITS fund cards with key facts and tappable sources (M3) |
| `52b9e30` | `d131d6c` | 2026-10-11 14:55 | feat: mobile conversion and spacing refinement (M4) |
| `81f093b` | `0211d3b` | 2026-10-11 15:07 | fix: "globální akcie" wording for variant B and clearer fund coverage |
| `2c931c9` | `403915c` | 2026-10-11 15:14 | feat: align ads and PDF with the editorial identity (M5) |
| `e2e6b29` | `a63daef` | 2026-10-11 15:25 | docs: Meta ad copy (primary text, headline, description, CTA) for ads A and B |
| `c54de03` | `6f2a599` | 2026-10-14 07:43 | fix: demo form cannot transmit e-mail; separate demo event from lead_success |
| `f9d2f8f` | `e44a928` | 2026-10-14 07:44 | docs: project brief reflects the demo-only form and public PDF |
| `7e4f2aa` | `5923eb3` | 2026-10-14 07:44 | docs(ai-log): add second genuine session export and explain the overlap |
| `0f18fc0` | `9bcb2b9` | 2026-10-14 12:38 | feat: verified demo privacy page; demo form keeps no e-mail |
