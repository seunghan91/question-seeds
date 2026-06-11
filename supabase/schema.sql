-- 질문씨앗 워크숍 라이브 모드 스키마 (Phase 3)
-- Supabase SQL Editor에서 실행
--
-- 보안 모델 (codex review 반영):
--   * 모든 쓰기와 호스트 작업은 서버 라우트(service role)를 통해서만 수행한다.
--     - 룸 생성: 서버가 생성 후 host_key를 응답으로 1회만 노출
--     - 질문 제출: 서버가 LLM 평가 후 insert (클라이언트가 level/coaching 위조 불가)
--     - reveal 토글: 서버가 host_key 검증 후 수행
--   * anon 클라이언트는 "공개(revealed=true)된 제출물 읽기"만 가능 — 참가자 공개 월 + Realtime 용도.
--   * rooms는 anon에게 일절 노출하지 않는다 (host_key 유출 방지). 코드→룸 해석도 서버 라우트가 담당.

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,            -- 6자리 입장 코드 (QR)
  title text not null default '',
  host_key uuid not null default gen_random_uuid(),  -- 호스트 비밀 토큰 (서버 전용)
  created_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  nickname text not null default '익명',
  question text not null,
  level int not null check (level between 1 and 5),
  level_name text not null default '',
  coaching text not null default '',
  upgraded_question text not null default '',
  revealed boolean not null default false,  -- 호스트가 보드에 공개했는지
  created_at timestamptz not null default now()
);

create index if not exists submissions_room_idx on submissions (room_id, created_at);

-- Realtime 발행 안 함 (codex review 반영): WAL 페이로드는 컬럼 단위 grant를
-- 우회해 전체 행(coaching 포함)을 노출할 수 있다. 현재 UI는 3초 폴링만 사용.
-- Realtime이 필요해지면 sanitized view 전용 publication으로 추가할 것.

alter table rooms enable row level security;
alter table submissions enable row level security;

-- rooms: anon 정책 없음 = 접근 불가 (host_key 보호). 서버는 service role로 우회.

-- submissions: anon은 "공개된 행"만 읽기 가능. 쓰기 정책 없음 = 서버 전용.
create policy "submissions read revealed only" on submissions
  for select using (revealed = true);

-- 컬럼 단위 차단: coaching/upgraded_question은 제출자 개인 피드백 —
-- 행이 공개(revealed)되더라도 anon에게 노출하지 않는다.
revoke select on submissions from anon, authenticated;
grant select (id, nickname, question, level, level_name, revealed, created_at)
  on submissions to anon, authenticated;

-- ── 피어 별점 (SMILE 스타일) ─────────────────────────────────────────
-- submitter_key: 제출자 식별용 (서버 전용). 위 grant 화이트리스트에 절대
-- 추가하지 않는다 — coaching과 동급 비공개. "자기 질문 평가 불가" 검증에 사용.
alter table submissions add column if not exists submitter_key uuid;

-- voter_key는 클라이언트 localStorage uuid — advisory 식별자다.
-- localStorage를 지우면 새 식별자를 만들 수 있으므로 암호학적 차단이 아니라
-- 데모 단계의 1차 가드: DB unique + 서버 자기평가 검증 + IP 레이트리밋 조합.
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  voter_key uuid not null,
  stars int not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  unique (submission_id, voter_key)
);
create index if not exists ratings_submission_idx on ratings (submission_id);
alter table ratings enable row level security;  -- 정책 없음 = anon 접근 불가
revoke all on ratings from anon, authenticated;

-- 집계 뷰 (service role 전용). definer-rights 뷰는 RLS를 우회하므로
-- 아래 revoke는 선택이 아니라 필수다.
create or replace view submission_rating_stats as
  select submission_id,
         count(*)::int as rating_count,
         round(avg(stars)::numeric, 2) as avg_stars
  from ratings
  group by submission_id;
revoke all on submission_rating_stats from anon, authenticated;
