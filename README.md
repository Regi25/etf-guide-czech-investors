# ETF Guide for Czech Investors

US ETFs vs. European alternatives. On the site itself (Czech UI) the brand is **ETF tahák** ("ETF cheat sheet").

A mobile-first, conversion-focused landing page for Czech retail investors arriving from a mobile ad. It explains why US-listed ETFs (SPY, IVV, VOO, all on **NYSE Arca**) are usually not available to EU retail investors. It compares four verified European UCITS alternatives and offers a free PDF cheat sheet. The page shows an e-mail form before the download link, but the form runs in demo mode and the PDF itself is a public file (see [Current status](#current-status)).

- Customer-facing copy is in Czech. Code and docs are in English.
- Static HTML/CSS/vanilla JS with no build step and no dependencies.
- **Status: demo, not deployed.** See [Current status](#current-status).

### Current status

- **The form runs in demo mode.** Nothing is sent or stored, and no real leads are collected.
  - **With JavaScript:** a valid submission only shows the download link. The e-mail is not kept and the field is cleared. Only non-personal fields (attribution, variant, timing) remain in the page's memory (`window.__lastLeadPayload`) for local inspection, until the tab closes.
  - **Without JavaScript:** all form controls are disabled, so nothing can be typed or submitted.

  Real collection stays off until a full privacy notice exists (see [Going live](#going-live)).
- **Privacy page.** `ochrana-udaju.html` (Czech) describes only this demo's behaviour, and each statement is checked by a test: no e-mail sent or kept; nothing stored on the visitor's device (no cookies, `localStorage`, `sessionStorage` or IndexedDB); measurement switched off, with what GoatCounter would receive once it is switched on; no third-party scripts. Hosting-provider logs are mentioned only in general terms, because they are outside this repository. It states that it is a technical description, not a legal assessment, and it is **not** a privacy notice for real data collection.
- **The PDF is not gated.** `assets/tahak-etf.pdf` is a public static file. It can be opened directly by its URL, it is linked from `dekujeme.html`, and its link is already in the landing page's HTML (shown after the demo submission). The form does not control access to it.
- **Analytics is inactive.** The GoatCounter endpoint (`<meta name="goatcounter-endpoint" content="">`) is empty, so no request is made. Events stay in the page (`window.__events`, and the `?debug=1` panel). See [Funnel analytics](#funnel-analytics).
- **Nothing is stored on the visitor's device.** UTM attribution is read from the current URL on each page load and kept in memory only. No cookies, `localStorage`, `sessionStorage` or IndexedDB, and no third-party scripts.

### Quick start (local, nothing to install except Python 3)

1. In the project folder run `python3 -m http.server 8000`.
2. Open `http://localhost:8000/`. Ad variants: `?utm_content=ad_a_problem` or `?utm_content=ad_b_compare`. Add `&debug=1` to see the analytics events on the page.
3. Optional, for the automated tests: `node tests/e2e.mjs`. This needs Node 22+ and Google Chrome; it uses the macOS Chrome path by default, or set `CHROME=/path/to/chrome`.

The form runs in **demo mode**: you can submit it and get the PDF link, but nothing is sent or stored.

| | |
|---|---|
| Project brief (summary) | [`docs/project-brief.md`](docs/project-brief.md) |
| Research and verified data | [`docs/step-1-research.md`](docs/step-1-research.md) |
| Implementation plan | [`docs/implementation-plan.md`](docs/implementation-plan.md) |
| Ads | [`ads/ad-a.png`](ads/ad-a.png), [`ads/ad-b.png`](ads/ad-b.png) |
| Lead magnet | [`assets/tahak-etf.pdf`](assets/tahak-etf.pdf) (source: `tahak.html`) |
| Screenshots | [`docs/screenshots/`](docs/screenshots/) (ad A, ad B, PDF page 1, variant B at 375×667) |
| AI session logs | [`ai-log/`](ai-log/) |

## Concept

**Audience (assumption):** Czech beginner-to-intermediate investors, about 25–45, on mobile. They already use or are opening a broker app and know US ETFs from English-language content.

**Primary need (hypothesis):** "Which low-cost, diversified ETF can I actually buy as a Czech retail investor, and how do I tell the options apart?"

**Main barrier (hypothesis):** the moment their broker refuses SPY/VOO because no KID is available, plus jargon (UCITS, TER, Acc/Dist, ISIN vs ticker) and distrust of anyone asking for an e-mail.

**Value proposition:** one neutral, sourced comparison that turns the "my broker won't let me buy it" moment into an informed decision, with no profit promises and an explicit not-advice notice.

**Lead magnet:** „Tahák: Jak vybrat ETF jako český investor" (a cheat sheet on choosing an ETF as a Czech investor), a 2-page PDF:
- the comparison table with sources and dates,
- a 7-step checklist for buying an ETF in a broker app,
- the KID sections as defined by PRIIPs Art. 8(3).

After a (demo) submission, the download link appears at once on the page. The file itself is public and not protected by the form.

## Page structure and section order

The visitor comes from a mobile ad and gives the page a few seconds. The order moves them from the ad's question to the answer, to proof, and only then to the request for an e-mail.

| # | Section | What it does | Why it is here |
|---|---|---|---|
| 0 | Sticky header with „Tahák zdarma" | One tap to the form from anywhere on the page | Visitors who are already convinced should not have to scroll back |
| 1 | **Hero**: headline matched to the ad, one-line **teaser with sourced fees**, CTA „Získat tahák zdarma (PDF)", secondary „Zobrazit srovnání", not-advice line | Answers the ad's promise on the first screen. Variant A: „Místo SPY / VOO: CSPX nebo VUAA… 0,07 %". Variant B: S&P 500 vs global equities with fees. | The value must be visible before any form, and in the first seconds |
| 2 | **„Proč nekoupím SPY nebo VOO?"** (3 short steps, with sources) | Explains the problem (missing KID under PRIIPs) | Names the frustration from ad A and builds trust before showing alternatives |
| 3 | **„Srovnání"**: the S&P 500 UCITS cards (CSPX, VUAA), then global equity cards (SWDA, VWCE), then the US ETFs (collapsed), then the footnotes | The answer first, context later. On phones, secondary facts sit behind „Podrobnosti". | The visitor's question is "what can I buy instead?", so the alternatives come before the US originals |
| 4 | **CTA after the comparison**: „Získat tahák se srovnáním (PDF)" | Leads to the form at the moment the value has been shown | The interactive element (the comparison) leads to the contact; the PDF contains this comparison |
| 5 | **„Tahák"**: three bullets on what is inside, a preview of page 1, then the one-field form | The contact request | Asked only after the problem and the comparison: the value is clear before the form |
| 6 | **FAQ** (UCITS, KID, ISIN vs ticker, Acc/Dist, TER, "is this advice?") | Handles objections | For visitors still undecided after the form; it does not delay the ask |
| 7 | Footer | Full not-advice and risk notice | Required, but not part of the decision path |

This order is a design decision, not a measured result. A/B hypothesis 2 below tests the main alternative (the form earlier).

## Data and sources

All figures were checked on **2026-10-11** against issuer factsheets and pages, the EU regulation and the exchange operator (ICE). Every figure on the page links to its source and shows its as-of date. The full audit trail, including what remains unverified, is in [`docs/step-1-research.md`](docs/step-1-research.md) §4.

| Group | Funds | Shown as |
|---|---|---|
| US-listed, context only | SPY, IVV, VOO | Venue **NYSE Arca** (a separate exchange of NYSE Group, not the NYSE main board), fee, inception, size |
| UCITS on the S&P 500 (US only) | IE00B5BMR087 (iShares), IE00BFMXXD54 (Vanguard) | Cards |
| UCITS, global (broader, not directly comparable with the S&P 500) | IE00B4L5Y983 (MSCI World, developed markets), IE00BK5BQT80 (FTSE All-World, developed and emerging markets) | Cards |

Deliberate content rules:
- **No past performance** in the MVP, to avoid implied performance promises.
- **No broker names** and **no claim that a fund is available to every Czech investor**. The page says US ETFs are "usually" unavailable to EU retail clients because of missing KIDs, and asks readers to check with their broker. Czech registration and Czech-language KIDs of the UCITS funds are **unverified**.
- **Exceptions are marked with `*`** on the page and explained in one footnote (`#pozn-vyjimky`). The page sentence says the fund data was verified "ve factsheetech a na webech správců fondů" (in the managers' factsheets and websites) and that exceptions are starred. The exceptions are:
  - **SXR8 and EUNL:** iShares' German product pages show both tickers next to the right ISINs. That they are the *Xetra* tickers comes only from justETF.
  - **MSCI World "velké a střední firmy"** (large and mid caps): this phrase comes from the index provider MSCI, not the fund manager. "Rozvinuté trhy" (developed markets) is in the iShares factsheet as well.
- **VOO's size** has no date of its own in Vanguard's factsheet. The date shown (30. 6. 2026) is the factsheet's header date ("As of June 30, 2026").

## Design decisions

- **Mobile-first, one column.** The comparison leads with the European UCITS funds: cards with a label/value list on phones, two columns from 768px. On phones, each card's secondary facts (domicile, replication, share-class launch, size) sit in a native „Podrobnosti" disclosure. The US ETFs (SPY, IVV, VOO) follow in a disclosure „Americké ETF pro srovnání". `app.js` opens all of these disclosures from 48rem, so desktop shows everything. No data or source link is removed. The US table is a real table from 768px up. Below that, the same markup is restyled with CSS so each fund row stacks into a labelled block (labels from `data-label`), and every field, including the founding date, size and source, is readable without sideways scrolling (checked at 320–1280px).
- **The S&P 500 vs global split is a visual structure**, not a footnote: separate headings, a "širší rozložení" (broader diversification) tag and an explicit "nejsou přímo srovnatelné" (not directly comparable) sentence.
- **Trust before the ask:** the PRIIPs explanation and the sourced comparison come before the form. Sources sit directly under each card.
- **System fonts, no third-party assets.** This keeps the page fast and avoids sending visitor data to font CDNs.
- **Light and dark themes** follow the system setting. All text/background pairs pass WCAG AA contrast (≥4.5:1, computed).
- **Strict CSP** (`netlify.toml`): scripts, styles, fonts and requests come only from the site itself. The single exception is `img-src https://*.goatcounter.com` for the analytics pixel. There are no inline scripts or styles.

## Visual identity

The site, both ads and the PDF share one editorial look:

| | Light | Dark (site only) |
|---|---|---|
| Paper / background | `#FAF8F3` (cards `#FFFEFB`) | `#14171A` (cards `#1E2328`) |
| Ink / text | `#1B1F24` | `#E8E4DA` |
| Muted text | `#5B6470` | `#A7AFB8` |
| Rules | `#E3DED3`; input borders `#857E72` (≥ 3:1) | `#2C3238`; input borders `#727B84` |
| Accent (links, buttons, tickers) | deep green `#1F5C4A` | `#7CC4A8` |

- **Typography.**
  - Headings: serif `"Iowan Old Style", Charter, Georgia, "Noto Serif", serif`.
  - Body: the system sans-serif.
  - Tickers and ISINs: monospace.
  - Fees and dates: tabular figures.
  - No text below 13px on the site.
  - Czech diacritics were checked in Chrome on macOS (Iowan Old Style, Charter, Georgia and the system sans all render them without fallback). Android's Noto Serif was not available to check.
- **Where the tokens live.**
  - `assets/styles.css`: site, light and dark.
  - `ads/ads.css`: ads, light.
  - `assets/tahak.css`: PDF, light.

  The values are repeated in each file because the ads and the PDF are rendered as standalone pages. Change all three together; the tests check that fees match across the page, the ads and the PDF.
- **PDF.** The page background stays white so it prints cleanly. Table rows and the notes box never split across pages, and the 13 source URLs are clickable links.

## Conversion decisions

- **Message match:** `utm_content` switches the hero headline to match the ad that was clicked (A: problem, B: comparison). Only the exact values `ad_a_problem` and `ad_b_compare` are recognised (see [Ad variants and links](#ad-variants-and-links)). Any other value, or none, shows a neutral default.
- **Teaser above the fold:** below the subheadline, a one-line answer to the ad's promise with sourced fees: A (and default) „Místo SPY / VOO: CSPX nebo VUAA — stejný index S&P 500, roční náklady 0,07 %", B „S&P 500 (jen USA): CSPX a VUAA, 0,07 % ročně. Globální akcie: SWDA (rozvinuté trhy) 0,20 %, VWCE (vč. rozvíjejících se) 0,14 % ročně". A source line links to the comparison. A test checks that every fee in the teaser equals the fee shown in that fund's card.
- **CTA above the fold** on a 390px phone, repeated in the sticky header ("Tahák zdarma").
- **Short form:** e-mail only (required). The unused first-name field was removed. **Marketing consent is a separate, optional, unchecked box**; the PDF is given either way.
- **Immediate delivery:** after submit the form is replaced by a download button. There is no e-mail round-trip and no double opt-in wait. No e-mail is sent at all, and the PDF is a public file, not gated by the form.
- **Friction-free errors:** a Czech inline validation message, and on a network error the typed values are kept.
- **Spam:** Netlify honeypot plus a recorded `time_to_submit_ms` for later filtering. Nothing is blocked on timing, which avoids false positives. No CAPTCHA.

## Conversion hypothesis

> Visitors who just hit a broker's refusal to sell a US ETF have a specific, urgent question. A page that answers it neutrally and with verifiable sources, and that offers a reusable checklist for the next step in their broker app, will convert better than a generic "invest in ETFs" page. Matching the headline to the ad's promise further reduces drop-off in the first seconds.

### Expected conversion (hypothesis, not measured)

**Planning range: 4–8 % of landing-page visitors submit their e-mail (midpoint about 6 %).** This is an assumption for planning, not a measured result and not taken from a verified benchmark. The site has never been live, so there is no real data yet.

How the range is built, per 100 visitors from the ad:

| Step | Event | Assumption |
|---|---|---|
| Land on the page | `page_view` | 100 |
| See the comparison | `comparison_view` | 50–60 (mobile visitors leave quickly; the hero teaser already answers part of the question) |
| Start the form | `form_start` | 10–15 (the PDF is free, specific and previewed; the form has one field) |
| Submit a valid e-mail | `lead_success` (live) | 4–8 (some drop-off at the e-mail field, typical caution about financial topics) |

Assumptions behind it:
- **Traffic:** paid social on mobile, from people who are problem-aware (ad A) or comparison-curious (ad B). Ad A is expected to convert at the upper end (A/B hypothesis 1).
- **Offer:** a free, specific cheat sheet with real numbers, visible before the form; only one required field; no double opt-in.
- **Risks that would lower it:** an unknown brand, distrust of finance sites, and the PDF being available without the form.

Once real collection and analytics are switched on, these numbers are replaced by measured ones (see [Going live](#going-live)).

Primary metric (once live): **lead rate = `lead_success/<v>` ÷ `page_view/<v>`**, per ad variant `<v>`. Both come from the same `track()` source. In demo mode there are no leads; demo submissions are recorded as `demo_lead_success` and must not be counted as leads.

## A/B testing hypotheses (prioritised)

| # | Hypothesis | Change | Primary metric | Why this priority |
|---|---|---|---|---|
| 1 | **Problem framing (A) converts better than comparison framing (B)** for paid-social traffic, because it names the exact frustration the visitor just experienced. | Ad + hero A vs B (already built; split traffic 50/50 by ad set) | `lead_success/a` ÷ `page_view/a` vs `lead_success/b` ÷ `page_view/b` | Highest impact on both CTR and landing conversion. Zero extra build cost. |
| 2 | **Showing the form earlier increases leads** for high-intent visitors without hurting trust: a compact form directly under the hero, with the full comparison below. | Move the lead block above `#proc` (one HTML move) | Lead rate; guardrail: `comparison_view` rate and the share of `form_start` that reach `lead_success` | Likely large effect on a long mobile page; cheap; risk to trust is measurable. |
| 3 | **A visual preview of the PDF increases perceived value** and therefore form completion. | Thumbnail of page 1 of the cheat sheet next to the bullets | `form_start` → `lead_success` completion rate, and lead rate | Smaller expected effect and needs a design asset, so it comes last. |

Run one test at a time and decide on a pre-registered sample size; at demo-scale traffic none of these would reach significance quickly.

## Funnel analytics

**Status: inactive.** `assets/app.js` contains a GoatCounter integration that stays off until a real endpoint is configured. Until then, events are only recorded in the page (`window.__events`, `?debug=1`). No request is made, and no third-party script exists in the code.

### How it works when switched on

The page uses GoatCounter's documented **tracking pixel** (`/count?p=…`) from its own script. It does not use GoatCounter's `count.js`, which by default sends the full path including the query string and relies on the `Referer` header. `app.js` sends a hit only when **both** conditions hold:
- `<meta name="goatcounter-endpoint">` in `index.html` / `dekujeme.html` matches `https://<code>.goatcounter.com/count` exactly, and `<code>` is not a placeholder (`your-code`, `example`, …);
- the page is not on a local address (`file:`, `localhost`, `127.*`, `[::1]`, `0.0.0.0`).

Each hit is an image request with `referrerPolicy = "no-referrer"` and exactly these parameters:

| Parameter | Pageview | Event |
|---|---|---|
| `p` | the page path **without the query string**, e.g. `/` or `/dekujeme.html` | `<event>/<variant>`, e.g. `cta_click/a` |
| `t` | the page's fixed `<title>` | the event name |
| `e` | (not sent) | `true` |
| `rnd` | random cache-buster | random cache-buster |

Never sent: the e-mail or any form value, UTM values, `gclid`/`fbclid`, the full URL or the referrer. Only names on the fixed list in `app.js` (`EVENTS`, the table below) are tracked; any other `data-track` value is ignored. The variant is always `a`, `b` or `default`, derived from `utm_content` but never the URL value itself. The tests check all of this against intercepted requests on a non-local test host.

GoatCounter **does not receive the campaign or source** (UTM), on purpose. Campaign-level reporting comes from the ad platform. The variant, which is what the A/B test needs, travels in the event name.

### Events

All funnel events, including the landing page view, are recorded by one function, `track()` in `assets/app.js`. The funnel therefore has a single source and always starts with `page_view`.

| Event path | Fires when |
|---|---|
| `page_view/<v>` | landing page (`index.html`) loaded; always the first event. Not fired on the thank-you page. |
| `cta_click/<v>` | hero or header CTA ("Získat tahák zdarma (PDF)", "Tahák zdarma") clicked |
| `compare_cta_click/<v>` | CTA after the comparison ("Získat tahák se srovnáním (PDF)") clicked |
| `compare_click/<v>` | hero button "Zobrazit srovnání" clicked |
| `comparison_view/<v>` | the **first UCITS fund's key facts** (annual costs, `#srovnani .card .fact-key`) are at least 50 % visible (once). This small element comes right after the section intro, so the "Zobrazit srovnání" jump reaches it on 320×640 and larger screens. On a 320×568 phone the intro fills the screen after the jump, and the event fires after a short further scroll. |
| `form_start/<v>` | first focus in the form (once) |
| `form_submit/<v>` | submit with valid input |
| `lead_success/<v>` | **live mode only:** the lead was submitted and the server answered 2xx. Never fired in demo mode. |
| `demo_lead_success/<v>` | **demo mode only:** the form passed validation and the download link was shown. Nothing was sent; this is not a lead. |
| `form_error/<v>` | network or server error |
| `magnet_download/<v>` | PDF link clicked (success panel or thank-you page) |
| `source_click/<v>` | a fund's source link clicked |

`<v>` is `a`, `b` or `default`. On `dekujeme.html` it is always `default`, because attribution is not carried between pages.

In addition, every page load sends one plain pageview (path only, no variant). It shows total traffic per page. Use `page_view/<v>` for funnel maths.

**Debug panel:** add `debug=1` to the URL, e.g. `/?utm_content=ad_a_problem&debug=1`. A box in the bottom-right corner then:
- shows which variant applied and why, e.g. "variant: default (utm_content=a, not recognised: use ad_a_problem or ad_b_compare)";
- shows the analytics state: `active (<code>.goatcounter.com)`, `inactive (no endpoint configured)` or `inactive (local address)`;
- lists every event as it fires, starting with `page_view`.

Elements without a `data-track` attribute (FAQ items, body text) record nothing when clicked.

### What the aggregate counts can and cannot show

GoatCounter stores **counts per path per period**, not visitor records. Its "visitors" figure de-duplicates repeat hits from the same browser within about 8 hours (matched in memory on GoatCounter's side, not on the device).

They **can** show:
- how often each event happened per variant and per day, e.g. `cta_click/a` vs `cta_click/b`;
- approximate step ratios per variant, e.g. `form_submit/b ÷ page_view/b`, and once live, the headline conversion `lead_success/<v> ÷ page_view/<v>`;
- whether a step is badly broken: a step that suddenly drops to zero, or a ratio far outside the expected range.

They **cannot** show:
- a single visitor's path, the order of their steps, or where an individual dropped off. The funnel is built from totals per step, so a visitor may be counted at a later step without having been counted at an earlier one (e.g. a direct visit to `#tahak`);
- time to convert, or which CTA a particular person clicked before submitting;
- campaign, source, ad set or creative beyond the variant `a`/`b`/`default` (those come from the ad platform);
- exact numbers. Ad blockers and privacy tools block the pixel, so all counts are undercounts, and possibly unequally by variant or device. Bots may be counted. A visitor who returns after the 8-hour window is counted again;
- real leads while the form is in demo mode: `demo_lead_success` only means the download link was shown.

Small numbers will not separate the variants. For example, telling a 6 % lead rate from 4 % needs roughly 1,900 `page_view`s per variant (two-sided test, 5 % significance, 80 % power; see [Conversion hypothesis](#conversion-hypothesis)). Until then, differences between `a` and `b` are noise.

### Switching it on (owner)

1. Create a site at goatcounter.com (free for reasonable public use; see its terms). Note the code, e.g. `mysite`.
2. In the GoatCounter dashboard (*Settings*), **switch off** the optional data collection: browsers, operating systems, locations (country/region), languages and screen sizes. Leave the collection of individual pageviews **off** (the default). Check the exact labels in the dashboard; they may differ from these names.
3. In `index.html` **and** `dekujeme.html`, set `<meta name="goatcounter-endpoint" content="https://mysite.goatcounter.com/count">`. Nothing else changes; the CSP already allows the pixel.
4. Update `ochrana-udaju.html`: change „měření vypnuté" to say it is switched on, and match the description to the dashboard settings actually chosen. Update the test that checks this text.
5. Deploy, open `/?utm_content=ad_a_problem&debug=1` on the live URL, check that the panel says `active`, click a CTA, and confirm `page_view/a` and `cta_click/a` appear in the dashboard.

### UTM attribution

On each page load, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid` and `fbclid` are read from the **current URL** and kept in the page's memory only:
- Nothing is written to the device, so nothing carries over to the next page load. A visitor who reloads the page without the parameters, or opens it again later, sees the default headline.
- Values are capped at 200 characters.
- In live mode, they are sent with the lead as hidden form fields (to Netlify Forms, not to analytics), together with `landing_variant`, `landing_url` and `referrer`. Every Netlify submission (and its CSV export) therefore carries its ad.

### Ad variants and links

`utm_content` must be **exactly** one of these values (lower case, with underscores):

| Ad | Image | `utm_content` | Headline shown | Event suffix |
|---|---|---|---|---|
| A: problem | `ads/ad-a.png` | `ad_a_problem` | „Broker vám nedovolil koupit SPY nebo VOO? Tady je, co si můžete koupit místo nich." | `/a` |
| B: comparison | `ads/ad-b.png` | `ad_b_compare` | „S&P 500, nebo globální akcie? 4 evropské ETF v jednom srovnání." | `/b` |
| none or anything else (e.g. `a`, `b`, `A`, `ad_a`) | — | — | default headline from `index.html` | `/default` |

The creatives (`ads/ad-*.html`, rendered to 1080×1350 PNG):
- **Ad A** opens with the problem: an illustration labelled as an illustration, then „Broker vám nedovolil koupit SPY nebo VOO?". It then shows the exact variant A teaser, „Místo SPY / VOO: CSPX nebo VUAA — stejný index S&P 500, roční náklady 0,07 %", with CTA „Ukázat alternativy →".
- **Ad B** asks „S&P 500, nebo globální akcie?" and lists the four funds in two groups:
  - S&P 500, US only: CSPX 0,07 %, VUAA 0,07 %;
  - global equities: SWDA, MSCI World, developed markets, 0,20 %; VWCE, FTSE All-World, developed and emerging markets, 0,14 %.

  CTA „Porovnat ETF →".

Both carry the not-advice line, and every fee is checked against the fund cards by the tests.

#### Meta ad copy (Czech)

The copy uses the same facts and wording as the image and the matching landing variant. It makes no profit or return promises, and every fee is a verified annual-cost figure with its date. Each primary text is written so that the key point fits in the first ~125 characters, which Meta usually shows before "…Zobrazit více" (See more).

**Ad A: problem** (lands on `utm_content=ad_a_problem`)

| Field | Copy | Length |
|---|---|---|
| Primary text | Broker vám nedovolil koupit SPY nebo VOO? Americkým ETF obvykle chybí evropský dokument KID. Místo nich: CSPX nebo VUAA – stejný index S&P 500, roční náklady 0,07 % (podle správců fondů, ověřeno 11. 10. 2026). Dostupnost si ověřte u svého brokera. Tahák v PDF zdarma. Nejde o investiční doporučení. | 298 |
| Headline | Co koupit místo SPY a VOO | 25 |
| Description | Srovnání ETF se zdroji | 22 |
| CTA button | **Learn more** (Czech UI label: „Další informace") | — |

**Ad B: comparison** (lands on `utm_content=ad_b_compare`)

| Field | Copy | Length |
|---|---|---|
| Primary text | S&P 500, nebo globální akcie? 4 evropské ETF: CSPX a VUAA (S&P 500) 0,07 % ročně, globální SWDA 0,20 % a VWCE 0,14 %. SWDA pokrývá rozvinuté trhy, VWCE i rozvíjející se. Roční náklady podle správců fondů, ověřeno 11. 10. 2026. Tahák v PDF zdarma. Nejde o investiční doporučení. | 277 |
| Headline | 4 evropské ETF v jednom přehledu | 32 |
| Description | Poplatky, ISIN a zdroje | 23 |
| CTA button | **Learn more** (Czech UI label: „Další informace") | — |

Notes:
- **Why "Learn more":** both ads lead to the comparison page, not straight to the file. The download link appears after the (demo) form on that page, so "Download" would promise something the click itself does not deliver.
- **To check in Ads Manager before launch:**
  - the exact Czech CTA label;
  - Meta's current length guidance (commonly about 125 / 40 / 30 characters for primary text / headline / description);
  - the rules for financial-services ads in the Czech Republic.

  None of these were verified here.
- **If any fee changes,** update the image, the landing page, the PDF and this copy together. The tests cover the first three, not this README text.

Full ad URLs. The site is not deployed yet, so replace `YOUR-SITE.netlify.app` with the real Netlify domain:

```
Ad A: https://YOUR-SITE.netlify.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=etf_cz_2026q4&utm_content=ad_a_problem
Ad B: https://YOUR-SITE.netlify.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=etf_cz_2026q4&utm_content=ad_b_compare
```

For local testing, use the same query strings on `http://localhost:8000/`.

**Testing tip:** the first ad of a browser session is kept. After opening one test URL, a different `utm_content` in the same window will **not** change the headline. Use a new incognito window (or close all tabs of the site) for each test URL.

## Project structure

```
index.html            landing page (form in demo mode)
dekujeme.html         thank-you page (no-JS fallback for the live form)
ochrana-udaju.html    privacy page describing the demo's verified behaviour (Czech)
tahak.html            source of the PDF cheat sheet (print layout)
404.html
assets/app.js         attribution, headline variant, analytics, form
assets/styles.css     site styles (light/dark)
assets/tahak.css      cheat-sheet print styles
assets/tahak-etf.pdf  lead magnet
assets/tahak-nahled.jpg  preview of PDF page 1 (rendered from the PDF)
ads/                  ad-a / ad-b as HTML + 1080x1350 PNG
tests/e2e.mjs         dependency-free browser tests (Node 22+, Chrome)
netlify.toml          Netlify config, CSP and security headers
docs/                 project brief, research, plan, screenshots/
ai-log/               Claude Code session exports (/export)
```

## Run and test locally

```sh
python3 -m http.server 8000            # then open http://localhost:8000/?utm_content=ad_a_problem&debug=1
node tests/e2e.mjs                     # 82 browser tests (CHROME=/path/to/chrome to override; ONLY=<regex> runs a subset)
```

To regenerate the PDF after editing `tahak.html`:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer \
  --print-to-pdf=assets/tahak-etf.pdf "file://$PWD/tahak.html"
```

`tests/e2e.mjs` starts a local server that mimics Netlify Forms and sends the production CSP. It then drives headless Chrome over the DevTools protocol. Chrome maps the test host `etf.test` to the local server and fails to resolve every other unknown name; every request to `*.goatcounter.com` is intercepted and answered locally, so the tests never reach GoatCounter. It covers:
- **Form:** validation, demo mode (nothing sent), live mode against the mock endpoint (lead POSTed, server error handled), honeypot.
- **Demo safety:**
  - **Without JavaScript:** the controls are disabled. Clicking, typing, Enter and clicking submit send no request that could carry the e-mail, and the page does not navigate.
  - **With JavaScript:** the controls are enabled and no request carries the e-mail.
  - **Events:** `demo_lead_success` in demo; `lead_success` only after a live 2xx, and neither after a server error.
  - **PDF:** reachable directly, without the form.
- **CTAs:** the CTA after the comparison sits after the cards, the US table and the footnotes and before the form; it has the primary style, is full width and at least 44 px tall on phones, is tracked as `compare_cta_click` and lands on the form. The hero CTA leads to the form and does not promise a direct download.
- **Privacy claims:**
  - the privacy page has no draft markers and contains the statements on device storage, measurement (switched off), hosting and scope;
  - in the browser, after a demo submission and visits to every page: no cookies, and empty `localStorage`, `sessionStorage` and IndexedDB; no requests to other hosts;
  - in the code: no cookie or storage APIs (`localStorage`, `sessionStorage`, IndexedDB, Cache Storage) and no third-party script tags in any site file.
- **UTM:** both variants; attribution comes only from the current URL and does not carry over to the next load; length cap. Short values like `a`/`b` fall back to the default headline.
- **Analytics:**
  - full funnel order starting with `page_view`, with variant tags;
  - `page_view` only on the landing page;
  - "Zobrazit srovnání" fires `compare_click` and then `comparison_view` at 1280×800, 390×844, 375×667, 360×640 and 320×640;
  - at 320×568 the jump alone does not fire `comparison_view`, but a short further scroll does;
  - no `comparison_view` on load or on a small peek;
  - **inactive:** no analytics request with an empty, placeholder, `http:`, look-alike-host or extra-query endpoint, even on a public host; none on `127.0.0.1` or `localhost` even with a valid endpoint;
  - **active** (public test host, valid endpoint): the exact hit sequence; only `p`, `t`, `e`, `rnd`; pageview paths without the query string; event paths are approved names with `/a`, `/b` or `/default`; no `Referer` header; no e-mail, form value, UTM value, click ID or host name in any hit; an unapproved `data-track` name is ignored;
  - every `data-track` name in the site is on the approved list.

  Mutation check (2026-10-14): these tests fail on the previous `app.js` (`sessionStorage`, `count.js` hook) and on each of eight deliberate breakages: query string in the pageview path, referrer policy removed, `127.*` not treated as local, unknown names allowed, e-mail added to a hit, placeholder endpoint accepted, a `localStorage` write, the campaign added to the event path.
- **Debug panel:** shows `page_view` on load, explains an unrecognised `utm_content`, shows the analytics state, and renders the URL value as text, never as HTML.
- **Mobile layout:**
  - the US table shows every field without horizontal scrolling at 320, 360 and 390px;
  - it keeps its table layout at 768 and 1280px;
  - every `data-label` matches its column header;
  - Chrome keeps the native table semantics (column and row headers, cells) in the stacked layout;
  - no horizontal overflow at 320, 375, 390, 768 and 1280px with every disclosure open.
- **Conversion (M4):**
  - the teaser for the default, A and B variants: text, fees equal to the fund cards, source link, and teaser plus primary CTA on the first 320×640 and 375×667 screen;
  - UCITS cards before the US ETFs; the disclosures are closed on phones, open from 48rem and toggle with Enter;
  - the first-name field is gone and not submitted;
  - the PDF preview loads, has alt text, sits beside the list and is under 60 KB;
  - anchor jumps land flush under the sticky header;
  - form input borders have at least 3:1 contrast in light and dark;
  - „Podrobnosti" collapsed on 320/375/390 px, toggling with Enter and Space, with the expanded state exposed.
- **Ads and PDF (M5):**
  - both ads fit 1080×1350, carry the not-advice line and never say „celý svět";
  - their fees equal the fund cards;
  - ad A repeats the variant A teaser;
  - ad B shows the S&P 500 / global split with each fund's coverage;
  - the PDF source fees equal the cards;
  - the PDF has exactly 2 pages, and all 13 source URLs are clickable links.
- **CSP:** no CSP or console errors on any page.

## Deployment (Netlify)

The owner creates the accounts; nothing has been deployed yet.

1. Push this repository to GitHub.
2. Netlify → *Add new site → Import an existing project*. There is no build command; the publish directory is `.` (both are already set in `netlify.toml`).
3. The site works immediately in **demo mode**. No form is registered, and the site's own code collects no personal data. What the hosting provider logs is outside this repository and is not verified here.

### Going live

These are **future** steps. None of them is done; the current behaviour is described in [Current status](#current-status). Do this only after a full privacy notice is ready.

1. Replace `ochrana-udaju.html` with a full privacy notice: controller and contact, purposes and legal bases, retention, processors (e.g. Netlify) and any transfers outside the EU, data-subject rights. Have it reviewed. The current text describes only the demo and becomes inaccurate once data is collected.
2. In `index.html`, on `<form id="lead-form">`: add `data-netlify="true"` and change `data-lead-mode="demo"` to `"live"`. The demo notices then hide automatically, and `lead_success` starts firing for accepted submissions.
3. Decide on visitors without JavaScript. The controls are wrapped in `<fieldset id="lead-fields" disabled>`, so without JavaScript nothing can be submitted. To accept native (no-JS) submissions in live mode, remove the `disabled` attribute. Netlify would then receive the POST and show `dekujeme.html`.
4. Netlify → *Forms*: enable form detection and redeploy. Check that the form `lead` appears. Optionally add an e-mail notification.
5. GoatCounter (optional, independent of the form): follow [Switching it on](#switching-it-on-owner), including the dashboard settings and the privacy-page update.
6. Remove `<meta name="robots" content="noindex">` if the page should be indexed.
7. Smoke test on the live URL with both ad links:
   - submit a test lead and check that its UTM fields appear in Netlify Forms;
   - download the PDF;
   - open `?debug=1`, check that the panel says `analytics: active`, and confirm the events appear in GoatCounter.

## What was tested, and what was not

Tested locally:
- 82/82 e2e tests pass.
- W3C HTML validator: 0 errors on all pages except one intentional message, Netlify's non-standard `netlify-honeypot` attribute.
- W3C CSS validator: no errors.
- All 14 source links return HTTP 200.
- No horizontal overflow at 320/360/390/768/1280px.
- Contrast is AA in both themes.
- PDF: 2 pages, content checked visually.

**Not tested:**
- **The real Netlify deployment and Netlify Forms.** Only a local mock of its endpoint was tested.
- **Real GoatCounter ingestion.** The requests were checked as sent by Chrome, but they were answered by the test, not by GoatCounter. Production verification is the last step of [Switching it on](#switching-it-on-owner).
- **Real devices** (iOS Safari, Android Chrome). Mobile was emulated in desktop Chrome.
- **Lighthouse.** Not run, because the CLI would require installing a dependency. It can be run from Chrome DevTools.
- **Native-speaker review of the Czech copy.**

## Known limitations

- **Collapsible sections and JavaScript:** „Podrobnosti" and „Americké ETF pro srovnání" are native `<details>` elements. They open and close without JavaScript on every screen size, with mouse, touch or keyboard. Only their automatic opening from 768px (48rem) needs `assets/app.js`. Without JavaScript, desktop visitors see them collapsed and can open them with one click.
- **Headline variant swap:** the default headline can flash briefly before `app.js` swaps in A/B, because the script is deferred. Server-side or edge rendering would remove this.
- **No e-mail delivery:** the PDF is downloaded on the page. Leads are only stored (once live), not e-mailed.
- **The PDF is not gated:** it is a public static file (direct URL, linked from `dekujeme.html` and from the no-JS note). The form does not control access. This is acceptable for a free resource, but the form is not an access control.
- **Data freshness:** fees and fund sizes change. Re-check them against the sources before any real campaign.

## How AI was used

**Setup.** The project was built in one Claude Code session (model Claude Opus 5.5), with no sub-agents. The owner gave instructions step by step. The agent worked in stages and stopped for review. Since 2026-10-11 it stops after **every** milestone; passing tests do not count as approval. Commits, the history rewrite and any outward step happen only after the owner's explicit approval.

**What was delegated to the agent**
- Research and data verification: web search, reading issuer factsheets (PDF text extraction), checking listing venues, fees, dates and fund sizes.
- Code: HTML, CSS and JavaScript of the page, the form in demo mode, attribution and analytics events, accessibility details.
- A dependency-free browser test suite (`tests/e2e.mjs`), validators, screenshots.
- The two ads, the PDF cheat sheet and its preview, the documentation.
- Audits on request (data, privacy, requirements) and Git operations, including the e-mail history rewrite (with backup and an approved plan).

**What the owner decided or did**
- Choices: the NYSE Arca interpretation, Netlify and GoatCounter as the plan, demo-only form, the „globální akcie" wording, privacy approach, publishing.
- Manual checks in the browser, the answer to open questions, account creation, and the `/export` command.

**Instructions the agent worked under** (from the owner's prompts):
- Do not invent prices, fees, tickers, sources or availability claims; label anything unverified.
- Never fabricate logs; only genuine `/export` files go into `ai-log/`.
- No dependencies, no new services, no real data collection until a privacy notice exists.
- Explain planned changes before risky steps (history rewrite) and stop for approval.

**How the output was checked**
- **Automated browser tests:** 82 tests run in headless Chrome against a local mock server, for layout at 320–1280 px, form behaviour with and without JavaScript, events, data consistency between page, PDF and ads, and privacy claims.
- **Mutation runs:** new tests were also run against the previous code to confirm they fail without the change.
- **Validators and links:** W3C HTML/CSS validators, link checks of all sources.
- **Screenshots:** reviewed at mobile and desktop widths in light and dark.
- **Data audit:** against issuer factsheets; the owner independently checked three values.
- **Owner review:** manual checks after milestones.

**Where the AI was wrong, and how it was fixed** (details in [`ai-log/DECISIONS.md`](ai-log/DECISIONS.md)):
1. **Data sources.** First data partly came from justETF (secondary) because Vanguard's VOO page did not load. It was replaced by issuer factsheets, and one fee conflict (VWCE 0.19 % vs 0.14 %) was resolved to the issuer's 0.14 %.
2. **Page copy.** The page said all data was verified with the fund managers, which was not literally true. The wording was corrected, and the exceptions are marked with an asterisk.
3. **Analytics gaps found by the owner's manual test:** unrecognised `utm_content` values, an untracked button, `comparison_view` not firing, and no `page_view`. 19 passing tests had missed them.
4. **A false technical claim.** The agent stated that an old visibility check fired at 1px. A mutation test and direct observation showed this was false in Chrome; it was corrected openly.
5. **Mistakes in its own tests:** a regex escaped wrongly in a template string, `-0` not returned by DevTools, a missing key-event detail. Each was caught by a mutation run or a failing test.
6. **Visual and document bugs:** a strip of the wrong background under the header after anchor jumps (scroll margin larger than the header), and the PDF growing to 3 pages after a restyle. Both were fixed and are covered by tests.
7. **Privacy bug found in the pre-submission audit.** Without JavaScript, the demo form could still POST the e-mail. A test against the old markup confirmed it; it was fixed by disabling the controls until JavaScript runs. Demo submissions also emitted the real `lead_success`; they now emit `demo_lead_success`.
8. **Process.** Early on, the agent completed several milestones in one run. The owner then required a stop after each milestone.

### Session exports

Session exports created with `/export` are stored in [`ai-log/`](ai-log/) (`*.txt`), unedited except for one documented e-mail redaction (below). [`ai-log/DECISIONS.md`](ai-log/DECISIONS.md) is a separate written summary of decisions and corrections, drafted with Claude and reviewed by the owner. It is not an export.

There are two genuine exports of the same Claude Code session. They are **cumulative**: each `/export` contains the whole conversation from its first prompt up to the moment of export.

| File | Covers | Note |
|---|---|---|
| `2026-10-11-research-and-mvp.txt` | Session start through the MVP summary (11:30 on 2026-10-11) | First export |
| `2026-10-11-m1-to-m5.txt` | Session start through the Meta ad-copy commit (exported 2026-10-11, 15:26) | Includes everything in the first export, then M1–M5. The name refers to the part it adds. **One redaction:** see below. |

Neither file was trimmed or merged, and the overlap is kept as exported.

**One redaction in the second export.** Line 2899 of `2026-10-11-m1-to-m5.txt` quoted the author's personal e-mail address. On 2026-10-14, before publication, that address was replaced with `[e-mail redacted]`. Nothing else in either export was changed. The original, unredacted file is kept privately by the owner.
- SHA-256 of the original: `3e2da4118634dda743f03ad25eba6660ef61ae345ef1036c03105923eb835406`
- SHA-256 of the published file: `cf470977cc26b9baaa071ec1414fd423ef5a87cf43a971e9c887df00bd3b2c30`

**Commit hashes inside the exports are the old ones.** The same rewrite replaced the personal e-mail in all commit metadata with a GitHub noreply address, which changed every commit hash. The exports were not edited to follow, so they cite pre-rewrite hashes; [`docs/commit-hash-map.md`](docs/commit-hash-map.md) maps each old hash to the new one. Work after the second export is not in any export yet: the pre-submission audit and the demo-form safety fix, recorded in Git history. A later `/export` under a new filename would add it without overwriting either file.
