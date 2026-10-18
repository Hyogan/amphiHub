# AmphiHub – MVP Planning Document

Version 0.1 · Draft for validation · Android first · Expo SDK 57 + Supabase

## 1. Purpose and how to read this

This document turns the PRD into an executable MVP plan. The PRD is a **reference, not a contract**: where Postgres, Supabase or an MVP timeline suggest something simpler, this plan simplifies and says so (see the deviations register in section 10). The Mobile App Blueprint is also a reference. It has been checked against Expo SDK 57 and adapted where the platform moved.

The guiding principle from the PRD stays untouched: **solve one high-frequency problem exceptionally well, helping a student find a relevant past paper in under a minute.** Everything else waits.

## 2. Decisions already made

| Area | Decision | Note |
| --- | --- | --- |
| Runtime | Expo SDK 57 (React Native 0.86, React 19.2), TypeScript strict, React Compiler on | Project at C:\\dev\\amphiHub, router root is src/app |
| Run mode | **Expo Go for now** | A development build is planned for the hardening milestone (in-app PDF viewer, crash reporting) |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions | Schema and RLS live in git as migrations |
| Server state | TanStack Query | Never mirrored in Redux |
| Client state | **Redux Toolkit** | Only session, dialog, toast, gate |
| Forms | React Hook Form + Zod schema factories | Written to be React Compiler friendly |
| Styling | Plain StyleSheet + theme tokens, no Tailwind/NativeWind | createStyles(colors) pattern |
| Local storage | expo-sqlite (Supabase session via its localStorage polyfill, downloads manifest) | No MMKV, which needs a dev build |
| i18n | i18next, French default, English second | Namespaced per domain |
| Bottom sheets | **Recommendation:** @gorhom/bottom-sheet + @gorhom/portal, validated by a day-one spike | Fallback: a hand-built Modal sheet. Hand-built components elsewhere; no UI kit |
| Auth | **Recommendation:** email + password | Phone OTP needs an SMS provider and has a recurring cost. Revisit after the pilot |
| Platform | Android first, code kept iOS-compatible |  |

Why hand-built plus gorhom for sheets: the MVP has few sheets (filters, resource actions, report), so the risk is small. A first-party native alternative is not yet worth the learning cost. The spike must confirm gorhom works with React Native 0.86 and Reanimated 4 in Expo Go, including the Android keyboard. If it fails, the Modal fallback ships instead.

## 3. MVP scope

### 3.1 In scope (P0)

1. Email sign-up and sign-in, password reset, academic profile (university, program, level, semester), profile editable later (FR-001, FR-002).
2. Guest browsing of the catalogue and search with no account (FR-003).
3. Hierarchical browse: University → Unit → Program → Level/Semester → Course (FR-004, FR-005).
4. Resource types: exam paper, correction, TD, TP, lecture notes, other (FR-006).
5. Search with filters, ranking and a useful empty state with a "request this resource" action (FR-007 to FR-010).
6. Resource detail with provenance and verification labels (FR-011, FR-024).
7. Download, offline access to downloaded files, saved library (FR-013, FR-014, FR-029, FR-030).
8. PDF viewing through an external app in Expo Go (see 5.6).
9. Submit a resource with required metadata, see its status, suggest a missing course (FR-016 to FR-018).
10. Reports and a moderator review queue, duplicate flagging, audit log (FR-019 to FR-023).
11. Analytics events and failure logging (PRD section 10).
12. French and English UI.

### 3.2 Simplified compared with the PRD

- **Academic structure:** no ProgramStructure/AcademicLevel/Semester chain. Level and semester are plain values on the program-to-course link, with an optional curriculum label for future versioning.
- **Editing published resources:** not allowed in the MVP. A contributor submits a replacement that references the old one (relation type "supersedes"). This delivers the PRD's versioning intent without a revision engine.
- **Draft status:** kept on the client. The server starts at "submitted".
- **Duplicate detection:** file hash only. Metadata and content similarity come later.
- **Admin tooling:** catalogue management through Supabase Studio and SQL seeds. Only the moderation queue is in the app, role-gated.
- **Analytics:** a Supabase table, no third-party SDK.

### 3.3 Deferred

AI-assisted quizzes (FR-025 to FR-028), share links (FR-015), full offline sync with conflict handling (FR-031), campus ambassador tools, institutional accounts, a web client, push notifications, monetisation, leaderboards. The data model leaves room for quizzes and sharing, but no tables are built for them yet.

## 4. Backend design (Supabase)

### 4.1 Principles

- RLS is the real authority. The client only hides what a role should not see.
- Clients never write status, verification or role columns directly. Those change through RPC functions that also write the audit log.
- Stable UUID identifiers everywhere. No names as keys.
- Academic identity, document access and account authorisation stay separate concepts.
- No assumption that course codes or level names are globally unique; uniqueness is per university.

