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
  let body: { nickname?: string; question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const question = body.question?.trim();
  const nickname = (body.nickname?.trim() || "익명").slice(0, 20);
  if (!question || question.length > 500)
    return NextResponse.json({ error: "invalid_question" }, { status: 400 });

  const { data: room } = await db
    .from("rooms")
    .select("id")
    .eq("code", code.toUpperCase())
    .single();
  if (!room)
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });

  try {
    const ev = await evaluateQuestion(question);
    const { error } = await db.from("submissions").insert({
      room_id: room.id,
      nickname,
      question,
      level: ev.level,
      level_name: ev.level_name,
      coaching: ev.coaching,
      upgraded_question: ev.upgraded_question,
    });
    if (error) throw error;
    return NextResponse.json(ev); // 제출자 본인에게만 보이는 개인 피드백
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
