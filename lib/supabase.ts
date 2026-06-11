import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 서버 전용 service-role 클라이언트. 브라우저에서 import 금지.
// 모든 DB 쓰기·host_key 검증은 이 클라이언트를 통해서만 수행한다 (RLS 우회).
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // 미설정 시 라우트가 503으로 응답
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return cached;
}

export function roomCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 혼동 문자(I/L/O/0/1) 제외
  let code = "";
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
