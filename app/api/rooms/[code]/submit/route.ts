import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { evaluateQuestion } from "@/lib/evaluate";
import { rateLimit, clientKey } from "@/lib/ratelimit";

// POST /api/rooms/[code]/submit — 참가자 질문 제출.
// 서버가 LLM 평가 후 insert하므로 클라이언트는 level/coaching을 위조할 수 없다.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const limit = rateLimit(`submit:${clientKey(req)}`);
  if (!limit.ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const db = supabaseAdmin();
  if (!db)
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const { code } = await params;
  let body: { nickname?: string; question?: string; voter_key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const question = body.question?.trim();
  const nickname = (body.nickname?.trim() || "익명").slice(0, 20);
  if (!question || question.length > 500)
    return NextResponse.json({ error: "invalid_question" }, { status: 400 });
  // voter_key: 피어 평가의 "자기 질문 평가 불가" 검증용 advisory 식별자 (uuid만 수용)
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const submitterKey =
    body.voter_key && UUID_RE.test(body.voter_key) ? body.voter_key : null;

  const { data: room } = await db
    .from("rooms")
    .select("id")
    .eq("code", code.toUpperCase())
    .single();
  if (!room)
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });

  try {
    const ev = await evaluateQuestion(question);
    const { data: inserted, error } = await db
      .from("submissions")
      .insert({
        room_id: room.id,
        nickname,
        question,
        level: ev.level,
        level_name: ev.level_name,
        coaching: ev.coaching,
        upgraded_question: ev.upgraded_question,
        submitter_key: submitterKey,
      })
      .select("id")
      .single();
    if (error) throw error;
    // 개인 피드백 + 본인 질문 식별용 id ("내 질문" 배지 — UI 편의용, 보안 아님)
    return NextResponse.json({ ...ev, id: inserted.id });
  } catch (e) {
    console.error("submit failed:", e);
    return NextResponse.json({ error: "submit_failed" }, { status: 502 });
  }
}

// GET /api/rooms/[code]/submit — 룸 존재 확인 (참가자 입장 화면용, host_key 미노출)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const db = supabaseAdmin();
  if (!db)
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  const { code } = await params;
  const { data: room } = await db
    .from("rooms")
    .select("title, created_at")
    .eq("code", code.toUpperCase())
    .single();
  if (!room)
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });
  return NextResponse.json({ title: room.title });
}
