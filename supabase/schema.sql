-- ============================================================================
-- Обществознание ОГЭ — база данных для Supabase
-- Выполнить один раз: Supabase → SQL Editor → New query → вставить весь файл → Run
-- ============================================================================

-- 1. Таблицы -----------------------------------------------------------------

-- Профиль каждого пользователя (создаётся автоматически при регистрации)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default 'Ученик',
  role text not null default 'student' check (role in ('student', 'teacher')),
  notifications_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Весь прогресс ученика одним JSON: темы, карточки, попытки, цели, пробники
create table if not exists public.student_states (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- Каждое решённое задание — отсюда уведомления учителю
create table if not exists public.task_events (
  id bigint generated always as identity primary key,
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  student_name text not null,
  task_id text not null,
  module_id text not null,
  format text not null check (format in ('test', 'written')),
  kind text,
  slot_title text,
  score int not null,
  max_score int not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists task_events_created_at_idx on public.task_events (created_at desc);
create index if not exists task_events_student_idx on public.task_events (student_id, created_at desc);

-- Секретные настройки (код учителя). Клиенты сайта эту таблицу не видят.
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

-- >>> ЗАМЕНИТЕ «придумайте-код» на свой секретный код учителя <<<
insert into public.app_settings (key, value)
values ('teacher_code', 'придумайте-код')
on conflict (key) do update set value = excluded.value;

-- 2. Кто учитель ---------------------------------------------------------------

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

-- 3. Регистрация: проверка кода учителя и создание профиля --------------------

-- До записи пользователя: проверяем код и убираем его из данных аккаунта
create or replace function public.check_teacher_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := coalesce(meta ->> 'role', 'student');
  real_code text;
  final_role text := 'student';
begin
  if wanted = 'teacher' then
    select value into real_code from public.app_settings where key = 'teacher_code';
    if real_code is null or coalesce(meta ->> 'teacher_code', '') <> real_code then
      raise exception 'Неверный код учителя';
    end if;
    final_role := 'teacher';
  end if;
  new.raw_user_meta_data := jsonb_set(meta - 'teacher_code', '{role}', to_jsonb(final_role));
  return new;
end;
$$;

-- После записи пользователя: создаём профиль
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Ученик'),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists before_auth_user_created on auth.users;
create trigger before_auth_user_created
  before insert on auth.users
  for each row execute function public.check_teacher_code();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Права доступа (Row Level Security) ---------------------------------------

alter table public.profiles enable row level security;
alter table public.student_states enable row level security;
alter table public.task_events enable row level security;
alter table public.app_settings enable row level security; -- политик нет = никому не видно

-- Профили: свой видит каждый, учитель видит всех
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_teacher());

-- Менять можно только свой профиль и только имя / время прочтения уведомлений (роль — нельзя)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (name, notifications_seen_at) on public.profiles to authenticated;

-- Прогресс: ученик читает и пишет свой, учитель читает всех
drop policy if exists "states_select" on public.student_states;
create policy "states_select" on public.student_states
  for select using (user_id = auth.uid() or public.is_teacher());

drop policy if exists "states_insert_own" on public.student_states;
create policy "states_insert_own" on public.student_states
  for insert with check (user_id = auth.uid());

drop policy if exists "states_update_own" on public.student_states;
create policy "states_update_own" on public.student_states
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- События решений: ученик добавляет свои, учитель читает все
drop policy if exists "events_select" on public.task_events;
create policy "events_select" on public.task_events
  for select using (student_id = auth.uid() or public.is_teacher());

drop policy if exists "events_insert_own" on public.task_events;
create policy "events_insert_own" on public.task_events
  for insert with check (student_id = auth.uid());

-- Готово!
