-- 질문씨앗 워크숍 라이브 모드 스키마 (Phase 3)
-- Supabase SQL Editor에서 실행

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,            -- 6자리 입장 코드 (QR)
  title text not null default '',
  host_key uuid not null default gen_random_uuid(),  -- 호스트 URL 토큰
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

-- Realtime 발행 (호스트 보드 실시간 갱신)
alter publication supabase_realtime add table submissions;

-- RLS: 데모 단계에서는 anon 읽기/쓰기 허용 (질문 텍스트 외 개인정보 없음)
alter table rooms enable row level security;
alter table submissions enable row level security;

create policy "rooms anon read" on rooms for select using (true);
create policy "rooms anon insert" on rooms for insert with check (true);
create policy "submissions anon read" on submissions for select using (true);
create policy "submissions anon insert" on submissions for insert with check (true);
-- revealed 토글은 서버 라우트(host_key 검증)를 통해서만 — service role 사용
