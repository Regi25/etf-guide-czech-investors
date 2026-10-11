# Step 1: Research and Concept Recommendation

First version 2026-10-11. **Verification pass completed 2026-10-11** (see §4 and the change log at the end).

Decisions approved by the owner on 2026-10-11:
- US set: NYSE Arca-listed ETFs.
- Hosting: Netlify. Analytics: GoatCounter.
- Include only UCITS funds with key data verified from primary sources.
- DIP is out of scope.

Status labels:

- **[PRIMARY]**: read directly from the issuer's, exchange operator's or regulator's own page or document on 2026-10-11.
- **[SECONDARY]**: from a reputable secondary source (data aggregator, broker help page, news).
- **[UNVERIFIED]**: not confirmed. Must not appear on the page as fact.
- **[ASSUMPTION]** / **[HYPOTHESIS]**: my reasoning, not a fact.

## 0. Project state

The repository (`main`) has no commits. It contains only `docs/initial-prompt.md` and this report.

## 1. Audience and primary need

**Context (Czech market)**
- 56% of Czechs invest. 65% of Czech investors hold stocks, and 45% invest through brokers, platforms or apps (V4 average: 37%). Source: Generali Investments CEE survey, reported in E15 on 20 July 2026, https://www.e15.cz/tiskove-zpravy/cesi-se-neboji-propadu-investuji-nejvic-ve-stredni-evrope-ukazuje-pruzkum-1434425 **[SECONDARY]**. No sample size is given.
- The same article says Czech investors prefer funds whose history and manager reputation they can check **[SECONDARY]**.

**Audience [ASSUMPTION]**: Czech mobile users aged about 25–45, beginner to early-intermediate investors. They use or are about to open a broker app and keep hearing about US ETFs (SPY, VOO, "S&P 500") in English-language content.

**Primary need [HYPOTHESIS]**: *"I want a simple, low-cost, broadly diversified ETF, but I don't know which one I can actually buy as a Czech retail investor, or how to tell the options apart."*

**Main conversion barrier [HYPOTHESIS]**: confusion and distrust. Their broker blocks US ETFs because no KID is available, they face jargon (UCITS, TER, Acc/Dist, ISIN vs ticker), and they are wary of handing over an e-mail.

## 2. Landing-page concept

**„Americké ETF vs. jejich evropská dvojčata"** (US ETFs vs. their European twins). The page covers, with sources:
1. What SPY, IVV and VOO are and where they trade (NYSE Arca).
2. Why EU retail investors usually can't buy them (PRIIPs/KID).
3. Which UCITS ETFs track the same or a broader index, and how they compare.

**Headline directions** (matched to the ad variant via `utm_content`, see §6):
- A: „Chtěli jste koupit SPY nebo VOO? Tady je, co si jako Čech můžete koupit místo nich."
- B: „S&P 500 i celý svět: 4 evropské ETF v jednom srovnání se zdroji."

**Value proposition**: one clear, sourced comparison that turns the "my broker won't let me buy it" moment into an informed decision. It is neutral and makes no profit promises. The page clearly states „Nejde o investiční doporučení." (This is not investment advice.)

## 3. Lead magnet

**„Tahák: Jak vybrat ETF jako český investor" (PDF, 2–3 pages)** (cheat sheet: how to choose an ETF as a Czech investor)
- A comparison table: US ETF → UCITS alternative (ISIN, TER, Acc/Dist, domicile, exchanges/tickers, source and date).
- A 7-point checklist for buying a UCITS ETF in a broker app: search by ISIN, choose the exchange and currency, Acc vs Dist, TER, fund size, replication, find and read the KID.
- A short explainer of what PRIIPs/KID means for the investor.

DIP is out of scope for this version.

**Why it's worth an e-mail [HYPOTHESIS]**: it is useful at the exact moment of friction (inside the broker app) and reusable later. It goes beyond the page summary and is delivered **immediately** after submission.

## 4. Verified ETF data (checked 2026-10-11)

### 4a. Listing venue: NYSE vs NYSE Arca

