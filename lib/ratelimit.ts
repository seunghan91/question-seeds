// 간단한 고정 윈도우 IP 레이트리미터.
// 주의: 서버리스에서는 인스턴스별 메모리라 완전하지 않음 — 데모 단계의 비용 가드.
// 프로덕션 전환 시 Upstash Ratelimit 등 외부 스토어 기반으로 교체할 것.

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  max: number = MAX_PER_WINDOW
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    // 윈도우 갱신 시 오래된 버킷 정리 (메모리 누수 방지)
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
    }
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= max) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { ok: true, retryAfterSec: 0 };
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : "") || "unknown";
}
