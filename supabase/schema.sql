create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

revoke all on table public.app_state from anon, authenticated;
grant all on table public.app_state to service_role;

insert into public.app_state (id, data)
values (
  'main',
  '{
    "selectedClassId": "class-1",
    "classes": [
      {
        "id": "class-1",
        "name": "Clase 1",
        "activities": []
      }
    ],
    "students": [],
    "grades": {}
  }'::jsonb
)
on conflict (id) do nothing;
