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
  const hostKey = req.nextUrl.searchParams.get("host_key");
  const { db, room } = await authRoom(code, hostKey);
  if (!db)
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  if (!room) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: rows } = await db
    .from("submissions")
    .select("id, nickname, question, level, level_name, revealed, created_at")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });

  if (req.nextUrl.searchParams.get("format") === "csv") {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [
      "created_at,nickname,level,question",
      ...(rows ?? []).map((r) =>
        [r.created_at, esc(r.nickname), r.level, esc(r.question)].join(",")
      ),
    ].join("\n");
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="questions-${code}.csv"`,
      },
    });
  }

  return NextResponse.json({ title: room.title, submissions: rows ?? [] });
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
