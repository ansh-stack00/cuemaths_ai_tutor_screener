create extension if not exists "pgcrypto";

create table if not exists sessions (
  id               uuid primary key default gen_random_uuid(),
  candidate_name   text not null,
  candidate_email  text not null,
  started_at       timestamptz default now(),
  completed_at     timestamptz,
  status           text default 'in_progress'
                   check (status in ('in_progress','completed','abandoned')),
  duration_seconds int,
  created_at       timestamptz default now()
);


create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  role        text not null check (role in ('interviewer','candidate')),
  content     text not null,
  created_at  timestamptz default now()
);

create index if not exists messages_session_idx
  on messages(session_id, created_at);


create table if not exists assessments (
  id                     uuid primary key default gen_random_uuid(),
  session_id             uuid not null references sessions(id) on delete cascade unique,
  rubric                 jsonb not null,
  overall_recommendation text check (overall_recommendation in ('Advance','Hold','Reject')),
  overall_score          numeric(3,1),
  created_at             timestamptz default now()
);

alter table sessions    enable row level security;
alter table messages    enable row level security;
alter table assessments enable row level security;


create policy "service role all on sessions"
  on sessions for all using (true) with check (true);

create policy "service role all on messages"
  on messages for all using (true) with check (true);

create policy "service role all on assessments"
  on assessments for all using (true) with check (true);


create or replace view session_summary as
  select
    s.id,
    s.candidate_name,
    s.candidate_email,
    s.status,
    s.started_at,
    s.completed_at,
    s.duration_seconds,
    a.overall_recommendation,
    a.overall_score,
    count(m.id) filter (where m.role = 'candidate') as candidate_turns
  from sessions s
  left join assessments a on a.session_id = s.id
  left join messages    m on m.session_id = s.id
  group by s.id, a.overall_recommendation, a.overall_score
  order by s.created_at desc;