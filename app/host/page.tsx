"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

type Row = {
  id: string;
  nickname: string;
  question: string;
  level: number;
  level_name: string;
  revealed: boolean;
  avg_stars: number | null;
  rating_count: number;
};

type Room = { code: string; host_key: string };

const BAR = ["", "bg-stone-400", "bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];

// 새로고침/탭 복원에도 룸 컨트롤을 유지한다 (codex P0 — 데모 중 룸 유실 방지).
const HOST_KEY = "qs:host";

export default function HostPage() {
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [qr, setQr] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [connLost, setConnLost] = useState(false);
  const [copied, setCopied] = useState(false);

  // 저장된 룸 복원 (post-mount, 비동기 — hydration·lint 안전)
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(localStorage.getItem(HOST_KEY) ?? "null");
        if (saved?.code && saved?.host_key) {
          setRoom({ code: saved.code, host_key: saved.host_key });
          setTitle(saved.title ?? "");
        }
      } catch {}
      setRestoring(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // 룸이 정해지면 입장 URL + QR 생성 (해제는 newRoom 이벤트 핸들러에서)
  useEffect(() => {
    if (!room) return;
    let active = true;
    const url = `${location.origin}/r/${room.code}`;
    QRCode.toDataURL(url, { width: 360, margin: 1 }).then((dataUrl) => {
      if (!active) return;
      setJoinUrl(url);
      setQr(dataUrl);
    });
    return () => {
      active = false;
    };
  }, [room]);

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
    try {
      localStorage.setItem(
        HOST_KEY,
        JSON.stringify({ code: data.code, host_key: data.host_key, title })
      );
    } catch {}
    setRoom(data);
  }

  function newRoom() {
    try {
      localStorage.removeItem(HOST_KEY);
    } catch {}
    setRoom(null);
    setRows([]);
    setTitle("");
    setQr("");
    setJoinUrl("");
  }

  const refresh = useCallback(async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.code}/board`, {
        headers: { "x-host-key": room.host_key },
      });
      if (res.status === 403 || res.status === 404) {
        // 저장된 룸이 더 이상 유효하지 않음 (삭제/잘못된 키) → 초기 화면으로
        newRoom();
        return;
      }
      if (!res.ok) throw new Error();
      setRows((await res.json()).submissions);
      setConnLost(false);
    } catch {
      setConnLost(true);
    }
  }, [room]);

  useEffect(() => {
    if (!room) return;
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, 3000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [room, refresh]);

  async function toggleReveal(row: Row) {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.code}/board`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host_key: room.host_key,
          submission_id: row.id,
          revealed: !row.revealed,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError("공개 전환에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setTimeout(() => setError(""), 3000);
    }
    refresh();
  }

  async function downloadCsv() {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.code}/board?format=csv`, {
        headers: { "x-host-key": room.host_key },
      });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `questions-${room.code}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("CSV 내보내기에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setTimeout(() => setError(""), 3000);
    }
  }

  async function copyJoinUrl() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const counts = [0, 0, 0, 0, 0, 0];
  rows.forEach((r) => counts[r.level]++);
  const max = Math.max(1, ...counts.slice(1));

  if (restoring) return <main className="flex-1" />;

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
            aria-label="세션 제목"
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
          <p className="mt-1 break-all text-xs text-[#8a909a]">{joinUrl}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={copyJoinUrl}
              className="rounded-xl border border-[#d8d4ca] px-4 py-2 text-sm font-semibold text-[#5a6470] hover:bg-white"
            >
              {copied ? "복사됨 ✓" : "링크 복사"}
            </button>
            <button
              onClick={downloadCsv}
              className="rounded-xl border border-[#d8d4ca] px-4 py-2 text-sm font-semibold text-[#5a6470] hover:bg-white"
            >
              CSV 내보내기
            </button>
          </div>
          <button
            onClick={newRoom}
            className="mt-3 text-xs text-[#9aa0a8] underline-offset-2 hover:underline"
          >
            새 룸 만들기
          </button>
        </aside>

        <section>
          {connLost && (
            <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              연결이 끊겼어요 — 자동으로 다시 시도하는 중입니다.
            </p>
          )}
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}
          <div className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
            <h2 className="text-sm font-bold text-[#5a6470]">
              레벨 분포 · 총 {rows.length}개
            </h2>
            <div className="mt-3 flex items-end gap-3" aria-hidden>
              {[1, 2, 3, 4, 5].map((lv) => (
                <div key={lv} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-bold text-[#5a6470]">{counts[lv]}</span>
                  <div
                    className={`w-full rounded-t-md ${BAR[lv]} transition-all`}
                    style={{ height: `${(counts[lv] / max) * 96 + 4}px` }}
                  />
                  <span className="text-[11px] font-semibold text-[#8a909a]">L{lv}</span>
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
                  <p className="break-words font-medium">{r.question}</p>
                  <p className="text-xs text-[#8a909a]">
                    {r.nickname}
                    {r.rating_count > 0 && (
                      <span className="ml-2 font-semibold text-amber-600">
                        ★ {r.avg_stars} ({r.rating_count})
                      </span>
                    )}
                  </p>
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
