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
- Commit `637b21c`:
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
- The change of plan and its reason were reported to the owner in the summary of commit `637b21c`.

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
- The correction was stated to the owner in the summary of commit `637b21c`.
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
