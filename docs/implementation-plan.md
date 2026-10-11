# Implementation Plan (MVP first)

Status: **proposal, awaiting approval**. No code has been written.

Principles:
- Static site with no build step and no installed dependencies.
- Every number on the page comes from `docs/step-1-research.md` §4 with its source and date.
- MVP before optional features.

## 1. Proposed files

```
index.html            Landing page (Czech): hero, problem, comparison, lead form, FAQ, disclaimer
dekujeme.html         Thank-you page: no-JS fallback for the form, contains the PDF download
ochrana-udaju.html    Privacy notice (controller, purpose, retention, rights)
tahak.html            Lead-magnet source, print-styled (A4); exported to PDF
assets/
  tahak-etf.pdf       The lead magnet (exported from tahak.html)
  styles.css          Mobile-first styles, light/dark
  app.js              UTM capture, headline matching, form submit, event tracking
ads/
  ad-a.html, ad-b.html    Two 1080×1350 ad mock-ups (HTML)
  ad-a.png,  ad-b.png     Screenshots for the README
netlify.toml          Security headers, cache rules
docs/                 Research, plan, data sources
README.md             Concept, decisions, conversion hypothesis, 3 A/B hypotheses, run/deploy
ai-log/               Genuine /export session logs (added by you; never generated)
```

The comparison is written as **static HTML**, not loaded by JS. It stays visible without JS and has no fetch failure modes. Each fund card carries a "Zdroj" (source) link and "ověřeno 11. 10. 2026" (verified 11 Oct 2026).

## 2. Page structure (mobile-first)

1. **Hero**: headline variant A/B/default (from `utm_content`), one-line subhead, CTA „Stáhnout srovnání zdarma" (download the free comparison) that scrolls to the form, and the not-advice line.
2. **„Proč nekoupím SPY nebo VOO?"** (why can't I buy SPY or VOO): three short points on PRIIPs/KID, using the approved wording from research §4d.
3. **Comparison**:
   - Top: SPY, IVV and VOO as a small "context" table (NYSE Arca).
   - Below: four UCITS cards. On mobile they stack as cards; from 768px they become a table.
   - Fields: ISIN, index, TER, Acc/Dist, domicile, replication, size + date, tickers, source.
4. **Lead form**: what's in the PDF (3 bullets + thumbnail), then the form.
5. **FAQ** (4–5 items): what UCITS means, what the KID is, why ISIN beats ticker, Acc vs Dist, "is this advice?" (no).
6. **Footer**: full disclaimer, sources, date checked, privacy link.

## 3. Form handling (Netlify Forms)

```html
<form name="lead" method="POST" action="/dekujeme.html"
      data-netlify="true" netlify-honeypot="company">
  <input type="hidden" name="form-name" value="lead">
  <p hidden><label>Firma <input name="company"></label></p>   <!-- honeypot -->
  email (required, type=email) · first name (optional)
  consent checkbox (required, unchecked) → link to ochrana-udaju.html
  hidden: utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          gclid, fbclid, landing_variant, referrer, landing_url, time_to_submit_ms
</form>
```

- **With JS**: `fetch('/', {method:'POST', body: URLSearchParams(FormData)})`. On success the form is swapped for an inline success panel with the PDF download button (`lead_success`). On error the user sees a Czech error message and the submission is not lost silently (`form_error`).
- **Without JS**: a normal POST to Netlify, which redirects to `dekujeme.html` with the same download.
- **Spam**: Netlify honeypot, Netlify's built-in spam filtering, and `time_to_submit_ms` recorded for later filtering. Submissions aren't blocked on timing, which avoids false positives. No reCAPTCHA in the MVP (friction, third-party cookies).
- **Resource access**: the PDF is a static file and the link appears immediately. It isn't truly gated; this is acceptable and honest for a free resource and is noted in the README.
- **Privacy**: GDPR basis is consent. The privacy page names the controller (placeholder `[doplnit: správce]`, i.e. "fill in: data controller", which **you must fill in**), purpose, retention (e.g. 12 months) and rights. No data goes to any third party besides Netlify.

## 4. UTM attribution

