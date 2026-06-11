"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Row = {
  id: string;
  nickname: string;
  question: string;
  level: number;
  level_name: string;
  revealed: boolean;
};

const BAR = ["", "bg-stone-400", "bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];

export default function HostPage() {
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState<{ code: string; host_key: string } | null>(null);
  const [qr, setQr] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const joinUrl = useRef("");

  async function createRoom() {
    setError("");
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      setError(res.status === 503 ? "Supabase가 아직 설정되지 않았습니다 (.env.local 확인)" : "룸 생성 실패");
      return;
    }
    const data = await res.json();
    joinUrl.current = `${location.origin}/r/${data.code}`;
    setQr(await QRCode.toDataURL(joinUrl.current, { width: 360, margin: 1 }));
    setRoom(data);
  }

  const refresh = useCallback(async () => {
    if (!room) return;
    const res = await fetch(
      `/api/rooms/${room.code}/board?host_key=${room.host_key}`
    );
    if (res.ok) setRows((await res.json()).submissions);
  }, [room]);

  useEffect(() => {
    if (!room) return;
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [room, refresh]);

  async function toggleReveal(row: Row) {
    if (!room) return;
    await fetch(`/api/rooms/${room.code}/board`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host_key: room.host_key,
        submission_id: row.id,
        revealed: !row.revealed,
      }),
    });
    refresh();
  }

  const counts = [0, 0, 0, 0, 0, 0];
  rows.forEach((r) => counts[r.level]++);
  const max = Math.max(1, ...counts.slice(1));

  if (!room)
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold">🌱 워크숍 룸 만들기</h1>
          <p className="mt-2 text-sm text-[#5a6470]">
            QR로 입장한 참가자들이 익명으로 질문을 제출하고, 즉시 개인 코칭을 받습니다.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="세션 제목 (예: AI 시대의 질문법 워크숍)"
            className="mt-5 w-full rounded-xl border border-[#d8d4ca] bg-white p-3 text-sm outline-none focus:border-emerald-500"
          />
          <button
            onClick={createRoom}
            className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700"
          >
            룸 생성
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </main>
    );

  return (
    <main className="flex-1 px-6 py-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="text-center">
          <h1 className="text-xl font-bold">{title || "질문 워크숍"}</h1>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="입장 QR" className="mx-auto mt-4 rounded-xl border border-[#e3dfd5]" />
          )}
          <p className="mt-3 font-mono text-3xl font-extrabold tracking-[0.3em]">
            {room.code}
          </p>
          <p className="mt-1 text-xs text-[#8a909a]">{joinUrl.current}</p>
          <a
            href={`/api/rooms/${room.code}/board?host_key=${room.host_key}&format=csv`}
            className="mt-4 inline-block rounded-xl border border-[#d8d4ca] px-4 py-2 text-sm font-semibold text-[#5a6470] hover:bg-white"
          >
            CSV 내보내기
          </a>
        </aside>

        <section>
          <div className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
            <h2 className="text-sm font-bold text-[#5a6470]">
              레벨 분포 · 총 {rows.length}개
            </h2>
            <div className="mt-3 flex items-end gap-3" style={{ height: 120 }}>
              {[1, 2, 3, 4, 5].map((lv) => (
                <div key={lv} className="flex flex-1 flex-col items-center justify-end h-full">
                  <span className="text-xs font-bold">{counts[lv]}</span>
                  <div
                    className={`w-full rounded-t-lg ${BAR[lv]} transition-all`}
                    style={{ height: `${(counts[lv] / max) * 90}%` }}
                  />
                  <span className="mt-1 text-xs text-[#8a909a]">L{lv}</span>
                </div>
              ))}
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                  r.revealed ? "border-emerald-300 bg-emerald-50" : "border-[#e3dfd5] bg-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${BAR[r.level]}`}
                >
                  {r.level}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.question}</p>
                  <p className="text-xs text-[#8a909a]">{r.nickname}</p>
                </div>
                <button
                  onClick={() => toggleReveal(r)}
                  className="shrink-0 rounded-lg border border-[#d8d4ca] px-3 py-1.5 text-xs font-bold text-[#5a6470] hover:bg-white"
                >
                  {r.revealed ? "공개됨 ✓" : "공개"}
                </button>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="rounded-xl border border-dashed border-[#d8d4ca] p-6 text-center text-sm text-[#8a909a]">
                참가자의 질문을 기다리는 중…
              </li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