### 4.2 Tables

| Table | Key columns | Notes |
| --- | --- | --- |
| universities | id, name, short\_name, country\_code (default CM), primary\_language, status |  |
| academic\_units | id, university\_id, parent\_id (nullable), name, unit\_type, status | Faculty, school, institute, department. Self-referencing tree |
| programs | id, university\_id, unit\_id, name, code, degree\_type, status |  |
| courses | id, university\_id, name, code (nullable), status | Unique (university\_id, code) when code is set |
| program\_courses | id, program\_id, course\_id, level, semester (nullable), curriculum\_label (nullable) | A course can belong to many programs |
| course\_aliases | id, course\_id, alias, language | Abbreviations and alternative names. Key for search |
| resource\_types | code, label\_fr, label\_en, sort | Lookup table so categories are configurable without migrations |
| profiles | id (= auth user id), display\_name, preferred\_language, university\_id, program\_id, level, semester | Created by a trigger on sign-up |
| user\_roles | user\_id, role (student, moderator, admin), university\_id (nullable) | Written only by admins or service role |
| resources | id, university\_id, course\_id, type\_code, title, description, academic\_year, year\_unknown, exam\_session, language, status, source\_type, source\_note, source\_status, metadata\_reviewed, correction\_reviewed, ai\_assisted, rights\_declared, uploader\_id, duplicate\_of, published\_at, created\_at, updated\_at, search\_vector | One current file per resource in the MVP |
| resource\_files | id, resource\_id, storage\_path, mime\_type, size\_bytes, sha256, page\_count, processing\_status, is\_current | Kept separate from metadata, as in the PRD |
| resource\_relations | id, resource\_id, related\_id, relation\_type | correction\_of, supersedes, duplicate\_of |
| saved\_resources | user\_id, resource\_id, created\_at |  |
| reports | id, resource\_id, reporter\_id, reason, details, status, resolution, created\_at, resolved\_at |  |
| catalog\_suggestions | id, user\_id, kind, payload (jsonb), status, created\_at | Missing course or program proposals (FR-017) |
| resource\_requests | id, user\_id, university\_id, course\_id (nullable), query, created\_at | "I could not find this" signal for coverage planning |
| audit\_log | id, actor\_id, action, entity, entity\_id, before, after, created\_at | Append-only |
| analytics\_events | id, user\_id (nullable), name, props (jsonb), app\_version, created\_at | Insert-only for clients |

### 4.3 Status and verification model

Publication status: submitted → in\_review → published, or rejected; a published resource can become restricted or removed. Restricted and removed resources lose file access immediately through storage policy.

Verification is **separate attributes, never a single status**, exactly as the PRD requires:

- source\_type: community\_upload, official\_source, other.
- source\_status: unverified, confirmed, official\_confirmed (official needs evidence recorded in the audit trail).
- metadata\_reviewed: boolean.
- correction\_reviewed: boolean, meaningful only for corrections.
- ai\_assisted: boolean, reserved for the later quiz feature.

The UI must show each label with text and an icon, never colour alone, and must never imply that a moderated file is academically correct.

### 4.4 Row Level Security (summary)

| Data | Read | Write |
| --- | --- | --- |
| Catalogue tables, resource\_types | Everyone for active rows | Admin only |
| profiles | Own row | Own row (non-privileged columns) |
| user\_roles | Own rows | Nobody from the client |
| resources | Published for everyone; own submissions; all for moderators | Insert own with status submitted only. Status and verification changes through moderate\_resource RPC |
| resource\_files | Follows the parent resource | Insert by the uploader at submission |
| saved\_resources | Own rows | Own rows |
| reports | Own; moderators see all | Insert by signed-in users |
| audit\_log | Moderators and admins | Written by security-definer functions only |
| analytics\_events | None from the client | Insert by anon and authenticated, with constrained columns |

Helper functions is\_moderator() and is\_admin() are security-definer with a fixed search\_path. Every table gets RLS enabled in the same migration that creates it. A two-user test script checks that user A cannot read, edit or delete user B's data and that anon cannot read restricted resources.

### 4.5 Storage

One private bucket, "resources", PDF only, with a file-size limit (proposal: 25 MB). Path: university\_id/resource\_id/file\_id.pdf. Uploaders can insert and read their own pending files. Everyone can read files belonging to published resources, enforced by a storage policy that joins resource\_files to resources. Downloads use short-lived signed URLs. Local copies cannot be revoked after removal, which the terms must state.

