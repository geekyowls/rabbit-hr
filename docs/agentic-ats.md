# Agentic ATS - architecture & product thinking

How RabbitHR becomes an AI-powered, agentic Applicant Tracking System that stays fast and trustworthy at scale (100k+ candidates for a single job).

## The core reframe

At 100k candidates per job a human cannot review the pile. The product's job flips: **the recruiter stops reviewing and starts supervising a funnel.** Everything below serves that. The common mistake is running an LLM over every candidate - slow and expensive. Greenhouse / Ashby (and AI-native players like Mercor, Micro1, HeyMilo) win on **structured data + a cheap-to-expensive evaluation cascade**, not raw model calls.

## 1. Data substrate (most of the moat)

- **Parse every resume into a structured profile** (skills, titles, seniority, years of experience, companies, education) with an LLM, then **normalize** against a taxonomy: skill synonyms, company canonicalization, title leveling. Structured data is what makes ranking consistent and explainable.
- **Embed** each profile and the job description into a vector space (pgvector on Postgres, or Typesense hybrid).
- **Hybrid retrieval**: structured must-have filters first (5+ yrs React, work authorization, location), then semantic rerank on the survivors.

## 2. The cascade - the scale answer

A funnel of increasingly expensive judges. The LLM only ever touches the top slice:

```
100k  -> SQL / faceted filters (must-haves)        -> ~2k     (ms, ~free)
2k    -> embedding + reranker vs the JD/ideal hire -> ~200    (cheap)
200   -> LLM deep eval against the job rubric      -> top 20  (expensive, only here)
```

New applicants are parsed + embedded on ingest (async worker) so the ranked shortlist is always warm, never recomputed from scratch.

## 3. The agentic layer

Agents = LLM + tools + a goal + human-in-the-loop gates. Each runs as an async job on the queue worker:

- **Sourcing agent** - JD to internal + external search, dedupe.
- **Screening agent** - async chat/video screen, role-specific questions, scores answers.
- **Shortlist agent** - maintains a live ranked "top N to look at today" with reasons.
- **Scheduling agent** - coordinates interviews across the seeded Calendar / Zoom integrations.
- **Outreach / nurture agent** - personalized emails, re-engages silver medalists.
- **Summary agent** - interview notes to scorecard, thread summaries.

Everything candidate-facing (send email, reject) passes a **human approval gate**. Every score is **explainable**: evidence quotes from the resume, matched and missing must-haves. Recruiters will not trust a black-box number.

## 4. UX shifts

- **Ranked "recommended" queue** instead of a flat table. Approve / reject **trains the ranker** - the compounding advantage.
- **Natural-language search** - "backend engineers in Bangalore, ex-FAANG, open to relocate" runs the retrieval and returns a ranked slice.
- **Bulk agent actions** on a selection - screen all Applied, reject everyone missing a must-have (with reason), draft outreach to the top 50.
- **Agent activity feed** for transparency.
- **AI insights + scorecard** on each candidate as the explainability surface.

## 5. What Greenhouse / Ashby lean on

- **Rubric-driven scorecards as ground truth** - the job defines must-haves and nice-to-haves; AI scores against the rubric, not vibes.
- **Compliance is table stakes** - audit logs, PII stripping for scoring, EEOC / GDPR, bias controls.
- **Ashby is analytics-first** (funnel conversion, source ROI); **Greenhouse is workflow / compliance-first** plus AI screening partners.
- Their moat is millions of hire/reject decisions calibrating the model. A new ATS wins by being AI-native and fast, with the feedback loop from day one - not by out-data-ing them.

## 6. MVP (on the stack we already have)

Backend already has NestJS + Postgres + BullMQ worker + storage + Typesense + an AI service. First slice:

1. **Ingest -> parse -> structured `candidate_profile` + embedding** (worker job; Haiku for parsing / first pass, Sonnet or Opus only for top-slice deep eval - tiering is the cost control).
2. **Per-job rubric** + the **retrieval cascade** -> an explainable **ranked shortlist** for one job.
3. **One screening agent** with an approval gate.
4. Surface a **"Recommended" ranked view** on the Candidates page, reusing the grid + AI insights drawer.

Magic moment: upload 100k, get a trustworthy ranked top-20 with reasons.

## Data model sketch (future)

- `candidate_profile` - structured parse of a resume (skills[], titles[], years, companies[], education[], embedding vector).
- `job_rubric` - must-haves, nice-to-haves, red flags, weights per job.
- `match_evaluation` - candidate x job -> score, matched[], gaps[], evidence[], model, createdAt.
- `agent_run` - agent type, input, tool calls, output, status, approval state, actor.

## Prototype

A first UX prototype lives at `/dashboard/ai-match` (dev nav) - job selector, sourcing funnel, natural-language query, and an explainable ranked shortlist with per-candidate match score, matched/gap chips, rationale, and approve/reject actions. Mock data only; wires to the pipeline above later.
