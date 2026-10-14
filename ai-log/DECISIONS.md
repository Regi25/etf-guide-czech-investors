# Decisions and corrections log

It covers the Claude Code sessions of 2026-10-11 and records only what actually happened. The owner reviewed the draft; open points were clarified by the owner on 2026-10-11.

Each entry: **what happened**, **how it was detected**, **how it was resolved**, **lesson**.

---

## 1. Step 1 research limits: VOO page not loadable, UCITS data first taken from justETF

**What happened**
- In Step 1, Vanguard's VOO pages could not be read. Three addresses were tried:
  - `investor.vanguard.com/.../profile/voo`
  - `advisors.vanguard.com/.../voo/...`
  - a Vanguard profile API URL

  All three returned only the page title; the pages are rendered with JavaScript. VOO was therefore marked **[UNVERIFIED]** in the first version of `docs/step-1-research.md`.
- In that first version, the four UCITS funds' data came from **justETF profile pages**, a secondary source: TER, launch date, fund size, replication and listings.
  - The fund sizes were in EUR, with no as-of date.
  - The iShares UK product page cut off before its "Key Facts" section.
  - The issuer factsheet PDFs could not be read by the web-fetch tool, because they are compressed.

**How it was detected**
- The fetch results themselves showed the problem: "only the page title", "content truncated", "raw PDF binary".
- The report labelled every value [PRIMARY], [SECONDARY] or [UNVERIFIED], so the gaps were visible.

**How it was resolved**
- The owner approved the plan on the condition that only instruments whose key data can be verified from primary sources are included. A verification pass followed before any implementation.
- **Reading the PDFs:** issuer factsheet PDFs were downloaded and their text extracted locally.
  - A small zlib-based extractor read part of the VOO factsheet but not the iShares ones.
  - macOS PDFKit (via `osascript`) read all of them.
- **VOO:** values taken from Vanguard's factsheet `fund-docs.vanguard.com/F0968.pdf` ("As of June 30, 2026"): expense ratio 0.03%, inception 2010-09-07, ETF total net assets $978,960M, exchange NYSE Arca.
- **UCITS funds:** values replaced with issuer data. Sources:
  - iShares UK factsheets (CSPX, SWDA);
  - Vanguard NL factsheet and product page (VUAA);
  - Vanguard CH factsheet and UK product page (VWCE).
- **Corrections recorded in the report's change log:**
  - Fund sizes are now issuer share-class sizes in USD, each with its as-of date.
  - VUAA replication "full" (justETF) changed to "physical" (Vanguard).
  - VWCE fees: a search snippet showed 0.19%; the current Vanguard factsheet and UK page show 0.14%, which is used.
  - CSPX: fund launch (18 May 2010) and share-class launch (19 May 2010) are now distinguished.
- **Still from justETF:** two tickers (SXR8, EUNL), marked with `*` on the page.
  - In the 2026-10-11 data audit, both tickers were found next to their ISINs on iShares' German product pages.
  - The iShares UK factsheets list Deutsche Börse Xetra among the exchanges.
  - That these are specifically the *Xetra* tickers still comes only from justETF.
- **Owner's independent check (2026-10-11):** the owner personally checked three values against the issuers' sources, and all three matched what the page shows:
  - VWCE OCF 0.14 %;
  - SPY expense ratio 0.0945 %;
  - CSPX TER 0.07 %.
- **Not verified at all:**
  - registration of the funds for public offer in the Czech Republic;
  - Czech-language KIDs;
  - availability at individual Czech brokers.

  The page wording avoids these claims.

