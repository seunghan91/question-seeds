import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ask SMILE vs 질문씨앗 — Korean Localization Comparison",
  description:
    "Side-by-side: how Ask SMILE responds to a Korean question today, and what a Korean-localized coaching experience looks like.",
};

// 동일 질문에 대한 실측 응답 비교 (2026-06-11 캡처/기록).
// 왼쪽: ask.smile.seedsofempowerment.org 실제 응답 스크린샷.
// 오른쪽: 질문씨앗 실제 응답 (LLM_PROVIDER=openai — SMILE 본진과 같은 GPT 계열).
const QUESTION = "광합성이 일어나려면 무엇이 필요한가요?";
const QUESTION_EN = "“What is needed for photosynthesis to occur?”";

const OURS = {
  level: 2,
  level_name: "이해 (Understanding)",
  rationale:
    "이 질문은 광합성의 과정에 대해 기본적인 이해를 요구하는 질문입니다. 단순히 사실이나 정보를 묻는 것이 아니라, 광합성이 일어나기 위한 요소들을 설명하도록 유도하고 있어, 그 원리를 이해해야 답할 수 있습니다.",
  coaching:
    "좋은 질문입니다! 광합성이 필요한 기본 요소에 대해 생각해보셨다면, 그 요소들이 서로 어떻게 작용하는지도 한번 고민해 보세요.\n\n예를 들어, 햇빛, 물, 이산화탄소가 왜 필요한지, 각 요소가 어떤 역할을 하는지를 연결 지어 설명하면 더 깊이 있는 이해가 가능합니다.",
  upgraded_question:
    "광합성이 이루어질 때 각 요소, 즉 햇빛, 물, 이산화탄소는 어떻게 상호작용하며 그 과정에서 어떤 결과가 나타나나요?",
};

export default function ComparePage() {
  return (
    <main className="flex-1 px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8a857a]">
          Korean Localization Proposal · Demo Evidence
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Same question, two experiences
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#444c55]">
          We asked the exact same Korean question — {QUESTION_EN} — to Ask SMILE
          and to this demo (질문씨앗, &ldquo;Question Seeds&rdquo;). Both run on
          GPT. The only difference is a Korean-native rubric prompt and
          few-shot examples.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Ask SMILE today */}
          <section className="flex flex-col rounded-2xl border border-[#e3dfd5] bg-white p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-[#5a6470]">
                Ask SMILE (live, English-only)
              </h2>
              <span className="rounded-full bg-stone-400 px-2.5 py-0.5 text-xs font-bold text-white">
                Level 1
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8a857a]">
              ask.smile.seedsofempowerment.org · captured 2026-06-11
            </p>
            <div className="mt-4 overflow-hidden rounded-lg border border-[#e3dfd5]">
              <Image
                src="/compare/ask-smile-en-response.png"
                alt={`Ask SMILE's English response to the Korean question ${QUESTION_EN}, classifying it as Level 1`}
                width={1280}
                height={566}
                className="h-auto w-full"
                priority
              />
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#444c55]">
              <li className="flex gap-2">
                <span aria-hidden>·</span>
                <span>
                  The entire response — rationale, suggestion, encouragement —
                  comes back in <strong>English</strong>, even though the
                  learner asked in Korean.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>·</span>
                <span>
                  Classified <strong>Level 1 (recall)</strong>, with the
                  response itself noting &ldquo;the question is in
                  Korean&rdquo; while judging its depth.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>·</span>
                <span>
                  The upgraded-question example is in English — a Korean
                  middle-schooler can&apos;t take the next step with it.
                </span>
              </li>
            </ul>
          </section>

          {/* 질문씨앗 */}
          <section className="flex flex-col rounded-2xl border border-emerald-200 bg-white p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-[#5a6470]">
                질문씨앗 — Korean-localized rubric (this demo)
              </h2>
              <span className="rounded-full bg-sky-500 px-2.5 py-0.5 text-xs font-bold text-white">
                Level 2
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8a857a]">
              Same GPT family · Korean rubric prompt + few-shot · live response
            </p>

            <div className="mt-4 rounded-lg bg-[#f7f6f2] p-4">
              <p className="text-sm font-semibold">{QUESTION}</p>
            </div>

            <dl className="mt-4 space-y-4 text-sm leading-relaxed text-[#444c55]">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-[#8a857a]">
                  판정 · {OURS.level_name}
                </dt>
                <dd className="mt-1">{OURS.rationale}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-[#8a857a]">
                  코칭
                </dt>
                <dd className="mt-1 whitespace-pre-line">{OURS.coaching}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-[#8a857a]">
                  한 단계 높인 질문
                </dt>
                <dd className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 p-3 font-medium">
                  {OURS.upgraded_question}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <h2 className="text-sm font-bold text-[#5a6470]">
            Why the level differs — and why it matters
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#444c55]">
            On our 50-question Korean benchmark (labels adapted from the Kim,
            Wang &amp; Bonk 2025 Ask.SMILE rubric), the Korean-native prompt
            scores <strong>92% exact / 96% ±1-level accuracy</strong> with the
            same GPT backbone. Beyond accuracy, coaching delivered in the
            learner&apos;s own language is what turns a verdict into a next
            question — the heart of SMILE&apos;s inquiry loop.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-[#1d2024] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Try the Korean coach →
            </Link>
            <Link
              href="/host"
              className="rounded-full border border-[#d8d4ca] px-4 py-2 text-sm font-semibold text-[#5a6470] hover:bg-[#f7f6f2]"
            >
              Workshop live mode →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
