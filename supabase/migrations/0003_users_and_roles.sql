-- Profiles, roles, and the helper functions the access rules use.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_language text not null default 'fr' check (preferred_language in ('fr', 'en')),
  university_id uuid references public.universities (id) on delete set null,
  program_id uuid references public.programs (id) on delete set null,
  level text,
  semester smallint check (semester between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Roles are written only by an admin or the service role, never from the app.
create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  university_id uuid references public.universities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create function public.is_moderator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('moderator', 'admin')
  )
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  )
$$;

-- Every new account gets a profile and the student role.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
