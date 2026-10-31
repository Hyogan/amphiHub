# amphiHub backend (Supabase)

## What is here
| File | Purpose |
|---|---|
| migrations/0001 | Extensions, enums, helpers |
| migrations/0002 | Catalogue: universities, units, programs, courses, aliases, resource types |
| migrations/0003 | Profiles, roles, new-user trigger, is_moderator / is_admin |
| migrations/0004 | Resources, files, relations, saved, reports, suggestions, requests, audit, analytics |
| migrations/0005 | Access rules (Row Level Security) |
| migrations/0006 | moderate_resource, set_resource_verification, finalize_resource_file, search_resources, search_courses |
| migrations/0007 | Trigram search indexes |
| migrations/0008 | Private storage bucket and its rules |
| seed.sql | Two real universities plus PLACEHOLDER programs, courses and demo resources |
| tests/rls.sql | 58 access-rule and search checks. Local database only |

## Apply to your Supabase project
Option A, Supabase CLI:
```
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```
Option B, without the CLI: open the SQL editor in the dashboard and run 0001 to 0008 in order, one file at a time.

Then load `seed.sql` the same way (hosted projects do not run it automatically).

## Make yourself an admin
Sign up in the app first, then run this once in the SQL editor with your own e-mail:
```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict do nothing;
```
Use `'moderator'` for reviewers.

## Generate the TypeScript types
```
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts
```

## Run the tests (local only)
```
npx supabase start
npx supabase db reset            # applies migrations and seed.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
```
The script rolls back everything it creates. Never run it on production.

## Rules to remember
- The app never writes status, verification or roles. It calls functions, and the functions write the audit log.
- Guests read the catalogue and published resources. They cannot read files, storage paths or hashes.
- The phone's file hash is only a hint. A server-side check must confirm it before publishing is automated.
- Real catalogue data replaces the placeholders in seed.sql before the pilot.