- SPY, IVV and VOO all list on **NYSE Arca** per their issuers' own pages and factsheets **[PRIMARY]**, sources below. NYSE Arca is a separate exchange from the NYSE main board ("Big Board").
- The NYSE main board listed its first ETF in 15 years on 14 Nov 2022: PIMCO Active Bond ETF (BOND), transferred from NYSE Arca. Source: ICE press release, https://ir.theice.com/press/news-details/2022/The-New-York-Stock-Exchange-Lists-Its-First-ETF-on-the-Big-Board-in-15-Years/default.aspx **[PRIMARY]**.
- **Approved interpretation**: the page uses the NYSE Arca set and labels the venue exactly as "NYSE Arca". The README will explain this.
- **Correction**: BOND is **removed** from the shortlist. It is off-topic for a beginner equity comparison, and its current venue was contradicted by one secondary summary. That conflict was not resolved because BOND is out of scope.

### 4b. US-listed reference ETFs (context only, not "buy" candidates)

| Ticker | Fund | Venue | Expense ratio | Inception | Size (as of) | Index | Primary source |
|---|---|---|---|---|---|---|---|
| SPY | SPDR S&P 500 ETF Trust | NYSE Arca | 0.0945% (gross) | 22 Jan 1993 | AUM $817,200.17M (8 Oct 2026) | S&P 500 | https://www.ssga.com/us/en/intermediary/etfs/spdr-sp-500-etf-trust-spy |
| IVV | iShares Core S&P 500 ETF | NYSE Arca | 0.03% | 15 May 2000 | Net assets $896,439,871,787 (9 Oct 2026) | S&P 500 | https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf |
| VOO | Vanguard S&P 500 ETF | NYSE Arca | 0.03% | 7 Sep 2010 | ETF share-class net assets $978,960M; total fund net assets $1,675,038M (factsheet as of 30 Jun 2026) | S&P 500 | https://fund-docs.vanguard.com/F0968.pdf |

All three rows are **[PRIMARY]**. Correction: VOO was **[UNVERIFIED]** in the first version and is now verified from Vanguard's factsheet.

### 4c. UCITS comparison set (all four have primary-source data, so all four stay in scope)

| | iShares Core S&P 500 UCITS ETF USD (Acc) | Vanguard S&P 500 UCITS ETF (USD) Acc | iShares Core MSCI World UCITS ETF USD (Acc) | Vanguard FTSE All-World UCITS ETF (USD) Acc |
|---|---|---|---|---|
| ISIN | IE00B5BMR087 | IE00BFMXXD54 | IE00B4L5Y983 | IE00BK5BQT80 |
| Index | S&P 500 | S&P 500 | MSCI World (Net) | FTSE All-World |
| TER / OCF | 0.07% | 0.07% | 0.20% | 0.14% |
| Use of income | Accumulating | Accumulating | Accumulating | Accumulating |
| Domicile | Ireland | Ireland | Ireland | Ireland |
| Replication | Physical | Physical | Physical, optimised | Physical (sampling) |
| Share-class launch | 19 May 2010 (fund: 18 May 2010) | 14 May 2019 | 25 Sep 2009 | 23 Jul 2019 |
| Size (share class) | USD 154,477.00M | USD 35,852M | USD 147,192.36M | USD 58,049M |
| Size as-of | 30 Sep 2026 | 31 Aug 2026 | 30 Sep 2026 | 31 Aug 2026 |
| Example tickers | CSPX (LSE, USD); SXR8 (Xetra, EUR) | VUAA (LSE, USD; Deutsche Börse, EUR) | SWDA (LSE); EUNL (Xetra, EUR) | VWRA (LSE, USD); VWCE (Deutsche Börse, EUR) |
| Primary source | iShares UK factsheet¹ | Vanguard NL factsheet² | iShares UK factsheet³ | Vanguard CH factsheet⁴ |
| KID published by issuer | Yes, KIID/PRIIPs link on iShares UK page | Yes, PRIIPs KID (Dutch) linked on Vanguard NL page | Yes, KIID/KID link on iShares UK page | **[SECONDARY]**: Finect lists a KID dated 24 Mar 2026. Not opened on Vanguard's site. |

