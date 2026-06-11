"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Dict = {
  title: string;
  subtitle: string;
  description: string;
  placeholder: string;
  submit: string;
  evaluating: string;
  level: string;
  rationale: string;
  coaching: string;
  upgraded: string;
  tryAgain: string;
  tryUpgraded: string;
  error: string;
  footer: string;
};

const dictionaries: Record<"ko" | "en", Dict> = {
  ko: {
    title: "질문씨앗",
    subtitle: "질문 하나가 생각의 깊이를 바꿉니다",
    description:
      "질문을 입력하면 Bloom 분류 기준 Level 1~5로 평가하고, 한 단계 더 깊은 질문으로 가는 길을 한국어로 코칭해 드립니다.",
    placeholder: "궁금한 것을 질문으로 적어 보세요. 예) 지진은 왜 일어나나요?",
    submit: "질문 평가받기",
    evaluating: "질문을 읽고 있어요…",
    level: "레벨",
    rationale: "판정 근거",
    coaching: "코칭",
    upgraded: "한 단계 높인 질문 예시",
    tryAgain: "다른 질문 해보기",
    tryUpgraded: "이 질문으로 다시 도전",
    error: "평가에 실패했어요. 잠시 후 다시 시도해 주세요.",
    footer:
      "Stanford SMILE에서 영감을 받은 비공식 데모입니다 · Seeds of Empowerment와 무관합니다",
  },
  en: {
    title: "Question Seeds",
    subtitle: "One question can change how deeply you think",
    description:
      "Submit a question and get it rated on Bloom's Taxonomy (Level 1–5), with coaching — in your own language — on how to take it one level deeper.",
    placeholder: "Write your question. e.g., Why do earthquakes happen?",
    submit: "Evaluate my question",
    evaluating: "Reading your question…",
    level: "Level",
    rationale: "Why this level",
    coaching: "Coaching",
    upgraded: "One level up — example",
    tryAgain: "Ask another question",
    tryUpgraded: "Retry with this question",
    error: "Evaluation failed. Please try again in a moment.",
    footer:
      "An unofficial demo inspired by Stanford SMILE · Not affiliated with Seeds of Empowerment",
  },
};

export type Locale = keyof typeof dictionaries;
export type { Dict };

const LocaleContext = createContext<{
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
}>({ locale: "ko", t: dictionaries.ko, setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ko");
  return (
    <LocaleContext.Provider
      value={{ locale, t: dictionaries[locale], setLocale }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
