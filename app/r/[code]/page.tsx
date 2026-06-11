"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Evaluation } from "@/lib/rubric";

const BAR = ["", "bg-stone-400", "bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];

type WallRow = {
  id: string;
  nickname: string;
  question: string;
  level: number;
  level_name: string;
  avg_stars: number | null;
  rating_count: number;
  my_stars: number | null;
};

function getVoterKey(): string {
  try {
    let key = localStorage.getItem("qs:voter");
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem("qs:voter", key);
    }
    return key;
  } catch {
    return ""; // private mode 등 — 평가 기능만 비활성화되고 나머지는 동작
  }
}

export default function ParticipantPage() {
  const { code } = useParams<{ code: string }>();
  const [roomTitle, setRoomTitle] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [nickname, setNickname] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [wall, setWall] = useState<WallRow[]>([]);
  const [myIds, setMyIds] = useState<string[]>([]);
  const [voterKey, setVoterKey] = useState("");
  const [rateError, setRateError] = useState("");

  useEffect(() => {
    // post-mount 비동기 로드 (hydration·lint 안전)
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setVoterKey(getVoterKey());
      try {
        setMyIds(JSON.parse(sessionStorage.getItem(`qs:mine:${code}`) ?? "[]"));
      } catch {}
    });
    return () => {
      active = false;
    };
  }, [code]);

  useEffect(() => {
    fetch(`/api/rooms/${code}/submit`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setRoomTitle(d.title || "질문 워크숍"))
      .catch(() => setNotFound(true));
  }, [code]);

  const refreshWall = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}/wall`, {
        headers: voterKey ? { "x-voter-key": voterKey } : {},
      });
      if (!res.ok) return;
      const d = await res.json();
      setWall(d.submissions ?? []);
    } catch {}
  }, [code, voterKey]);

  useEffect(() => {
    const first = setTimeout(refreshWall, 0);
    const t = setInterval(refreshWall, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [refreshWall]);

  async function submit() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/rooms/${code}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          question: question.trim(),
          voter_key: voterKey || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const ev = (await res.json()) as Evaluation & { id?: string };
      setResult(ev);
      if (ev.id) {
        const next = [...myIds, ev.id];
        setMyIds(next);
        try {
          sessionStorage.setItem(`qs:mine:${code}`, JSON.stringify(next));
        } catch {}
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function rate(submissionId: string, stars: number) {
    if (!voterKey) return;
    const prev = wall;
    setRateError("");
    // optimistic — 실패 시 원복
    setWall((w) =>
      w.map((r) => (r.id === submissionId ? { ...r, my_stars: stars } : r))
    );
    try {
      const res = await fetch(`/api/rooms/${code}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          stars,
          voter_key: voterKey,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setWall(prev);
        setRateError(
          d.error === "cannot_rate_own"
            ? "내 질문에는 별점을 줄 수 없어요."
            : d.error === "rate_limited"
              ? "잠시 후 다시 시도해 주세요."
              : "별점 반영에 실패했어요. 다시 시도해 주세요."
        );
        setTimeout(() => setRateError(""), 3000);
        return;
      }
    } catch {
      setWall(prev);
      setRateError("별점 반영에 실패했어요. 다시 시도해 주세요.");
      setTimeout(() => setRateError(""), 3000);
      return;
    }
    refreshWall();
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

        <section className="mt-8">
          <h2 className="text-sm font-bold text-[#5a6470]">
            공개된 질문 · 별점으로 평가해 보세요
          </h2>
          {rateError && (
            <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">
              {rateError}
            </p>
          )}
          {wall.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-[#d8d4ca] p-5 text-center text-sm text-[#8a909a]">
              발표자가 공개한 질문이 여기에 표시됩니다.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {wall.map((r) => {
                const mine = myIds.includes(r.id);
                return (
                  <li
                    key={r.id}
                    className="rounded-xl border border-[#e3dfd5] bg-white p-4"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${BAR[r.level]}`}
                      >
                        {r.level}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-[15px] leading-snug">{r.question}</p>
                        <p className="mt-1 text-xs text-[#8a909a]">
                          {r.nickname}
                          {mine && (
                            <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              내 질문
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div
                        className="flex gap-0.5"
                        role="radiogroup"
                        aria-label="질문 별점"
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            disabled={mine || !voterKey}
                            onClick={() => rate(r.id, s)}
                            aria-label={`별 ${s}개`}
                            className={`text-lg leading-none disabled:cursor-not-allowed ${
                              (r.my_stars ?? 0) >= s
                                ? "text-amber-400"
                                : "text-stone-300"
                            } ${mine ? "opacity-40" : "hover:text-amber-300"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-[#8a909a]">
                        {r.avg_stars != null
                          ? `★ ${r.avg_stars} (${r.rating_count})`
                          : "아직 평가 없음"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="mt-8 text-center text-[11px] text-[#9aa0a8]">
          익명으로 제출되며, 발표자가 공개한 질문만 모두에게 표시됩니다.
        </footer>
      </div>
    </main>
  );
}