After upload, the client calls a finalize function (Edge Function) that checks the file exists, checks the PDF signature bytes, records the authoritative SHA-256 and page count when feasible, and flags a duplicate if the hash matches a non-rejected resource. Similar files are never auto-merged.

### 4.6 Search

Postgres full-text search with unaccent, plus pg\_trgm for typo tolerance over course names, aliases and codes. One RPC, search\_resources, takes the query and the filters (university, program, level, semester, type, academic year, has correction) with pagination. Ranking follows the PRD order: exact course code or name, selected university/program, type match, academic year and session, quality (confirmed source, reviewed metadata), then a small engagement signal. Popularity never outranks relevance or verification. French accents and abbreviations ("TD", "UE", course shorthand) are handled through aliases and unaccent. A search with no useful results writes a search\_no\_results event.

### 4.7 Operational notes

Supabase CLI migrations in supabase/migrations, generated TypeScript types committed, a seed script for the founding universities and priority courses, and separate dev and prod projects. Free-tier limits (inactivity pausing, storage, egress) will matter once PDFs accumulate, so plan the paid tier before the pilot.

## 5. App architecture

### 5.1 Structure

Feature-first under src, with src/app as the thin router layer. Layout follows the Blueprint: constants, core (providers, dialog), features/\<feature> (screens, components, sheets, hooks, types, schemas, dialogs, utils), i18n, navigation config, services (supabase client, api modules, storage, downloads), shared (components, hooks, toast), store, theme. Aliases through tsconfig paths only.

Features: auth, onboarding, catalog, search, resources, library, contribute, moderation, profile.

### 5.2 Layering rules that carry over

- Screen → hook → api module → Supabase client. Screens never call Supabase.
- Raw (snake\_case rows, generated types) → explicit mappers → domain (camelCase) types, applied in hooks.
- Api modules are raw in, raw out and throw on Supabase errors. Postgres error codes (for example unique violation) are mapped to form fields in one helper that replaces the old 422 mapping.
- Every colour and spacing value from the theme; every string through i18n.
- Confirmations through the dialog registry. One DialogBase.
- Destructive actions confirm first; the UI never offers what the backend forbids.

### 5.3 Changes made for SDK 57

- Navigation imports come from expo-router entry points only; no @react-navigation packages.
- With React Compiler on, manual useCallback/useMemo are dropped. Forms use useWatch and Controller instead of watch().
- Supabase session persisted through expo-sqlite's localStorage polyfill, per current Expo and Supabase guidance. No SecureStore encryption wrapper.
- Worklets/Reanimated plugin handled by babel-preset-expo. No custom babel config unless needed.
- i18next compatibility flag from the Blueprint is dropped if the install confirms it is obsolete.

### 5.4 State ownership

Server data lives in the query cache. Redux holds session, dialog (active key plus plain params), toast and gate. Form state lives in React Hook Form. UI-only state is local. The Supabase client owns the auth token; Redux only mirrors session identity and role through onAuthStateChange. The redirect effect lives in the root layout and reacts to session and onboarding state.

### 5.5 Routes and screens

- (onboarding): language, value intro, academic profile.
- (auth): sign in, sign up, reset password.
- (tabs): Home (shortcuts, recent, my program), Search, Library (saved and downloaded), Contribute, Profile.
- Stack routes: university and program drill-down, course detail (resources grouped by type, papers paired with corrections), resource detail, submit flow, submission status list, report sheet, moderation queue and review screen (moderator group only).
- Course detail is the key screen: a course's papers by year with correction availability visible at a glance.

Guests can reach everything except Library sync, Contribute, and downloads (see open decisions).

### 5.6 Downloads, offline and PDF viewing

Downloads use the file system API with a manifest table in expo-sqlite (resource id, local path, size, checksum, downloaded time). Size is shown before download, no automatic downloads, progress and failure states are visible. The library marks each item as available offline or online-only (FR-030). Saved resources sync to the server table when online; a failed sync never deletes anything.

**Honest limitation:** because we stay in Expo Go, there is no native in-app PDF viewer. The MVP opens the downloaded file in the device's PDF app, with a shared-file fallback. This weakens FR-012 (in-app preview) and is accepted for now. A development build with an in-app viewer is scheduled for milestone M6.

### 5.7 Theme and UI

The Blueprint token contract (brand, background, text, border, status with soft tints, interactive, icon, overlay) in light and dark. Brand values are pending the product name and palette. Placeholders are used until then. Verification labels use status tokens plus icon plus text. Every list has skeleton, empty and error states, and the empty search state offers alternatives and a request action.

### 5.8 Internationalisation

French default, English second, device language detected, account preference wins after sign-in. Namespaces: common, auth, onboarding, catalog, search, resources, library, contribute, moderation, profile, dialogs, gates. Both languages are added in the same change as any new key. Uploaded documents keep their original language.

