# ETF Guide for Czech Investors

US ETFs vs. European alternatives. On the site itself (Czech UI) the brand is **ETF tahák** ("ETF cheat sheet").

A mobile-first, conversion-focused landing page for Czech retail investors arriving from a mobile ad. It explains why US-listed ETFs (SPY, IVV, VOO, all on **NYSE Arca**) are usually not available to EU retail investors. It compares four verified European UCITS alternatives, and offers a free PDF cheat sheet in exchange for an e-mail address.

- Customer-facing copy is in Czech. Code and docs are in English.
- Static HTML/CSS/vanilla JS with no build step and no dependencies.
- **Status: demo, not deployed.** The lead form runs in **demo mode** and stores nothing until the privacy details are confirmed (see [Going live](#going-live)).

| | |
|---|---|
| Project brief (summary) | [`docs/project-brief.md`](docs/project-brief.md) |
| Research and verified data | [`docs/step-1-research.md`](docs/step-1-research.md) |
| Implementation plan | [`docs/implementation-plan.md`](docs/implementation-plan.md) |
| Ads | [`ads/ad-a.png`](ads/ad-a.png), [`ads/ad-b.png`](ads/ad-b.png) |
| Lead magnet | [`assets/tahak-etf.pdf`](assets/tahak-etf.pdf) (source: `tahak.html`) |
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

It is delivered **immediately** on the page after submit.

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
- **Strict CSP** (`netlify.toml`): only the site itself and GoatCounter are allowed. There are no inline scripts or styles.

## Conversion decisions

- **Message match:** `utm_content` switches the hero headline to match the ad that was clicked (A: problem, B: comparison). Only the exact values `ad_a_problem` and `ad_b_compare` are recognised (see [Ad variants and links](#ad-variants-and-links)). Any other value, or none, shows a neutral default.
- **Teaser above the fold:** below the subheadline, a one-line answer to the ad's promise with sourced fees: A (and default) „Místo SPY / VOO: CSPX nebo VUAA — stejný index S&P 500, roční náklady 0,07 %", B „S&P 500 (jen USA): CSPX a VUAA, 0,07 % ročně. Globální akcie: SWDA (rozvinuté trhy) 0,20 %, VWCE (vč. rozvíjejících se) 0,14 % ročně". A source line links to the comparison. A test checks that every fee in the teaser equals the fee shown in that fund's card.
- **CTA above the fold** on a 390px phone, repeated in the sticky header ("Tahák zdarma").
- **Short form:** e-mail only (required). The unused first-name field was removed. **Marketing consent is a separate, optional, unchecked box**; the PDF is given either way.
- **Immediate delivery:** after submit the form is replaced by a download button. There is no e-mail round-trip and no double opt-in wait.
- **Friction-free errors:** a Czech inline validation message, and on a network error the typed values are kept.
- **Spam:** Netlify honeypot plus a recorded `time_to_submit_ms` for later filtering. Nothing is blocked on timing, which avoids false positives. No CAPTCHA.

## Conversion hypothesis

> Visitors who just hit a broker's refusal to sell a US ETF have a specific, urgent question. A page that answers it neutrally and with verifiable sources, and that offers a reusable checklist for the next step in their broker app, will convert better than a generic "invest in ETFs" page. Matching the headline to the ad's promise further reduces drop-off in the first seconds.

Primary metric: **lead rate = `lead_success/<v>` ÷ `page_view/<v>`**, per ad variant `<v>`. Both come from the same `track()` source.

## A/B testing hypotheses (prioritised)

| # | Hypothesis | Change | Primary metric | Why this priority |
|---|---|---|---|---|
| 1 | **Problem framing (A) converts better than comparison framing (B)** for paid-social traffic, because it names the exact frustration the visitor just experienced. | Ad + hero A vs B (already built; split traffic 50/50 by ad set) | `lead_success/a` ÷ `page_view/a` vs `lead_success/b` ÷ `page_view/b` | Highest impact on both CTR and landing conversion. Zero extra build cost. |
| 2 | **Showing the form earlier increases leads** for high-intent visitors without hurting trust: a compact form directly under the hero, with the full comparison below. | Move the lead block above `#proc` (one HTML move) | Lead rate; guardrail: `comparison_view` rate and the share of `form_start` that reach `lead_success` | Likely large effect on a long mobile page; cheap; risk to trust is measurable. |
| 3 | **A visual preview of the PDF increases perceived value** and therefore form completion. | Thumbnail of page 1 of the cheat sheet next to the bullets | `form_start` → `lead_success` completion rate, and lead rate | Smaller expected effect and needs a design asset, so it comes last. |

Run one test at a time and decide on a pre-registered sample size; at demo-scale traffic none of these would reach significance quickly.

## Funnel analytics

GoatCounter (cookieless; its docs say it "probably doesn't require a GDPR consent notice"). It records `utm_campaign` and `utm_source` natively. **The ad variant travels in the event name** because GoatCounter doesn't record `utm_content`.

All funnel events, including the landing page view, are recorded by one function, `track()` in `assets/app.js`. The funnel therefore has a single source and always starts with `page_view`.

| Event path | Fires when |
|---|---|
| `page_view/<v>` | landing page (`index.html`) loaded; always the first event. Not fired on the thank-you page. |
| `cta_click/<v>` | hero or header CTA ("Stáhnout tahák zdarma (PDF)", "Tahák zdarma") clicked |
| `compare_click/<v>` | hero button "Zobrazit srovnání" clicked |
| `comparison_view/<v>` | the **first UCITS fund's key facts** (annual costs, `#srovnani .card .fact-key`) are at least 50 % visible (once). This small element comes right after the section intro, so the "Zobrazit srovnání" jump reaches it on 320×640 and larger screens. On a 320×568 phone the intro fills the screen after the jump, and the event fires after a short further scroll. |
| `form_start/<v>` | first focus in the form (once) |
| `form_submit/<v>` | submit with valid input |
| `lead_success/<v>` | lead accepted (Netlify 2xx; in demo mode: simulated) |
| `form_error/<v>` | network or server error |
| `magnet_download/<v>` | PDF link clicked (success panel or thank-you page) |
| `source_click/<v>` | a fund's source link clicked |

`<v>` is `a`, `b` or `default`. It is derived from `utm_content`, but it is **not** a URL value itself.

GoatCounter's own automatic pageview (from `count.js`) still runs. It shows the total traffic per URL and the campaign, but not the variant. Use `page_view/<v>` for funnel maths.

**Debug panel:** add `debug=1` to the URL, e.g. `/?utm_content=ad_a_problem&debug=1`. A box in the bottom-right corner then:
- shows which variant applied and why, e.g. "variant: default (utm_content=a, not recognised: use ad_a_problem or ad_b_compare)";
- lists every event as it fires, starting with `page_view`.

Elements without a `data-track` attribute (FAQ items, body text) record nothing when clicked.

### UTM attribution

On landing, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid` and `fbclid` are stored in `sessionStorage`:
- The first touch of the session wins, but a campaign visit replaces an earlier direct visit.
- Values are capped at 200 characters.
- They are sent with the lead as hidden fields, together with `landing_variant`, `landing_url` and `referrer`.

Every Netlify submission (and its CSV export) therefore carries its ad.

### Ad variants and links

`utm_content` must be **exactly** one of these values (lower case, with underscores):

| Ad | Image | `utm_content` | Headline shown | Event suffix |
|---|---|---|---|---|
| A: problem | `ads/ad-a.png` | `ad_a_problem` | „Broker vám nedovolil koupit SPY nebo VOO? Tady je, co si můžete koupit místo nich." | `/a` |
| B: comparison | `ads/ad-b.png` | `ad_b_compare` | „S&P 500, nebo globální akcie? 4 evropské ETF v jednom srovnání." | `/b` |
| none or anything else (e.g. `a`, `b`, `A`, `ad_a`) | — | — | default headline from `index.html` | `/default` |

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
ochrana-udaju.html    DRAFT privacy notice with [DOPLNIT] placeholders
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
docs/                 project brief, research, plan
ai-log/               Claude Code session exports (/export)
```

## Run and test locally

```sh
python3 -m http.server 8000            # then open http://localhost:8000/?utm_content=ad_a_problem&debug=1
node tests/e2e.mjs                     # 59 browser tests (CHROME=/path/to/chrome to override)
```

To regenerate the PDF after editing `tahak.html`:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer \
  --print-to-pdf=assets/tahak-etf.pdf "file://$PWD/tahak.html"
```

`tests/e2e.mjs` starts a local server that mimics Netlify Forms and sends the production CSP. It then drives headless Chrome over the DevTools protocol. It covers:
- **Form:** validation, demo mode (nothing sent), live mode against the mock endpoint (lead POSTed, server error handled), honeypot.
- **UTM:** both variants, persistence across navigation, first-touch rule, length cap. Short values like `a`/`b` fall back to the default headline.
- **Analytics:**
  - full funnel order starting with `page_view`, with variant tags;
  - `page_view` only on the landing page;
  - "Zobrazit srovnání" fires `compare_click` and then `comparison_view` at 1280×800, 390×844, 375×667, 360×640 and 320×640;
  - at 320×568 the jump alone does not fire `comparison_view`, but a short further scroll does;
  - no `comparison_view` on load or on a small peek;
  - events queued until GoatCounter loads, and no errors without it.
- **Debug panel:** shows `page_view` on load, explains an unrecognised `utm_content`, and renders the URL value as text, never as HTML.
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
  - form input borders have at least 3:1 contrast in light and dark.
- **CSP:** no CSP or console errors on any page.

## Deployment (Netlify)

The owner creates the accounts; nothing has been deployed yet.

1. Push this repository to GitHub.
2. Netlify → *Add new site → Import an existing project*. There is no build command; the publish directory is `.` (both are already set in `netlify.toml`).
3. The site works immediately in **demo mode**. No form is registered and no personal data is collected.

### Going live

Do this only after the privacy details are confirmed.

1. Complete `ochrana-udaju.html`: fill every `[DOPLNIT]` (controller, purposes and legal bases, retention, processors, rights), have it reviewed, and remove the "KONCEPT" banner.
2. In `index.html`, on `<form id="lead-form">`: add `data-netlify="true"` and change `data-lead-mode="demo"` to `"live"`. The demo notices then hide automatically.
3. Netlify → *Forms*: enable form detection and redeploy. Check that the form `lead` appears. Optionally add an e-mail notification.
4. GoatCounter: create a site. In `index.html` and `dekujeme.html`, replace `YOUR_CODE` and uncomment the `goatcounter-script` tag.
5. Remove `<meta name="robots" content="noindex">` if the page should be indexed.
6. Smoke test on the live URL with both ad links:
   - submit a test lead and check that its UTM fields appear in Netlify Forms;
   - download the PDF;
   - open `?debug=1` and confirm the events appear in GoatCounter.

## What was tested, and what was not

Tested locally:
- 59/59 e2e tests pass.
- W3C HTML validator: 0 errors on all pages except one intentional message, Netlify's non-standard `netlify-honeypot` attribute.
- W3C CSS validator: no errors.
- All 14 source links return HTTP 200.
- No horizontal overflow at 320/360/390/768/1280px.
- Contrast is AA in both themes.
- PDF: 2 pages, content checked visually.

**Not tested:**
- **The real Netlify deployment and Netlify Forms.** Only a local mock of its endpoint was tested.
- **Real GoatCounter ingestion.** Only a stand-in `count()` was tested. Production verification is step 6 of *Going live*.
- **Real devices** (iOS Safari, Android Chrome). Mobile was emulated in desktop Chrome.
- **Lighthouse.** Not run, because the CLI would require installing a dependency. It can be run from Chrome DevTools.
- **Native-speaker review of the Czech copy.**

## Known limitations

- **Collapsible sections and JavaScript:** „Podrobnosti" and „Americké ETF pro srovnání" are native `<details>` elements. They open and close without JavaScript on every screen size, with mouse, touch or keyboard. Only their automatic opening from 768px (48rem) needs `assets/app.js`. Without JavaScript, desktop visitors see them collapsed and can open them with one click.
- **Headline variant swap:** the default headline can flash briefly before `app.js` swaps in A/B, because the script is deferred. Server-side or edge rendering would remove this.
- **No e-mail delivery:** the PDF is downloaded on the page. Leads are only stored (once live), not e-mailed.
- **The PDF is not truly gated:** it is a static file. This is acceptable for a free resource.
- **Data freshness:** fees and fund sizes change. Re-check them against the sources before any real campaign.

## AI usage

Built with Claude Code. Genuine session exports created with `/export` are stored in [`ai-log/`](ai-log/). No logs were written or edited by hand.
