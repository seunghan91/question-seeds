# 🌱 질문씨앗 (Question Seeds)

**English** — A working Korean-localization prototype of [Ask SMILE](https://ask.smile.seedsofempowerment.org)'s question coaching: questions are rated on the Bloom-aligned Level 1–5 rubric (adapted into Korean from Kim, Wang & Bonk 2025) with rationale, coaching, and an upgraded question — all in the learner's language. Includes a QR workshop mode with SMILE-style peer star ratings, and a 50-question Korean benchmark (**92% exact / 96% ±1** with a GPT backbone). Built as a volunteer contribution, offered for donation to Seeds of Empowerment.
**Live demo: <https://question-seeds.vercel.app>** · [EN vs KO comparison](https://question-seeds.vercel.app/compare) · [Proposal one-pager](docs/one-pager.md)

---

한국어 질문 코칭 데모 — 질문을 입력하면 Bloom의 교육목표 분류(Bloom's Taxonomy) 기준 **Level 1~5**로 평가하고, **한 단계 더 깊은 질문**으로 가는 길을 한국어로 코칭합니다.

> An unofficial demo **inspired by [Stanford SMILE](https://newsmile.seedsofempowerment.org)** — not affiliated with Seeds of Empowerment.
> 목적: Ask SMILE의 한국어 현지화(피드백·코칭의 한국어화)가 어떤 경험이어야 하는지 작동물로 보여주는 것. 코드·프롬프트·평가셋은 SoE 측이 원하면 기증을 전제로 공개합니다.

**Live: <https://question-seeds.vercel.app>**

## 구성

| 모드 | 경로 | 상태 |
|---|---|---|
| 솔로 질문 코칭 + 성장 히스토리 | `/` | ✅ 작동 (mock/anthropic/openai) |
| EN vs KO 비교 (피치 증거) | `/compare` | ✅ 작동 |
| 워크숍 라이브 (QR 입장 + 보드 + 피어 별점 + CSV) | `/host`, `/r/[code]` | ✅ 작동 — `supabase/schema.sql` 적용 필요 |

벤치마크: 한국어 50문항, GPT(gpt-4o-mini) exact **92%** / ±1 **96%** (mock 베이스라인 74%).

## 실행

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY 설정 (없으면 LLM_PROVIDER=mock)
npm run dev
```

- `LLM_PROVIDER=mock` — API 키 없이 결정적 휴리스틱으로 데모/E2E 가능
- `LLM_PROVIDER=anthropic` (기본) — `claude-sonnet-4-6`
- `LLM_PROVIDER=openai` — Ask SMILE 본진(GPT)과의 분류 일치 비교용

## 평가 (한국어 레벨 분류 정확도)

레벨 라벨링된 한국어 질문 50문항(`data/evalset.ko.json`)으로 분류 정확도를 측정합니다.
1~25번은 Kim, Wang & Bonk (2025)의 Ask.SMILE 루브릭 예시 테이블 번안, 26~50번은 자체 작성(초중고 + 성인 직무).

```bash
LLM_PROVIDER=mock npx tsx scripts/eval.ts                 # 휴리스틱 베이스라인 (74% exact)
ANTHROPIC_API_KEY=... npx tsx scripts/eval.ts             # Claude
LLM_PROVIDER=openai OPENAI_API_KEY=... npx tsx scripts/eval.ts  # GPT
```

결과(혼동행렬 포함)는 `data/eval-results/`에 저장됩니다. 목표: exact ≥ 80%.

## 왜 만들었나

Ask SMILE은 한국어 질문을 이해하고 평가하지만, 피드백은 영어로만 응답합니다(2026-06 기준).
한국 학생·교사에게는 이 지점이 실질적 진입 장벽이라, "피드백까지 한국어인 경험"을 데모로 만들었습니다.

- 루브릭 출처: Kim, P., Wang, W., & Bonk, C. J. (2025). *Generative AI as a Coach to Help Students Enhance Proficiency in Question Formulation*. Journal of Educational Computing Research.
- 시스템 프롬프트: `lib/rubric.ts` — 한국어 번안 루브릭 + 코칭 원칙 (자연스러운 한국어, 번역투 금지)

## License

MIT
