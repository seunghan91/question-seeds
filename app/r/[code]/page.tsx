"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Evaluation } from "@/lib/rubric";

const BAR = ["", "bg-stone-400", "bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];

export default function ParticipantPage() {
  const { code } = useParams<{ code: string }>();
  const [roomTitle, setRoomTitle] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [nickname, setNickname] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/rooms/${code}/submit`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setRoomTitle(d.title || "질문 워크숍"))
      .catch(() => setNotFound(true));
  }, [code]);

  async function submit() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/rooms/${code}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, question: question.trim() }),
      });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (notFound)
    return (
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-[#5a6470]">존재하지 않는 룸입니다. 코드를 확인해 주세요.</p>
      </main>
    );

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
          {roomTitle ?? "연결 중…"}
        </p>
        <h1 className="mt-1 text-2xl font-bold">🌱 질문을 심어 보세요</h1>

        {!result ? (
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 (선택, 익명 가능)"
              maxLength={20}
              className="w-full rounded-xl border border-[#d8d4ca] bg-white p-3 text-sm outline-none focus:border-emerald-500"
            />
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="지금 가장 궁금한 것을 질문으로 적어 보세요"
              rows={4}
              maxLength={500}
              className="mt-3 w-full resize-none rounded-xl border border-[#d8d4ca] bg-white p-3 text-base outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="mt-3 w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              {loading ? "질문을 읽고 있어요…" : "질문 제출하기"}
            </button>
            {error && (
              <p className="mt-3 text-sm text-red-600">제출에 실패했어요. 다시 시도해 주세요.</p>
            )}
          </form>
        ) : (
          <section className="mt-5 rounded-2xl border border-[#e3dfd5] bg-white p-5">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-extrabold text-white ${BAR[result.level]}`}
              >
                {result.level}
              </span>
              <div>
                <p className="text-xs font-semibold text-[#8a909a]">
                  내 질문은 Level {result.level} / 5
                </p>
                <p className="text-lg font-bold">{result.level_name}</p>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed">{result.coaching}</p>
            <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-[15px]">
              <p className="text-xs font-bold uppercase text-emerald-700">한 단계 높인 질문</p>
              <p className="mt-1 font-medium">{result.upgraded_question}</p>
            </div>
            <button
              onClick={() => {
                setQuestion(result.upgraded_question);
                setResult(null);
              }}
              className="mt-4 w-full rounded-xl border border-emerald-600 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
            >
              이 질문으로 다시 도전
            </button>
            <button
              onClick={() => {
                setQuestion("");
                setResult(null);
              }}
              className="mt-2 w-full rounded-xl border border-[#d8d4ca] py-2.5 text-sm font-bold text-[#5a6470]"
            >
              새 질문 제출
            </button>
          </section>
        )}

        <footer className="mt-8 text-center text-[11px] text-[#9aa0a8]">
          익명으로 제출되며, 발표자가 공개한 질문만 화면에 표시됩니다.
        </footer>
      </div>
    </main>
  );
}
