# ETF Guide for Czech Investors: project brief (summary)

This is a short summary of what the project set out to build, written for this repository. It is not the original brief. Status notes describe the repository as of 2026-10-14.

## Goal

A mobile-first landing page in Czech for retail investors in the Czech Republic who arrive from a mobile ad.

The page:
- compares well-known US-listed ETFs with European (UCITS) alternatives;
- offers a free PDF cheat sheet. The intended model is to exchange it for an e-mail address; in the current demo the PDF is public and no e-mail is collected (see Status below).

Visitor-facing text is in Czech; code and technical documentation are in English.

## Ads and attribution

- Two ad variants with different framing: a problem-led ad and a comparison-led ad.
- Each ad links to the page with its own UTM parameters.
- The page reads these parameters and shows the headline that matches the ad. It attaches the attribution to the form data, which in demo mode is never sent, so no lead carries it yet.

## Comparison content and sources

- Only real instruments, with figures taken from primary sources (fund issuers' factsheets and pages, the EU regulation).
- Every figure shows its source link and the date it applies to. The few items that don't come directly from the fund manager are marked with an asterisk and explained on the page.
- The listing venue is stated precisely: the US funds trade on NYSE Arca, which is not the NYSE main board.
- Limits on EU retail access (PRIIPs/KID) are explained without overstating them. Anything that could not be verified is labelled as such.
- No profit promises, no performance claims, and a clear notice that the page is not investment advice.

## Lead magnet and form

- A two-page PDF cheat sheet. After a submission, the page shows the download link at once.
- Marketing consent is optional and is not a condition for receiving the PDF.
- **Status: demo mode. No real leads are collected.**
  - **With JavaScript:** the form validates the e-mail and shows the download link. Nothing is sent or stored.
  - **Without JavaScript:** the form controls are disabled, so nothing can be submitted.
  - **The PDF is publicly accessible.** It is a static file at `assets/tahak-etf.pdf`, reachable by its URL and linked from `dekujeme.html`. The form does not control access to it.
  - Demo submissions are recorded as the browser-side event `demo_lead_success`, never as `lead_success`.
  - The privacy notice is a draft with placeholders.
  - Real lead collection is enabled only after the privacy details are confirmed.

## Funnel tracking

- Events from the landing page view to the PDF download, each tagged with the ad variant.
- Cookieless analytics (GoatCounter).
- **Status:** not connected. The analytics script is disabled until a site code is provided, so events stay in the browser. They can be checked locally with the `?debug=1` panel.

## Design, testing and deployment

- Responsive, mobile-first layout with accessible contrast in light and dark mode.
- Automated browser tests plus manual checks. Anything that was not tested is reported as such.
- A free static host (Netlify) with its configuration prepared in the repository.
- **Status: not deployed.**
- Development history kept as small, incremental Git commits.

## Documentation

- A README covering:
  - the idea behind the page;
  - the reasoning behind its design and conversion choices;
  - the conversion hypothesis;
  - three prioritised A/B test hypotheses.
- A research report with sources and verification status for every data point.

## AI usage

- Built with Claude Code.
- Genuine session exports, created with `/export`, are kept in `ai-log/` without edits.
- Decisions, mistakes and corrections are recorded honestly in `ai-log/DECISIONS.md`.