**Lesson**
- Issuer HTML pages are often JavaScript-rendered. The factsheet PDF is the more reliable primary source, but it needs a local text-extraction step.
- Label secondary data explicitly and replace it before publishing, rather than trusting it because it looks complete.
- Every figure needs an as-of date. "Verified on" (when we checked) and "valid as of" (the data's own date) are different things.

---

## 2. Headline variants and debug panel looked broken in the owner's manual check

**What happened**
- The owner tested the page by hand. It was served locally with `python3 -m http.server 8000`, and both variants were opened in Chrome incognito windows with a narrow (mobile) viewport in DevTools:
  - `/?utm_content=a` and `/?utm_content=b`, opened in separate incognito windows, showed the **same headline**.
  - With `&debug=1`, the "debug: events" panel appeared but **stayed empty** after page load and after clicking buttons.
- The owner suspected JavaScript was not running.
- At that point **19 automated end-to-end tests were passing**.

**How it was detected**
- Detected by the owner's manual check, not by the automated tests.
- Claude then reproduced it in fresh browser contexts (headless Chrome), with 0 JavaScript errors. The panel itself is created by `app.js`, which proved JavaScript was running.

**Root causes**
1. **utm_content values were not clearly documented.** `app.js` recognises only the exact values `ad_a_problem` and `ad_b_compare`; anything else shows the default headline by design. The README did contain these values, but only inside the example ad links. It said unknown values fall back to the default, without listing the accepted values.
2. **The page view was not recorded through `track()`.** It was left to GoatCounter's automatic pageview, and the GoatCounter tag is still disabled. So the panel had nothing to show on load.
3. **"Zobrazit srovnání" was untracked.** The hero button had no `data-track` attribute, so clicking it recorded nothing.
4. **The `comparison_view` threshold missed the jump.** It required 30% of the first group of fund cards to be visible. After the "Zobrazit srovnání" jump, those cards are below the fold on a phone, so the event did not fire either.

**Why the 19 tests did not catch it**
- They used only the full `utm_content` values.
- They clicked only elements that were already tracked.
- They checked the debug panel only after a scripted funnel, never in its state right after page load.

**How it was resolved**
- Commit `53d3275`:
  - `page_view/<variant>` is recorded through `track()` on the landing page;
  - the compare button records `compare_click`;
  - `comparison_view` fires when the US table or the first fund card is at least 50% visible;
  - the debug panel shows the applied variant and flags unrecognised `utm_content` values. The URL value is rendered as text, not HTML.
- The README now lists the exact `utm_content` values, both full ad URLs, and a tip that the first ad of a browser session is kept.
- 9 new tests were added (28 in total). Seven of the new or updated tests fail against the previous code.
- The owner re-checked by hand and confirmed: correct headline for both variants, and `page_view → compare_click → comparison_view` in the panel for a and b.

**Lesson**
- Tests written by the same author tend to mirror that author's assumptions. A short human check of the most basic path (load the page, click the obvious buttons) found what 19 tests missed.
- Document the accepted values of any URL parameter explicitly, not only by example.
- A debug tool should explain an empty state ("variant: default, value not recognised") instead of just showing nothing.

---

## 3. Proposed fix changed after measuring card visibility

**What happened**
- After diagnosing entry 2, Claude proposed moving `comparison_view` from "30% of the first group of cards" to "the first fund card".
- Before implementing it, Claude measured visibility in headless Chrome right after clicking "Zobrazit srovnání":

| Viewport | US table visible | First fund card visible |
|---|---|---|
| 390×844 | 100 % | 0 % (card top at 897 px) |
| 360×640 | 59 % | 0 % |
| 1280×800 | 100 % | 25 % |

**How it was detected**
By measuring before implementing. The proposed change would still have failed on both phone sizes.

**How it was resolved**
- `comparison_view` now fires when **either** the US table **or** the first fund card is at least 50% visible.
- Tests cover all three viewport sizes.
- The change of plan and its reason were reported to the owner in the summary of commit `53d3275`.

**Lesson**
Measure the real layout before choosing a visibility threshold. A fix that sounds right ("use the first card") can still miss the case it was meant to fix.

---

## 4. Claude corrected its own false claim about `comparison_view` firing at 1px

**What happened**
- In its diagnosis of entry 2, Claude stated that the old check counted a comparison as seen when only 1px was visible. The old check was `isIntersecting` with a 0.3 threshold.
- During the fix Claude repeated this as fact:
  - in a code comment ("isIntersecting alone is true at 1px");
  - by adding a test intended to catch it.

**How it was detected**
1. **Mutation tests.** Restoring the old `isIntersecting` check did not make either new "small peek" test fail:
   - scrolling so the comparison peeks in by 20px;
   - loading the page with the comparison already peeking in.
2. **Direct observation.** In Chrome, with the old check and viewport heights of 1461, 1500 and 1600px, the table was partly visible at load (up to about 47%). No `comparison_view` fired.
3. Taken together, the claim was **not true in Chrome**.
4. One more slip along the way: while rewriting one of these tests, Claude first broke the test file's syntax by cutting at the wrong `});`. This was fixed before any commit.

**How it was resolved**
- The explicit `intersectionRatio >= 0.5` check was kept as a defensive measure.
- The code comment was reworded so it no longer claims a bug.
- The "small peek" tests were kept as plain behaviour checks, explicitly not as proof of a fixed bug.
- The correction was stated to the owner in the summary of commit `53d3275`.
- **Known limitation:** Safari and Firefox have not been tested, neither the observer behaviour nor the page in general. All automated tests and both manual checks used Chrome.

**Lesson**
- Verify a technical claim, by observing it or with a mutation test, before stating it as fact or writing it into code comments.
- A test that passes on both the old and the new code proves nothing about a regression.

---

## 5. Process note: auto mode across several milestones; review after, not before

**What happened**
- The sessions ran in Claude Code's auto mode.
- Steps 1 and 2 (research, then the verification pass and plan) each ended with an explicit stop, and the owner approved before work continued.
- For implementation the owner's instruction was: "Begin with the first implementation milestone only. After completing it, report… Then continue with the next milestone only if the previous one is working."
- Claude read this as permission to continue and completed seven milestones in one run. Each was committed separately, with a short status report between milestones and one summary at the end:
  1. page structure and comparison
  2. form and PDF
  3. UTM attribution
  4. analytics
  5. Netlify configuration
  6. ads
  7. README
- The owner reviewed after these milestones rather than before each step.

**How it was detected**
This entry was requested by the owner as a process note. The later manual check (entry 2) found behaviour gaps in the analytics milestone, which had already been built and committed by then.

**How it was resolved**
- The fixes for entry 2 were made in a separate commit, after the owner's explicit instruction.
- **Process change agreed by the owner (2026-10-11):** from now on, work pauses after **each** milestone and waits for the owner's explicit approval before continuing. Passing automated tests are **not** approval.

**Lesson**
- When an instruction allows continuing "if the previous milestone works", "works" was judged by Claude's own tests only. For anything with user-visible behaviour (headlines, tracking, forms), pausing for a short human check after the first interactive milestone would likely have surfaced entry 2 earlier.
- Automated tests by the implementer complement a human review; they do not replace it.

---

> Entries 6–9 were drafted on 2026-10-14 from the conversation, the tests and the Git history, and reviewed by the owner.

## 6. M2–M3: design tokens, ticker-first cards, and a regex bug in Claude's own test

**What happened**
- **M2 (`ef4a9ce`):** editorial design tokens and serif headings.
  - Before choosing the serif stack, Claude asked Chrome (via the DevTools protocol) which font rendered a Czech test string. Iowan Old Style, Charter, Georgia, Times New Roman and the system sans all rendered it without a fallback font.
  - Noto Serif, Android's usual serif, was not installed, so Chrome substituted Times. Android was therefore not verified.
- **M3 (`25c7853`):** fund cards lead with the ticker, show annual costs and index as key facts, and list source links as 44 px rows.
- **Regex bug in Claude's own test.** A new card test normalised whitespace with `/\s+/` inside a JavaScript template string, where `\s` becomes a plain "s". The test removed every lowercase "s" from the heading text. It passed on the new markup only by coincidence.

**How it was detected**
- The regex bug showed up during a mutation run (the new tests run against the old markup). The failure message printed the heading as "iShare  Core…".

**How it was resolved**
- The regex was corrected to `/\\s+/`.
- The approved M2 stylesheet had been stored as Git object `4ed8f16` before M3 started. M2 was committed alone from that object; its snapshot passed its own suite (36/36) in a temporary export. M3 was committed separately (40/40).
- The owner tested M3 by hand before approving: "I tested the page and I like the result."

**Lesson**
- Escape sequences inside template strings in test code are easy to get wrong. Mutation runs, i.e. running new tests against the old code, catch tests that pass for the wrong reason.

## 7. M4: mobile conversion, a real visual artefact, and several test-side mistakes

**What happened (`d131d6c`)**
- **Teaser.** A sourced teaser was added below the hero. On 320×640 it pushed variant A's primary CTA below the first screen. A smaller h1 scale and tighter hero spacing brought it back. It remains below the fold at 320×568 for variant A.
- **Comparison order.** UCITS cards now come first; the US ETFs and the per-card „Podrobnosti" moved into native `<details>` disclosures. `comparison_view` was moved to the first fund's key facts. At 320×568 it fires only after a short scroll, and a test documents this.
- **Beige band.** The owner asked Claude to inspect a beige band below the header. It turned out to be real. `scroll-margin-top` was 72 px but the header is 53 px, so after anchor jumps a 19 px strip of the previous section showed. The margin now matches the header height; a test checks the gap.
- **`text-wrap: balance`** improved most headings but added a fourth line to the „Americké ETF pro srovnání" summary heading at 375/390 px, so it was switched off for that heading.
- **Mistakes on the test and screenshot side, not product bugs:**
  - `Math.round(-0.3)` returns −0, which DevTools cannot return by value, so a test saw `undefined`;
  - synthetic Enter key presses need `text: "\r"` to activate an element;
  - an accessibility-tree filter matched text nodes as well as the disclosure;
  - the first full-page screenshots were taken before the lazy-loaded PDF preview had loaded, so they showed an empty area. They were regenerated.

**How it was detected**
- Measurements in headless Chrome at 320–1280 px, the failing tests, and Claude's own review of the screenshots.

**Lesson**
- Measure the real layout, e.g. where the CTA ends, before and after adding content.
- When a test fails, check the test before concluding the product is broken: three of the M4 failures were in the tests.

## 8. Pre-M5 wording corrections and M5: ads and PDF

**What happened**
- **Wording (`0211d3b`).** The owner asked to replace „celý svět" ("whole world") with „globální akcie" ("global equities") for variant B. MSCI World covers developed markets only, so "whole world" was inaccurate for SWDA. The B teaser now names each global fund's coverage.
- **Regenerated files.** The ad B PNG, the PDF and its preview were regenerated in the same commit, so the commit has no stale generated files.
- **PDF page count (M5, `403915c`).** Restyling the PDF first pushed it to **3 pages**: two lines of the footnote overflowed. Tighter page-1 spacing brought it back to 2 pages, and a test now checks that the PDF has exactly 2 pages and that all 13 source URLs are clickable links.
- **PDF link test.** It initially failed because Chrome stores a bare origin with a trailing slash (`https://www.justetf.com/`).
- **Ad A** had a large empty band above the CTA. The eyebrow line from ad B was added for balance.
- **`ai-log/README.md`** said nothing in the folder was written by hand, although `DECISIONS.md` is a written summary. It was corrected.

**How it was detected**
- Page count read with macOS PDFKit; screenshots reviewed by Claude; the failing test; the owner's wording request.

**Lesson**
- A restyle can change pagination. A "2 pages" promise in the UI („PDF, 2 strany") needs a test.

## 9. Pre-submission audit: the demo form could send the e-mail without JavaScript

**What happened**
- **The leak.** Since the lead-form commit (`2f28f61`, 2026-10-11), the form had `method="POST" action="/dekujeme.html"`. The `<noscript>` note only told visitors without JavaScript to use a direct PDF link; it did not stop the form being submitted. So with JavaScript disabled, a visitor could type an e-mail, press Enter, and the browser would POST it to `/dekujeme.html`.
- **The wrong event.** In demo mode a successful submission emitted the production event `lead_success`, although nothing was sent.
- **Unchanged in its original form since.** The no-JavaScript submission path existed from the MVP onward, and no test covered visitors without JavaScript.

**How it was detected**
- The owner requested a factual audit on 2026-10-13. Claude found both issues by reading the code (`index.html` form attributes, `assets/app.js` `send()` and the submit handler).
- The leak was then **verified by a test** run against the previous markup with JavaScript disabled. The local test server received `POST /dekujeme.html` with `email=nojs.visitor%40example.cz` in the body.

**How it was resolved (`6f2a599`, 2026-10-14, after the owner's review and approval)**
- The form controls sit in `<fieldset id="lead-fields" disabled>`. Without JavaScript nothing can be typed or submitted, and disabled fields are never included in a submission. `assets/app.js` enables the fieldset, so visitors with JavaScript see no change: form screenshots are byte-identical in light and dark.
- Demo submissions emit `demo_lead_success`. `lead_success` fires only after a live submission that the server answered with 2xx.
- The README and `docs/project-brief.md` now state that the form is demo-only, no real leads are collected, the PDF is public and not gated, and no analytics provider is connected.
- 5 new tests (71 in total) cover the no-JS and JS demo paths, the event names and the PDF's public accessibility.
- No deployment is recorded in the project: there is no Git remote, no deployment folder, and the README status says "not deployed". The history alone cannot show whether a preview was ever shared; the owner confirmed on 2026-10-14 that the site was never shown outside localhost.

**Lesson**
- "Nothing is sent" has to hold for every path a visitor can take, including no JavaScript. A user-facing note is not a safeguard.
- A demo state must not reuse production event names, or analytics will count simulated leads once it is switched on.
- A test suite written alongside the code (36, then 66 tests) missed this, because every form test assumed JavaScript was on.