1. https://www.ishares.com/uk/individual/en/literature/fact-sheet/cspx-ishares-core-s-p-500-ucits-etf-fund-fact-sheet-en-gb.pdf. Data "as at 05-Oct-2026"; net assets "as at 30-Sep-2026".
2. https://fund-docs.vanguard.com/SandP_500_UCITS_ETF_USD_Accumulating_9694_NETH_INT_DU.pdf. Data per 31 Aug 2026. Product page: https://www.nl.vanguard/professional/product/etf/equity/9694/sp-500-ucits-etf-usd-accumulating
3. https://www.ishares.com/uk/individual/en/literature/fact-sheet/swda-ishares-core-msci-world-ucits-etf-fund-fact-sheet-en-gb.pdf. Data "as at 05-Oct-2026"; net assets "as at 30-Sep-2026".
4. https://fund-docs.vanguard.com/FTSE_All-World_UCITS_ETF_USD_Accumulating_9679_CH_RET_EN.pdf. Data as at 31 Aug 2026. The UK product page (product ID 9679) also shows 0.14%. It was fetched as https://www.vanguard.co.uk/professional/product/etf/equity/9679/sp-500-ucits-etf-usd-accumulating; the slug in that URL is wrong, but the page served is FTSE All-World. Use a canonical URL on the site.

Ticker/exchange rows: the iShares rows come from the factsheets' listing tables and the iShares UK page. The Vanguard rows come from Vanguard's NL and UK product pages **[PRIMARY]**. The Xetra tickers SXR8 and EUNL come from justETF only **[SECONDARY]**. The iShares factsheets list "Deutsche Boerse Xetra" without the ticker in the extracted text.

**Index descriptions used on the page** (added 2026-10-11 during milestone 1):
- S&P 500: "an index composed of 500 large cap U.S. companies". Source: iShares CSPX product page, investment objective **[PRIMARY]**.
- MSCI World: large and mid cap representation across "Developed Markets countries", covering about 85% of free-float-adjusted market cap in each country. Source: https://www.msci.com/indexes/index/990100 **[PRIMARY]**.
- FTSE All-World: "large and mid-sized company stocks in developed and emerging markets". Source: Vanguard VWCE factsheet, footnote 4 **[PRIMARY]**.

**Corrections from the first version**:
- Fund sizes now come from issuer documents with as-of dates, replacing justETF's undated EUR figures.
- CSPX: the fund launch (18 May 2010) and share-class launch (19 May 2010) are now distinguished.
- VUAA: "full replication" (justETF) changed to "physical". Vanguard describes full replication with sampling where it isn't practicable.
- VWCE: one search snippet showed an OCF of 0.19%. The current Vanguard factsheet (31 Aug 2026) and the UK page both show **0.14%**, so 0.14% is used.

**Display rules for the page**:
- Show share-class size with its as-of date. Dates differ between issuers, so show them per fund.
- No past-performance figures in the MVP. This avoids any implied performance promise.
- Every fund card links to its primary source and shows "ověřeno 11. 10. 2026" (verified 11 Oct 2026).

### 4d. EU retail-access claims

| Claim | Status | Evidence |
|---|---|---|
| PRIIPs requires the manufacturer to draw up a KID (Art. 5) and the seller to provide it to retail investors before purchase (Art. 13) | **[PRIMARY]** | Reg. (EU) 1286/2014, https://eur-lex.europa.eu/eli/reg/2014/1286/oj |
| US ETF issuers generally don't produce PRIIPs KIDs, so EU brokers restrict retail purchases (holding and selling still allowed) | **[SECONDARY]** | Interactive Brokers help page (via search; direct fetch blocked, 403), https://ibkb.interactivebrokers.com/node/2993; justETF (2018), https://www.justetf.com/en/news/etf/us-domiciled-etfs.html |
| Exceptions exist: professional-client reclassification; some brokers offer CFDs on US ETFs | **[SECONDARY]** | Same IBKR page |
| A specific Czech broker blocks or allows SPY/IVV/VOO | **[UNVERIFIED]** | Not researched per broker |
| The four UCITS funds are notified/registered for public marketing in the Czech Republic (ČNB) | **[UNVERIFIED]** | ČNB register not reachable via search; no Czech-language KID found |
| A Czech-language KID exists for each UCITS fund | **[UNVERIFIED]** | Only FR/PT (iShares) and NL (Vanguard) versions found |

