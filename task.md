# Task List

## Content & i18n
- [x] Remove `contact@storytech.org` Contact block from footer (and unused `footer.contact` keys)
- [x] AI Writing Lab: keep `correction` always in Korean, explanations follow selected language
- [x] Fix site copy that claimed "AI re-processes text in real time during admin decryption" (not implemented) — mission, security steps, submit description (ko/en)
- [x] Remove ages from pen names (`별빛 (17세)` → `별빛`) in articles, testimonials, and admin placeholder
- [x] Rewrite 30 templated dummy articles (issues 3–12) with unique, theme-specific content and editor notes
- [x] Fix issue dates (issue 12 dated before issue 1, issues 10–11 in the future)

## Privacy & Security
- [x] Move anonymization into `/api/stories/submit` as a mandatory server-side step (`src/lib/anonymize.ts`)
- [x] Fail closed: no fallback to raw text when anonymization returns empty; do not store on failure
- [x] Delete public `/api/ai/anonymize` route (bypass path + open OpenAI proxy)
- [x] Delete public `/api/stories` route and unused `StoryArchive` component (exposed story previews)
- [x] Require a valid access key (`X-Access-Key` header) for story submission
- [x] Envelope encryption: per-story data key, wrapped by `STORY_ENCRYPTION_KEY`, stored only in DB (deleting the DB row makes the IPFS ciphertext permanently unreadable)
- [x] Generate access keys with `crypto.randomInt` instead of `Math.random`
- [x] Public issue-by-id API returns published issues only
- [x] Stop storing plaintext story previews

## Database (Supabase, `storytech` schema)
- [x] `schema.sql`: `access_keys`, `stories`, `issues`, `articles`, `increment_article_views()`; RLS on, no policies, service_role only
- [x] Seed magazine data (12 issues, 36 articles) into `schema.sql`
- [x] Data layer: `src/lib/supabase.ts` (server-only client) + `src/lib/repository.ts` (replaces `mockData.ts`)
- [x] Migrate all routes (keys, stories, magazine, views, stats, analytics, admin users) from `db.json` to Supabase
- [x] Impact stats aggregated from tables (students = issued keys, stories, emotion sums)
- [x] Delete `data/db.json`, `src/lib/mockData.ts`, `/api/upload`, `uploadFileToIPFS`, image fields
- [x] Validate `schema.sql` and migrations on embedded Postgres (PGlite)
- [x] Run `schema.sql` on Supabase and expose `storytech` schema
- [x] Run `highlight_quote` migration on Supabase

## Features
- [x] Submit form: magazine publish consent checkbox + optional pen name (with "no real name or age" warning)
- [x] Admin stories: keywords, consent badge/filter, pen name display
- [x] Admin stories: "기사로 옮기기" (move consented story to a magazine article, author fixed to student's pen name)
- [x] Student Voices: admin picks a sentence from a published article (`articles.highlight_quote`); DB rejects quotes not in the article body; editing the body clears a quote that no longer exists
- [x] Seed 5 initial voices from existing article sentences
- [x] Story-sourced articles are immutable: server-side move endpoint (consent check, body + pen name from the story), `articles.source_story_id` (one article per story, cascade on story delete), DB trigger blocks body/author edits; UI locks those fields
- [x] Run `source_story_id` migration on Supabase (verified on live DB: move 201, duplicate 409, no consent 403, body/author edit 400, title edit 200)
- [x] Student Voices picker: select whole sentences from the article body (no free text); interview `Q:` lines excluded, `A:` labels stripped
- [x] Consent copy covers both magazine publishing and quoting in Student Voices
- [x] Duplicate issue numbers: next number prefilled, inline warning, 409 from API
- [x] Decision: Student Voices stay magazine-quote-only (no free-text admin input) — revisit if offline testimonials are needed (would require a `voices` table with a mandatory source field)

## Dummy Data (one-time)
- [x] 20 dummy access keys (`storytech-dummy-N` hashes, not usable for login)
- [x] 47 dummy stories uploaded to public IPFS via the real pipeline (`storytech-dummy-story-01~47.json`)

## Config & Docs
- [x] `.env.example` with step-by-step acquisition guide for every variable; `.gitignore` exception
- [x] `amplify.yml`: inject `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] README: storage, submit pipeline, encryption, env, stack sections updated
- [x] Project retrospective (plain-text, for admissions/interview)

## To Do
- [ ] Register `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in Amplify Console and redeploy
- [ ] Commit and push current changes
- [ ] Browser end-to-end check: issue key → login → submit (with consent) → admin decrypt → move to article → set voice
- [ ] Remove obsolete scripts that reference the deleted `db.json` (`add_dummy.js`, `fix_dummy.js`, `tmp/migrate_db.js`)
- [ ] Remove unused mock route `/api/articles` and unused `/api/ai/analyze`
- [ ] Replace mock analytics numbers (`uniqueVisitors`, `viewsByDate`, `userActivity`) or label them as samples
- [ ] Remove unused chart code in `Impact.tsx` and `DUMMY_STATS` fallback numbers
- [ ] Fix pre-existing lint errors (`any` in AI/login routes and `StorySubmit`, setState-in-effect in admin content page)
- [ ] Mark AI-written magazine articles as sample content, or replace with real student writing before real use
- [ ] Before launch: delete dummy data — keys via the delete SQL in `schema.sql` comments; stories via `DELETE FROM storytech.stories` if no real stories exist yet (all 47 current rows are dummy) — then optionally unpin `storytech-dummy-story-*` in Pinata (DB first, files after)
- [ ] Check Pinata plan limits as real stories accumulate
