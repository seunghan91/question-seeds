import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function authRoom(code: string, hostKey: string | null) {
  const db = supabaseAdmin();
  if (!db) return { db: null, room: null };
  const { data: room } = await db
    .from("rooms")
    .select("id, title, host_key")
    .eq("code", code.toUpperCase())
    .single();
  if (!room || !hostKey || room.host_key !== hostKey)
    return { db, room: null };
  return { db, room };
}

// GET /api/rooms/[code]/board?host_key=...&format=csv — 호스트 보드 (전체 제출물)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  // host_key는 URL이 아닌 헤더로만 받는다 (로그·히스토리 유출 방지)
  const hostKey = req.headers.get("x-host-key");
  const { db, room } = await authRoom(code, hostKey);
  if (!db)
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  if (!room) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: rows } = await db
    .from("submissions")
    .select("id, nickname, question, level, level_name, revealed, created_at")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });

  // 피어 별점 집계 머지 (2차 쿼리 — 워크숍 규모에서 충분)
  const ids = (rows ?? []).map((r) => r.id);
  const stats = new Map<string, { avg_stars: number; rating_count: number }>();
  if (ids.length > 0) {
    const { data: statRows } = await db
      .from("submission_rating_stats")
      .select("submission_id, avg_stars, rating_count")
      .in("submission_id", ids);
    for (const s of statRows ?? [])
      stats.set(s.submission_id, {
        avg_stars: Number(s.avg_stars),
        rating_count: s.rating_count,
      });
  }
  const enriched = (rows ?? []).map((r) => ({
    ...r,
    avg_stars: stats.get(r.id)?.avg_stars ?? null,
    rating_count: stats.get(r.id)?.rating_count ?? 0,
  }));

  if (req.nextUrl.searchParams.get("format") === "csv") {
    // 셀 앞에 ' 를 붙여 스프레드시트 수식 주입(=,+,-,@) 차단
    const esc = (s: string) => {
      let v = String(s);
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
      return `"${v.replace(/"/g, '""')}"`;
    };
    const csv = [
      "created_at,nickname,level,question,avg_stars,rating_count",
      ...enriched.map((r) =>
        [
          r.created_at,
          esc(r.nickname),
          r.level,
          esc(r.question),
          r.avg_stars ?? "",
          r.rating_count,
        ].join(",")
      ),
    ].join("\n");
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="questions-${code}.csv"`,
      },
    });
  }

  return NextResponse.json({ title: room.title, submissions: enriched });
}

// PATCH /api/rooms/[code]/board — reveal 토글 { host_key, submission_id, revealed }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { host_key?: string; submission_id?: string; revealed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { db, room } = await authRoom(code, body.host_key ?? null);
  if (!db)
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  if (!room) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await db
    .from("submissions")
    .update({ revealed: !!body.revealed })
    .eq("id", body.submission_id)
    .eq("room_id", room.id);
  if (error) return NextResponse.json({ error: "update_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
