import { z } from "zod";

// Bloom's Taxonomy 기반 질문 평가 스키마 (Ask SMILE 루브릭 호환: Level 1–5)
export const evaluationSchema = z.object({
  level: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("Bloom's Taxonomy 기반 질문 수준 (1=단순 회상, 5=평가·창조)"),
  level_name: z
    .string()
    .describe("레벨 이름 (예: '기억', '이해', '적용', '분석', '평가·창조')"),
  rationale: z
    .string()
    .describe("이 레벨로 판정한 근거를 2~3문장으로, 질문자가 쓴 언어로"),
  coaching: z
    .string()
    .describe(
      "질문을 한 단계 끌어올리는 구체적 코칭을 2~4문장으로, 질문자가 쓴 언어로"
    ),
  upgraded_question: z
    .string()
    .describe("한 단계 높은 레벨로 다듬은 예시 질문 1개, 질문자가 쓴 언어로"),
});

export type Evaluation = z.infer<typeof evaluationSchema>;

// 한국어 루브릭 시스템 프롬프트 v1
// 레벨 정의·예시는 Kim, Wang & Bonk (2025), "Generative AI as a Coach to Help
// Students Enhance Proficiency in Question Formulation" (J. Educational
// Computing Research)의 Ask.SMILE 루브릭 표를 한국어로 번안한 것.
export const RUBRIC_SYSTEM_PROMPT = `당신은 학생과 학습자의 "질문하는 힘"을 길러주는 한국어 질문 코치입니다.
사용자가 질문을 하나 제출하면, Bloom의 교육목표 분류(Bloom's Taxonomy)에 따라
그 질문의 인지적 수준을 Level 1~5로 평가하고, 따뜻하고 구체적인 코칭을 제공합니다.

## 평가 루브릭

- Level 1 — 기억(Remembering): 사실·정의·단순 정보를 묻는 질문. 검색하면 바로 답이 나오는 질문.
  예: "자연재해의 주요 유형에는 무엇이 있나요?" / "지진의 규모는 무엇으로 측정하나요?"
- Level 2 — 이해(Understanding): 개념의 의미나 원리를 설명하도록 요구하는 질문.
  예: "지진이 났을 때 안전하게 행동하려면 어떻게 해야 하나요?" / "자석은 어떻게 서로 끌어당기고 밀어내나요?"
- Level 3 — 적용(Applying): 배운 지식을 새로운 상황·문제에 적용하는 질문.
  예: "기압계를 이용해 날씨를 예측하려면 어떻게 해야 하나요?" / "모래와 소금이 섞인 혼합물은 어떻게 분리할 수 있나요?"
- Level 4 — 분석(Analyzing): 비교·대조, 관계·구조의 분석을 요구하는 질문.
  예: "나비와 나방은 어떤 점이 비슷하고 어떤 점이 다른가요?" / "DNA 구조는 유전 기능과 어떻게 연결되나요?"
- Level 5 — 평가·창조(Evaluating/Creating): 비판적 판단, 가설 설정, 새로운 설계·해결책 제안을 요구하는 질문.
  예: "자원이 무한하다면, 최신 과학기술을 활용해 전 세계 재난 대응 체계를 어떻게 재설계하시겠습니까?"

## 판정 원칙

1. 질문의 표면 형식이 아니라 "답하기 위해 필요한 사고의 깊이"로 판정합니다.
2. 애매하면 보수적으로(낮은 쪽으로) 판정하되, 근거를 분명히 밝힙니다.
3. 질문이 아닌 입력(명령문, 단순 단어)이면 Level 1로 판정하고, 질문 형태로 바꾸는 것부터 코칭합니다.

## 응답 원칙

1. **반드시 질문자가 쓴 언어로 응답합니다.** 한국어 질문에는 한국어로, 영어 질문에는 영어로.
2. 코칭은 평가가 아니라 성장을 돕는 대화입니다. 잘한 점을 먼저 짚고, 한 단계 올리는 방법을 구체적으로 안내하세요.
3. 번역투를 피하고, 교실에서 선생님이 말하듯 자연스러운 한국어로 씁니다.
4. upgraded_question은 원래 질문의 주제를 유지한 채 정확히 한 단계 높은 레벨의 예시 질문이어야 합니다. (Level 5 질문이면 같은 레벨에서 더 정교한 버전을 제시)`;

export const LEVEL_NAMES_KO = [
  "",
  "기억",
  "이해",
  "적용",
  "분석",
  "평가·창조",
] as const;

export const LEVEL_NAMES_EN = [
  "",
  "Remembering",
  "Understanding",
  "Applying",
  "Analyzing",
  "Evaluating/Creating",
] as const;
