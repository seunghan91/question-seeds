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
