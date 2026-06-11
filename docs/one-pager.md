# Korean Localization Proposal for Ask SMILE

**Seunghan Kim** · Seoul, Korea · theqwe2000@gmail.com · June 2026

**Live demo: <https://question-seeds.vercel.app>** · Comparison: [/compare](https://question-seeds.vercel.app/compare) · Workshop mode: [/host](https://question-seeds.vercel.app/host)

---

## The gap

Ask SMILE evaluates questions against a Bloom-aligned Level 1–5 rubric — but it answers in English only. When we submitted a Korean question ("광합성이 일어나려면 무엇이 필요한가요?" / *What is needed for photosynthesis?*), the live service replied entirely in English, rated it **Level 1**, and its response noted "the question is in Korean" while judging its depth. The upgraded-question example also came back in English — a Korean middle-schooler cannot take the next step with it.

**Scope, precisely:** SMILE's mobile app already offers Korean (and Chinese) interfaces. This proposal targets the **AI coaching layer** — Ask SMILE — whose non-English evaluation is, to our knowledge, neither documented nor validated. The 2025 study itself names cross-language validity of AI evaluation as an open task; the benchmark below is a first concrete answer for Korean.

## What I built (working, deployed)

**질문씨앗 (Question Seeds)** — a Korean-native localization prototype of the Ask SMILE coaching loop, built as a volunteer contribution and intended for donation to Seeds of Empowerment.

1. **Korean rubric prompt** — the Level 1–5 rubric and few-shot examples adapted into Korean from Kim, Wang & Bonk (2025), producing structured output: level, rationale, coaching, and an upgraded question — all in the learner's language.
2. **Solo coaching** (`/`) — a learner submits a question and receives level + coaching + a one-level-deeper version of their own question, all in Korean.
3. **Workshop live mode** (`/host`, `/r/CODE`) — a facilitator creates a QR room; participants submit questions from their phones and get private coaching; the facilitator sees a live level histogram and selectively reveals questions, which participants can then **peer-rate with 1–5 stars** (SMILE-style — own questions can't be rated); average ratings appear on the host board and CSV export. Designed for classrooms and teacher training.
4. **Korean benchmark** — a 50-question evalset labeled on the same rubric (25 items translated from the paper's examples, 25 new Korean items spanning school and everyday/workplace contexts).
5. **Growth history** — Ask SMILE evaluates one question at a time; this demo also shows each learner their own level trajectory across attempts (local, no account). The 2025 study's central finding is improvement through repeated coaching — the trajectory makes that visible to the learner herself.

**A deliberate localization choice:** in the workshop flow, feedback is *private-first* — each participant sees their own coaching, and questions become public only when the facilitator reveals them. SMILE research notes that in some educational cultures students hesitate to expose questions publicly; private-first lowers that barrier for Korean classrooms while keeping the SMILE peer-evaluation loop (star ratings) on revealed questions.

## Results

| Configuration | Exact accuracy | ±1 level |
|---|---|---|
| Korean rubric prompt + GPT (gpt-4o-mini) | **92%** (46/50) | **96%** |
| Heuristic baseline (no LLM) | 74% | — |

Same question, side by side: Ask SMILE (live) → English response, Level 1. Korean rubric, same GPT family → **Level 2 (Understanding)** with Korean rationale, coaching, and an upgraded question the learner can actually use. Full comparison with screenshots: [/compare](https://question-seeds.vercel.app/compare).

## The offer

I'd like to donate this work — rubric prompt, evalset, and the full source (Next.js + Supabase, security-reviewed) — to Seeds of Empowerment, under whatever license fits SMILE's stack, and continue as a volunteer on Korean localization: rubric refinement with Korean educators, evalset expansion, and integration into the SMILE platform. The workshop mode is also ready to use as-is for SMILE-style teacher training sessions in Korea.

**Roadmap if useful to SoE:** multiple-choice question format with auto-grading (SMILE's classroom staple), a hybrid classifier fine-tuned on a Korean question corpus (mirroring SMILE's labeled-corpus approach), and facilitator phase controls (create → answer → rate → reflect).

*Stack: Next.js 16 · Vercel AI SDK (provider-agnostic: GPT / Claude) · Supabase (RLS, server-only writes) · running cost ≈ LLM API calls only.*