## 6. Delivery plan

The PRD's six-week validation plan is a schedule for learning, not a promise of a finished app. These milestones are ordered by dependency and sized by slice. Dates are set once team capacity is known.

| Milestone | Content | Exit criteria |
| --- | --- | --- |
| M0 Foundations | Providers, Redux store (session, dialog, toast, gate), theme, i18n, Supabase client, root redirect effect, minimal shared components, scripts for typecheck, lint, export. **Spike:** gorhom sheet and Android keyboard in Expo Go | App boots, theme and language switch work, spike verdict recorded |
| M1 Backend base | Migrations for catalogue, profiles, roles, resource tables, RLS, storage policies, generated types, seed for founding universities | RLS two-user test passes, seed loads, types generated |
| M2 Auth and profile | Sign up, sign in, reset, onboarding, academic profile edit, guest mode | A new user reaches Home with a profile; a guest can browse |
| M3 Discovery (core) | Drill-down browse, course detail, search RPC and UI, filters, resource detail, labels, empty state with request | Core search task usable end to end on seeded data |
| M4 Library and offline | Downloads with manifest, saved resources, offline states, external PDF open | A downloaded paper opens in airplane mode |
| M5 Contribution and moderation | Submit flow, finalize function, duplicate flag, status list, reports, moderator queue, audit log, missing-course suggestions | A submission goes from submitted to published and is visible with correct labels |
| M6 Hardening and pilot | Analytics events, failure logging, accessibility pass, QA matrix, dev build decision (in-app PDF), Android APK for the invited pilot, pilot data load | Definition of done (section 7) passes |

Post-MVP candidates: AI quizzes (Edge Function with provenance fields), share links, richer sync, web client, institutional accounts.

## 7. Quality and definition of done

A slice is done only when: tsc --noEmit is clean; a real bundle succeeds (expo export for Android); ESLint is clean; loading, empty, error, success and validation states exist; both languages render without raw keys; mutations invalidate the right query keys and give feedback; and assumptions and known gaps are written down. The checks must be actually run, never claimed.

Tests are written for the logic that can hurt: mappers, dialog builders, redirect logic, form schemas, role gates, and, on the database side, RLS and search RPC tests. A device pass covers sheets with the keyboard, downloads on a weak connection, offline mode and dark mode.

Pilot readiness (from the PRD): browse, search, open, download, offline access, save, submit, moderate, accurate labels, no unauthorised access to restricted files, observable failures, and enough useful papers in the chosen priority courses.

## 8. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Not enough content at launch | Collect and review papers for priority courses before opening the pilot; use the request signal to steer |
| Copyright disputes | Contributor declaration, takedown channel, restrict-while-assessed, legal review before public launch |
| No in-app PDF preview in Expo Go | External viewer in the MVP; dev build in M6 |
| RLS mistakes expose data | RLS enabled with every table, two-user tests, no client writes to status columns |
| Poor French search quality | unaccent, aliases, trigram matching, failed-search analytics |
| Moderation workload | Required metadata, hash duplicate flag, small queue UI, human review only for judgment calls |
| Low-end devices and storage | Size shown before download, user-controlled deletion, no auto-downloads |
| Sheet library incompatibility | Day-one spike, Modal fallback |
| Free-tier limits | Budget the paid tier before the pilot |

## 9. Open decisions

1. **Product name and palette.** Needed for the theme tokens.
2. **Founding universities and priority programs and courses.** Drives the seed data and the pilot's success measure.
3. **Authentication.** Email and password recommended; phone OTP deferred.
4. **Guest downloads.** Proposed: guests browse and search, but downloading needs an account (abuse control and analytics).
5. **Moderation tooling.** Proposed: in-app queue for the MVP, a small web admin later.
6. **Rights policy and terms.** Wording of the contributor declaration and the takedown process.
7. **Maximum file size and accepted formats.** Proposed: PDF only, 25 MB.
8. **Dev build timing.** Proposed: M6, or earlier if the external PDF viewer proves too painful in testing.
9. **Sheet library.** Confirm after the spike.

## 10. Deviations register

**From the PRD:** simplified academic structure; no draft status server-side; no in-place editing of published resources; hash-only duplicate detection; admin catalogue through Supabase Studio; AI quizzes deferred; analytics in the database; external PDF viewing until a dev build.

**From the Blueprint:** Supabase client and RLS replace axios, interceptors and 422 mapping; the Postgres error map replaces server validation mapping; expo-sqlite replaces MMKV and SecureStore for local storage; React Compiler removes manual memoisation; Expo Router imports only; Redux kept at four slices as specified.

Every further deviation is flagged before it is made.
