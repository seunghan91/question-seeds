import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, clientKey } from "@/lib/ratelimit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/rooms/[code]/wall — 참가자용 공개 질문 월.
// revealed=true 행만, 개인 피드백(coaching 등) 제외. 인증 없음(공개가 설계).
// x-voter-key 헤더가 있으면 내 별점(my_stars)을 함께 돌려준다.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // 교실은 NAT 뒤 공유 IP — 50명 × 5초 폴링(12/분) = 600/분까지 정상 사용.
  // LLM 호출 없는 저비용 조회라 캡을 교실 규모로 잡아도 비용 가드는 유지된다.
  const limit = rateLimit(`wall:${clientKey(req)}`, 600);
  if (!limit.ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const db = supabaseAdmin();
  if (!db)
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const { code } = await params;
  const { data: room } = await db
    .from("rooms")
    .select("id, title")
    .eq("code", code.toUpperCase())
    .single();
  if (!room)
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });

  const { data: rows } = await db
    .from("submissions")
    .select("id, nickname, question, level, level_name, created_at")
    .eq("room_id", room.id)
    .eq("revealed", true)
    .order("created_at", { ascending: true });

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

  const voterKey = req.headers.get("x-voter-key");
  const mine = new Map<string, number>();
  if (ids.length > 0 && voterKey && UUID_RE.test(voterKey)) {
    const { data: myRows } = await db
      .from("ratings")
      .select("submission_id, stars")
      .eq("voter_key", voterKey)
      .in("submission_id", ids);
    for (const m of myRows ?? []) mine.set(m.submission_id, m.stars);
  }

  return NextResponse.json({
    title: room.title,
    submissions: (rows ?? []).map((r) => ({
      ...r,
      avg_stars: stats.get(r.id)?.avg_stars ?? null,
      rating_count: stats.get(r.id)?.rating_count ?? 0,
      my_stars: mine.get(r.id) ?? null,
    })),
  });
}