- On first load, read `utm_*`, `gclid` and `fbclid` from the URL. If any are present and nothing is stored yet, save `{params, landing_url, referrer, ts}` to `sessionStorage` (first-touch per session). Storage access is wrapped in try/catch, with the URL as fallback.
- On submit, copy the stored values into the hidden inputs. Each Netlify submission then carries its ad attribution and can be exported as CSV.
- **Headline matching**: `utm_content=ad_a_problem` → hero A; `ad_b_compare` → hero B; otherwise the default. The chosen variant goes into `landing_variant` and into event names.
- Ad link format (documented in the README):
  `https://<site>.netlify.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=etf_cz_2026q4&utm_content=ad_a_problem`

## 5. Analytics events (GoatCounter, cookieless)

One wrapper, `track(name)`:
- Sends `window.goatcounter.count({ path: name + '/' + variant, title: name, event: true })` when GoatCounter has loaded.
- Pushes to a local array and prints to an on-screen log when the page has `?debug=1`.
- Never throws.

| Event | Trigger |
|---|---|
| `page_view` | GoatCounter automatic pageview |
| `comparison_view` | Comparison section ≥50% visible (IntersectionObserver), once |
| `cta_click` | Hero or inline CTA clicked |
| `form_start` | First focus in any form field, once |
| `form_submit` | Submit pressed and the browser's built-in validation passed |
| `lead_success` | Netlify responded 2xx |
| `form_error` | Network or non-2xx response |
| `magnet_download` | PDF link clicked (success panel or `dekujeme.html`) |
| `source_click` | A fund's source link clicked (optional, cheap) |

Funnel conversion per variant = `lead_success/<variant>` ÷ pageviews with that `utm_content` (GoatCounter shows campaign/UTM in referrers **[ASSUMPTION: verify during implementation]**).

## 6. Deployment steps

1. You create the Netlify and GoatCounter accounts. I do not create accounts.
2. Push the repo to GitHub (your account). In Netlify: "Add new site → Import from Git", no build command, publish directory `/`.
3. Netlify → Forms: enable form detection. Redeploy so the `lead` form is registered.
4. GoatCounter: create site code `<code>`. I add `<script data-goatcounter="https://<code>.goatcounter.com/count" async src="//gc.zgo.at/count.js">` to the pages.
5. Smoke-test production with both ad URLs (checklist below).

## 7. Testing checklist

- [ ] Layout at 360 / 390 / 768 / 1280 px. No horizontal scroll. Tap targets ≥ 44 px.
- [ ] Every figure on the page matches research §4 and links to its source, with the date shown.
- [ ] Disclaimer visible in the hero area and the footer. No profit or performance promises anywhere.
- [ ] `?utm_content=ad_a_problem` / `ad_b_compare` / none → correct headline.
- [ ] UTMs survive a reload and an in-page navigation, and appear in the Netlify submission.
- [ ] Valid submit → success panel → PDF downloads. Same flow with JS disabled → `dekujeme.html`.
- [ ] Invalid e-mail or missing consent → Czech validation message, no submission.
- [ ] A submission with the honeypot filled is not listed as a valid lead in Netlify.
- [ ] Czech diacritics are intact in the Netlify submission and its CSV export.
- [ ] `?debug=1` shows each event firing in order. Production GoatCounter dashboard shows the events.
- [ ] Network-error path (devtools offline) shows the error message, and the form keeps its values.
- [ ] Lighthouse mobile: Performance/Accessibility/Best Practices ≥ 90. Labels, contrast and focus states OK.
- [ ] Links and the PDF open on iOS Safari and Android Chrome (or emulation).

## 8. Order of work and commits

**MVP**
1. `docs:` research v2 + this plan.
2. `feat:` page skeleton + styles + static comparison (verified data).
3. `feat:` lead form + Netlify Forms + thank-you page + privacy page.
4. `feat:` UTM capture + hidden fields + headline matching.
5. `feat:` `track()` + GoatCounter + debug log.
6. `feat:` lead-magnet `tahak.html` + exported PDF.
7. `chore:` `netlify.toml`, then deploy (you connect Netlify) and run the production smoke test.
8. `docs:` README (concept, decisions, conversion hypothesis, 3 prioritised A/B hypotheses, how to test).

**Then**
9. `feat:` ad mock-ups A/B + screenshots.
10. `docs:` `ai-log/` exports (you run `/export`).

**Optional, only if time remains**: Open Graph image, a small "how to read a KID" visual, form A/B placement switch.

PDF export: print `tahak.html` with a local headless Chrome (`--print-to-pdf`) if available. Otherwise you print it from the browser. Nothing gets installed.
