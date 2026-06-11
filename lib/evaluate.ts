import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import {
  evaluationSchema,
  RUBRIC_SYSTEM_PROMPT,
  LEVEL_NAMES_KO,
  type Evaluation,
} from "./rubric";

// LLM_PROVIDER=anthropic(기본) | openai | mock
// mock은 API 키 없이 로컬 데모/E2E가 돌도록 하는 결정적 휴리스틱.
function resolveProvider() {
  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  if (provider === "mock") return null;
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) return null;
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini");
  }
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6");
}

export async function evaluateQuestion(question: string): Promise<Evaluation> {
  const model = resolveProvider();
  if (!model) {
    // 프로덕션에서 키 누락/만료로 조용히 mock이 나가면 "가짜 데모"처럼 보인다.
    // mock은 명시적 LLM_PROVIDER=mock 또는 비프로덕션에서만 허용 (codex P0).
    const explicitMock = process.env.LLM_PROVIDER === "mock";
    const isProd =
      (process.env.VERCEL_ENV ?? process.env.NODE_ENV) === "production";
    if (isProd && !explicitMock) {
      throw new Error("llm_not_configured"); // 라우트가 502로 변환
    }
    return mockEvaluate(question);
  }

  const { object } = await generateObject({
    model,
    schema: evaluationSchema,
    system: RUBRIC_SYSTEM_PROMPT,
    prompt: `다음 질문을 평가해 주세요:\n\n"${question}"`,
  });
  return object;
}

// ---------- mock mode (no API key) ----------

const L5 = /(재설계|설계해|어떻게 만들|평가해|판단해|가장 좋은|제안|만약|가설|어떻게 바꾸|개선할 수 있)/;
const L4 = /(차이|공통점|비교|관계|영향|왜 .*반면|어떻게 연결|구조|원인과)/;
const L3 = /(적용|활용|이용해|사용해서|어떻게 .*(할 수|해결))/;
const L2 = /(왜|어떻게|무슨 뜻|의미|원리|이유)/;

function guessLevel(q: string): number {
  if (L5.test(q)) return 5;
  if (L4.test(q)) return 4;
  if (L3.test(q)) return 3;
  if (L2.test(q)) return 2;
  return 1;
}

function mockEvaluate(question: string): Evaluation {
  const level = guessLevel(question);
  const name = LEVEL_NAMES_KO[level];
  return {
    level,
    level_name: name,
    rationale: `[데모 모드] 키워드 기반 휴리스틱으로 Level ${level}(${name})로 분류했습니다. 실제 평가는 LLM API 키를 설정하면 활성화됩니다.`,
    coaching:
      level >= 5
        ? "이미 높은 수준의 질문이에요. 조건이나 제약을 추가해 더 정교하게 다듬어 보세요."
        : `좋은 출발이에요. 이 질문에 "왜 그럴까?", "다른 것과 비교하면?", "내가 설계한다면?"을 덧붙이면 Level ${level + 1}로 올라갈 수 있어요.`,
    upgraded_question:
      level >= 5
        ? question
        : `${question.replace(/[?？]\s*$/, "")}— 그렇다면 그 이유와 다른 대안을 비교해 설명할 수 있을까요?`,
  };
}