**Approved page wording (Czech)**:
- „Americké ETF jako SPY, IVV nebo VOO obvykle nemají sdělení klíčových informací (KID) podle evropského nařízení PRIIPs. Proto je evropští brokeři běžným (retailovým) klientům zpravidla neumožňují koupit." (US ETFs such as SPY, IVV or VOO usually have no KID under the EU PRIIPs regulation, so European brokers generally don't let ordinary retail clients buy them.)
- „Dostupnost konkrétního fondu si vždy ověřte u svého brokera." (Always check a specific fund's availability with your broker.)
- **Do not** claim the UCITS funds are "available to every Czech investor", that they are "registered in CZ", or that buying US ETFs is "illegal".

## 5. Two advertisement concepts (mobile, Czech)

| | **A: "Problem/curiosity"** | **B: "Clarity/comparison"** |
|---|---|---|
| Hook | „Broker vám nedovolil koupit SPY nebo VOO? Nejste sami." | „S&P 500 nebo celý svět? 4 evropské ETF v jednom přehledu." |
| Body | „Proč americké ETF v EU většinou nekoupíte a jaké evropské fondy sledují stejný index." | „Poplatky, ISIN, burzy a typ fondu, vše se zdroji. Tahák v PDF zdarma." |
| CTA | „Zjistit proč →" | „Porovnat ETF →" |
| Visual | Phone mock-up with a "KID není k dispozici" message | Clean 2×2 comparison card |
| UTM | `utm_content=ad_a_problem` | `utm_content=ad_b_compare` |

Both ads end with: „Nejde o investiční doporučení. Investování nese riziko." (Not investment advice. Investing carries risk.)

## 6. Funnel and attribution (summary; details in `docs/implementation-plan.md`)

- **Funnel**: ad → landing (`page_view`) → `comparison_view` → `cta_click` → `form_start` → `form_submit` → `lead_success` → `magnet_download`.
- **UTMs**: captured on landing, saved first-touch in `sessionStorage`, and sent as hidden form fields with every lead. `utm_content` also selects the matching hero headline.
- **Spam and privacy**: Netlify honeypot and a time-to-submit field. Consent checkbox unchecked by default. Privacy page. Cookieless analytics.

## 7. Tech and deployment

Static HTML, CSS and vanilla JS with no build step. Netlify Forms stores leads. GoatCounter handles analytics. The owner creates the Netlify and GoatCounter accounts.

## 8. Remaining risks and uncertainties

1. **Czech registration and Czech KIDs** of the UCITS funds: unverified. The page wording avoids the claim (§4d).
2. **Broker-level availability**: unverified. No brokers are named on the page.
3. **The KID-restriction mechanism**: the US-issuer/broker-blocking mechanism has secondary sources only (IBKR help page, justETF). The legal basis is primary. The wording uses "obvykle"/"zpravidla" (usually/as a rule).
4. **Data freshness**: fund sizes and fees change. Every figure carries an as-of date and source link. The README notes that data must be re-checked before any real campaign.
5. **VWCE KID**: only secondary evidence that it exists. The page will link to Vanguard's product page rather than to a KID PDF.
6. **GoatCounter specifics**: custom-event API and free-tier terms come from my own knowledge **[ASSUMPTION]**. Verify while implementing.
7. **Czech copy**: needs a native-speaker read.

## Change log

- 2026-10-11 v1: initial research.
- 2026-10-11 v2 (verification pass):
  - VOO verified from Vanguard's factsheet.
  - All four UCITS funds verified from issuer factsheets. Fund sizes are dated and from issuers; CSPX launch dates clarified; VUAA replication corrected; VWCE OCF 0.19% vs 0.14% conflict resolved to 0.14%.
  - BOND removed. DIP removed (out of scope).
  - EU-access claims split into primary, secondary and unverified, with approved page wording.
  - Added the IBKR source.
