# ETF Guide for Czech Investors: project brief (summary)

This is a short summary of what the project set out to build, written for this repository. It is not the original brief. Status notes describe the repository as of 2026-10-11.

## Goal

A mobile-first landing page in Czech for retail investors in the Czech Republic who arrive from a mobile ad.

The page:
- compares well-known US-listed ETFs with European (UCITS) alternatives;
- offers a free PDF in exchange for an e-mail address.

Visitor-facing text is in Czech; code and technical documentation are in English.

## Ads and attribution

- Two ad variants with different framing: a problem-led ad and a comparison-led ad.
- Each ad links to the page with its own UTM parameters.
- The page reads these parameters, shows the headline that matches the ad, and attaches the attribution to every lead.

## Comparison content and sources

- Only real instruments, with figures taken from primary sources (fund issuers' factsheets and pages, the EU regulation).
- Every figure shows its source link and the date it applies to. The few items that don't come directly from the fund manager are marked with an asterisk and explained on the page.
- The listing venue is stated precisely: the US funds trade on NYSE Arca, which is not the NYSE main board.
- Limits on EU retail access (PRIIPs/KID) are explained without overstating them. Anything that could not be verified is labelled as such.
- No profit promises, no performance claims, and a clear notice that the page is not investment advice.

## Lead magnet and form

- A two-page PDF cheat sheet, available for download immediately after the form is submitted.
- Marketing consent is optional and is not a condition for receiving the PDF.
- **Status: demo mode.**
  - The form does not store or send any data.
  - The privacy notice is a draft with placeholders.
  - Real lead collection is enabled only after the privacy details are confirmed.

## Funnel tracking

- Events from the landing page view to the PDF download, each tagged with the ad variant.
- Cookieless analytics (GoatCounter).
- **Status:** the analytics script is disabled until a site code is provided. Events can be checked locally with the `?debug=1` panel.

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
