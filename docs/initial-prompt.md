# Clientelo Assignment — Step 1: Research and Concept

## Role

Act as a senior frontend engineer, conversion-focused product designer, and careful financial-data researcher. Help me complete the Clientelo Junior AI Developer take-home assignment.

I am a frontend developer using Claude Code to build the solution. Work in small, verifiable stages. Do not overengineer. Explain important decisions clearly.

## Assignment

Build a mobile-first, conversion-focused landing page for Czech retail investors arriving from a mobile advertisement. The page will compare ETFs and offer a useful downloadable lead magnet in exchange for contact details.

The final solution must be suitable for a public demo and include:

- Two alternative advertisement variants.
- A comparison of real, verifiable ETF data with sources.
- A lead-capture form and immediate access to the promised resource after submission.
- Funnel analytics events and UTM attribution linked to leads.
- A README explaining the concept, design and conversion decisions, conversion hypothesis, and three prioritized A/B testing hypotheses.
- A free public deployment.
- Incremental Git history showing genuine development progress.
- An `ai-log/` directory containing genuine Claude Code session exports created using `/export`. Never fabricate logs.

All customer-facing copy must be in natural Czech. Technical documentation and code identifiers may be in English.

## Important research and accuracy requirements

1. Research the target audience, their likely intent, the main conversion barrier, and an appropriate lead magnet.
2. Interpret “ETFs traded on NYSE” carefully. Distinguish the NYSE main market from NYSE Arca and verify each instrument's actual listing venue. Do not silently mix different venues.
3. Use real instruments and reliable primary sources wherever possible, such as official fund-provider pages, exchange listings, and official factsheets. Record source URLs and the date checked for each important data point.
4. Consider the restrictions relevant to Czech/EU retail investors, including PRIIPs and KID requirements for US-domiciled ETFs. Do not imply that an instrument is available to every Czech retail investor without verification. Consider UCITS alternatives where appropriate.
5. Do not invent prices, returns, fees, tickers, source URLs, regulatory conclusions, or availability claims. Clearly label anything that remains unverified.
6. Avoid promises of profit, misleading performance claims, and personalized investment advice. The final page must make clear that it is not investment advice.
7. Propose a minimal, credible conversion funnel, including form submission, successful lead capture, resource access, and UTM attribution. Consider privacy and spam protection.
8. Prefer a simple implementation that can realistically be completed and tested before the deadline. Do not introduce unnecessary infrastructure, paid services, or API keys.

## Step 1 — Research only

First inspect the current project directory and determine what already exists. Do not overwrite or delete existing files.

Then research the assignment and prepare a concise recommendation containing:

1. The proposed audience and their primary need.
2. The recommended landing-page concept, headline direction, and value proposition.
3. The lead magnet and why it is worth exchanging contact details for.
4. A shortlist of suitable ETFs or comparison candidates, with tickers, verified listing venues, relevant comparison fields, source URLs, verification dates, and any unresolved EU retail-access issues.
5. Two distinct advertisement concepts.
6. A proposed conversion funnel and UTM attribution approach.
7. The smallest practical technology and deployment plan.
8. The main risks, uncertainties, and a prioritized implementation plan for the remaining time.

Use available research tools if possible. If you cannot access reliable sources or verify a claim, explicitly state that limitation rather than guessing.

Keep the report concise and evidence-based. Separate verified facts from assumptions and hypotheses.

## Strict boundaries

- Do NOT implement the landing page.
- Do NOT install dependencies.
- Do NOT modify application files or generate application code.
- Do NOT create accounts, deploy anything, or purchase services.
- Do NOT create fake ETF data or fabricated session logs.
- Do NOT proceed to Step 2 automatically.

You may create one research report at `docs/step-1-research.md` if the environment permits writing files. Do not modify any other files.

At the end, summarize your recommendation, identify the most important unresolved questions, and STOP. Wait for my explicit approval before proceeding.

If a required research capability is unavailable, explain what could not be verified and still stop for my review.
