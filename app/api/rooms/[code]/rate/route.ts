import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, clientKey } from "@/lib/ratelimit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/rooms/[code]/rate — 공개된 질문에 별점 (SMILE 피어 평가).
// { submission_id, stars: 1~5, voter_key }
// 재평가는 같은 voter_key의 upsert로 수정 처리. 자기 질문은 403.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // 교실은 NAT 뒤 공유 IP — 수십 명이 공개 질문 여러 개를 연달아 평가하는 게
  // 정상 사용. LLM 호출 없는 저비용 쓰기라 교실 규모(분당 300)로 캡.
  const limit = rateLimit(`rate:${clientKey(req)}`, 300);
  if (!limit.ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const db = supabaseAdmin();
  if (!db)
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const { code } = await params;
  let body: { submission_id?: string; stars?: number; voter_key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const stars = body.stars;
  if (!Number.isInteger(stars) || stars! < 1 || stars! > 5)
    return NextResponse.json({ error: "invalid_stars" }, { status: 400 });
  if (
    !body.submission_id ||
    !UUID_RE.test(body.submission_id) ||
    !body.voter_key ||
    !UUID_RE.test(body.voter_key)
  )
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const { data: room } = await db
    .from("rooms")
    .select("id")
    .eq("code", code.toUpperCase())
    .single();
  if (!room)
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });

  const { data: sub } = await db
    .from("submissions")
    .select("id, room_id, revealed, submitter_key")
    .eq("id", body.submission_id)
    .single();
  if (!sub || sub.room_id !== room.id)
    return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
  if (!sub.revealed)
    return NextResponse.json({ error: "not_revealed" }, { status: 403 });
  if (sub.submitter_key && sub.submitter_key === body.voter_key)
    return NextResponse.json({ error: "cannot_rate_own" }, { status: 403 });

  const { error } = await db
    .from("ratings")
    .upsert(
      {
        submission_id: sub.id,
        voter_key: body.voter_key,
        stars,
      },
      { onConflict: "submission_id,voter_key" }
    );
  if (error) return NextResponse.json({ error: "rate_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
