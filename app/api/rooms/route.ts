import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, roomCode } from "@/lib/supabase";
import { rateLimit, clientKey } from "@/lib/ratelimit";

// POST /api/rooms — 룸 생성. host_key는 이 응답에서 단 한 번만 노출된다.
export async function POST(req: NextRequest) {
  const limit = rateLimit(`rooms:${clientKey(req)}`);
  if (!limit.ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const db = supabaseAdmin();
  if (!db)
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  let title = "";
  try {
    const body = await req.json();
    title = String(body.title ?? "").slice(0, 80);
  } catch {
    /* title 없이도 생성 허용 */
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = roomCode();
    const { data, error } = await db
      .from("rooms")
      .insert({ code, title })
      .select("code, host_key")
      .single();
    if (!error && data)
      return NextResponse.json({ code: data.code, host_key: data.host_key });
    if (error && !error.message.includes("duplicate")) {
      console.error("room create failed:", error);
      return NextResponse.json({ error: "create_failed" }, { status: 502 });
    }
  }
  return NextResponse.json({ error: "code_collision" }, { status: 502 });
}
