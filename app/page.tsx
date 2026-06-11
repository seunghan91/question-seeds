"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import type { Evaluation } from "@/lib/rubric";

const LEVEL_COLORS = [
  "",
  "bg-stone-400",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
];

// 성장 히스토리: Ask.SMILE은 단발 평가만 제공 — 반복 도전의 레벨 변화를 보여주는
// 차별화 기능. localStorage 전용(계정 없음), 최근 20개.
const HISTORY_KEY = "qs:history:v1";
type HistoryItem = { q: string; level: number; ts: number };

export default function Home() {
  const { locale, t, setLocale } = useLocale();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // post-mount 비동기 로드 (hydration·lint 안전)
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"));
      } catch {}
    });
    return () => {
      active = false;
    };
  }, []);

  async function evaluate(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ev = (await res.json()) as Evaluation;
      setResult(ev);
      const next = [
        ...history,
        { q: trimmed.slice(0, 80), level: ev.level, ts: Date.now() },
      ].slice(-20);
      setHistory(next);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              🌱 {t.title}
            </h1>
            <p className="mt-1 text-sm font-medium text-[#5a6470]">
              {t.subtitle}
            </p>
          </div>
          <button
            onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
            className="shrink-0 rounded-full border border-[#d8d4ca] px-3 py-1 text-xs font-semibold text-[#5a6470] hover:bg-white"
            aria-label="Switch language"
          >
            {locale === "ko" ? "EN" : "한국어"}
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#444c55]">
          {t.description}
        </p>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            evaluate(question);
          }}
        >
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-2xl border border-[#d8d4ca] bg-white p-4 text-base leading-relaxed shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="mt-3 w-full rounded-2xl bg-emerald-600 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
          >
            {loading ? t.evaluating : t.submit}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {t.error}
          </p>
        )}

        {result && (
          <section className="mt-6 rounded-2xl border border-[#e3dfd5] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-xl font-extrabold text-white ${LEVEL_COLORS[result.level]}`}
              >
                {result.level}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8a909a]">
                  {t.level} {result.level} / 5
                </p>
                <p className="text-lg font-bold">{result.level_name}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-1.5" aria-hidden>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 flex-1 rounded-full ${
                    n <= result.level ? LEVEL_COLORS[result.level] : "bg-[#eceae3]"
                  }`}
                />
              ))}
            </div>

            <dl className="mt-5 space-y-4 text-[15px] leading-relaxed">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-[#8a909a]">
                  {t.rationale}
                </dt>
                <dd className="mt-1">{result.rationale}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  {t.coaching}
                </dt>
                <dd className="mt-1">{result.coaching}</dd>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  {t.upgraded}
                </dt>
                <dd className="mt-1 font-medium">{result.upgraded_question}</dd>
              </div>
            </dl>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setQuestion(result.upgraded_question);
                  setResult(null);
                }}
                className="flex-1 rounded-xl border border-emerald-600 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
              >
                {t.tryUpgraded}
              </button>
              <button
                onClick={() => {
                  setQuestion("");
                  setResult(null);
                }}
                className="flex-1 rounded-xl border border-[#d8d4ca] py-2.5 text-sm font-bold text-[#5a6470] hover:bg-white"
              >
                {t.tryAgain}
              </button>
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-[#5a6470]">
                {t.historyTitle}
              </h2>
              <button
                onClick={clearHistory}
                className="text-xs text-[#9aa0a8] underline-offset-2 hover:underline"
              >
                {t.historyClear}
              </button>
            </div>
            <ol className="mt-3 flex flex-wrap items-end gap-1.5">
              {history.map((h, i) => {
                const delta = i > 0 ? h.level - history[i - 1].level : 0;
                return (
                  <li key={h.ts} className="flex flex-col items-center">
                    {delta > 0 ? (
                      <span className="text-[10px] font-bold leading-none text-emerald-600">
                        ▲{delta}
                      </span>
                    ) : (
                      <span className="text-[10px] leading-none">&nbsp;</span>
                    )}
                    <span
                      title={h.q}
                      className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white ${LEVEL_COLORS[h.level]}`}
                    >
                      {h.level}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>

      <footer className="mt-auto pt-12 pb-2 text-center text-xs text-[#9aa0a8]">
        {t.footer}
      </footer>
    </main>
  );
}
