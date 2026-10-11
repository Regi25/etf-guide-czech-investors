# ETF tahák: US ETFs vs. European alternatives

A mobile-first, conversion-focused landing page for Czech retail investors arriving from a mobile ad. It explains why US-listed ETFs (SPY, IVV, VOO, all on **NYSE Arca**) are usually not available to EU retail investors. It compares four verified European UCITS alternatives, and offers a free PDF cheat sheet in exchange for an e-mail address.

- Customer-facing copy is in Czech. Code and docs are in English.
- Static HTML/CSS/vanilla JS with no build step and no dependencies.
- **Status: demo, not deployed.** The lead form runs in **demo mode** and stores nothing until the privacy details are confirmed (see [Going live](#going-live)).

| | |
|---|---|
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
- Two tickers (SXR8, EUNL) come from justETF, not the issuer. They are marked with `*` on the page.

## Design decisions

- **Mobile-first, one column.** Fund data is shown as cards with a label/value list on phones and two columns from 768px. The US table is short and scrolls inside its own container, so the page never scrolls sideways (checked at 320–1280px).
- **The S&P 500 vs global split is a visual structure**, not a footnote: separate headings, a "širší rozložení" (broader diversification) tag and an explicit "nejsou přímo srovnatelné" (not directly comparable) sentence.
- **Trust before the ask:** the PRIIPs explanation and the sourced comparison come before the form. Sources sit directly under each card.
- **System fonts, no third-party assets.** This keeps the page fast and avoids sending visitor data to font CDNs.
- **Light and dark themes** follow the system setting. All text/background pairs pass WCAG AA contrast (≥4.5:1, computed).
- **Strict CSP** (`netlify.toml`): only the site itself and GoatCounter are allowed. There are no inline scripts or styles.

## Conversion decisions

- **Message match:** `utm_content` switches the hero headline to match the ad that was clicked (A: problem, B: comparison). Unknown or no value shows a neutral default.
- **CTA above the fold** on a 390px phone, repeated in the sticky header ("Tahák zdarma").
- **Short form:** e-mail (required) and first name (optional). **Marketing consent is a separate, optional, unchecked box**; the PDF is given either way.
- **Immediate delivery:** after submit the form is replaced by a download button. There is no e-mail round-trip and no double opt-in wait.
- **Friction-free errors:** a Czech inline validation message, and on a network error the typed values are kept.
- **Spam:** Netlify honeypot plus a recorded `time_to_submit_ms` for later filtering. Nothing is blocked on timing, which avoids false positives. No CAPTCHA.

## Conversion hypothesis

> Visitors who just hit a broker's refusal to sell a US ETF have a specific, urgent question. A page that answers it neutrally and with verifiable sources, and that offers a reusable checklist for the next step in their broker app, will convert better than a generic "invest in ETFs" page. Matching the headline to the ad's promise further reduces drop-off in the first seconds.

Primary metric: **lead rate = `lead_success` ÷ landing pageviews**, per ad variant.

## A/B testing hypotheses (prioritised)

| # | Hypothesis | Change | Primary metric | Why this priority |
|---|---|---|---|---|
| 1 | **Problem framing (A) converts better than comparison framing (B)** for paid-social traffic, because it names the exact frustration the visitor just experienced. | Ad + hero A vs B (already built; split traffic 50/50 by ad set) | `lead_success/a` vs `lead_success/b` ÷ pageviews per `utm_content` | Highest impact on both CTR and landing conversion. Zero extra build cost. |
| 2 | **Showing the form earlier increases leads** for high-intent visitors without hurting trust: a compact form directly under the hero, with the full comparison below. | Move the lead block above `#proc` (one HTML move) | Lead rate; guardrail: `comparison_view` rate and the share of `form_start` that reach `lead_success` | Likely large effect on a long mobile page; cheap; risk to trust is measurable. |
| 3 | **A visual preview of the PDF increases perceived value** and therefore form completion. | Thumbnail of page 1 of the cheat sheet next to the bullets | `form_start` → `lead_success` completion rate, and lead rate | Smaller expected effect and needs a design asset, so it comes last. |

Run one test at a time and decide on a pre-registered sample size; at demo-scale traffic none of these would reach significance quickly.

## Funnel analytics

GoatCounter (cookieless; its docs say it "probably doesn't require a GDPR consent notice"). It records `utm_campaign` and `utm_source` natively. **The ad variant travels in the event name** because GoatCounter doesn't record `utm_content`.

| Event path | Fires when |
|---|---|
| (pageview) | automatically by `count.js` |
| `cta_click/<v>` | hero or header CTA clicked |
| `comparison_view/<v>` | first group of fund cards ≥30 % visible (once) |
| `form_start/<v>` | first focus in the form (once) |
| `form_submit/<v>` | submit with valid input |
| `lead_success/<v>` | lead accepted (Netlify 2xx; in demo mode: simulated) |
| `form_error/<v>` | network or server error |
| `magnet_download/<v>` | PDF link clicked (success panel or thank-you page) |
| `source_click/<v>` | a fund's source link clicked |

`<v>` is `a`, `b` or `default`. Add `?debug=1` to any URL to see events in an on-page log.

### UTM attribution

On landing, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid` and `fbclid` are stored in `sessionStorage`:
- The first touch of the session wins, but a campaign visit replaces an earlier direct visit.
- Values are capped at 200 characters.
- They are sent with the lead as hidden fields, together with `landing_variant`, `landing_url` and `referrer`.

Every Netlify submission (and its CSV export) therefore carries its ad.

Ad links:

```
A: https://<site>/?utm_source=meta&utm_medium=paid_social&utm_campaign=etf_cz_2026q4&utm_content=ad_a_problem
B: https://<site>/?utm_source=meta&utm_medium=paid_social&utm_campaign=etf_cz_2026q4&utm_content=ad_b_compare
```

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
ads/                  ad-a / ad-b as HTML + 1080x1350 PNG
tests/e2e.mjs         dependency-free browser tests (Node 22+, Chrome)
netlify.toml          Netlify config, CSP and security headers
docs/                 research, plan
ai-log/               Claude Code session exports (/export)
```

## Run and test locally

```sh
python3 -m http.server 8000            # then open http://localhost:8000/?utm_content=ad_a_problem&debug=1
node tests/e2e.mjs                     # 19 browser tests (CHROME=/path/to/chrome to override)
```

To regenerate the PDF after editing `tahak.html`:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer \
  --print-to-pdf=assets/tahak-etf.pdf "file://$PWD/tahak.html"
```

`tests/e2e.mjs` starts a local server that mimics Netlify Forms and sends the production CSP. It then drives headless Chrome over the DevTools protocol. It covers:
- **Form:** validation, demo mode (nothing sent), live mode against the mock endpoint (lead POSTed, server error handled), honeypot.
- **UTM:** both variants, persistence across navigation, first-touch rule, length cap.
- **Analytics:** full funnel order and variant tags, events queued until GoatCounter loads, no errors without GoatCounter.
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
- 19/19 e2e tests pass.
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

- **Headline variant swap:** the default headline can flash briefly before `app.js` swaps in A/B, because the script is deferred. Server-side or edge rendering would remove this.
- **No e-mail delivery:** the PDF is downloaded on the page. Leads are only stored (once live), not e-mailed.
- **The PDF is not truly gated:** it is a static file. This is acceptable for a free resource.
- **Data freshness:** fees and fund sizes change. Re-check them against the sources before any real campaign.

## AI usage

Built with Claude Code. Genuine session exports created with `/export` are stored in [`ai-log/`](ai-log/). No logs were written or edited by hand.
