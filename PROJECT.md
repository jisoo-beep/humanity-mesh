# PROJECT.md — StoryTech Humanity Lab

Anonymous storytelling platform for North Korean defector youth. Students record stories (voice/text); the server anonymizes, encrypts, and stores them on IPFS. Only aggregate emotion stats are public; consented stories can become magazine articles.

**Core principle: anonymity first — store as little as possible.** Every new field must justify itself.

## Tech Stack
- Next.js 16 (App Router, Turbopack) — breaking changes vs. older Next; read `node_modules/next/dist/docs/` before using Next APIs (see `AGENTS.md`)
- TypeScript, Tailwind CSS 4, React 19, Recharts, lucide-react, framer-motion
- OpenAI `gpt-4o-mini` (server-only): anonymize, emotion analysis, writing coach, translation
- Supabase Postgres (schema `storytech`, shared project) via `@supabase/supabase-js` + service_role key (server-only)
- Pinata (public IPFS) for encrypted story bodies
- Deploy: AWS Amplify (serverless — **no filesystem writes at runtime**)

## Architecture Decisions
| Decision | Why |
|---|---|
| All DB access server-side with service_role; RLS on, no policies, anon/authenticated revoked | No Supabase Auth (custom access keys + admin token); anon key is public and shared across apps in the project |
| Anonymize inside `/api/stories/submit`, fail closed (no raw-text fallback) | Client-side anonymization was bypassable; a "safe default" could store raw text |
| Envelope encryption: per-story AES-256-GCM data key, wrapped by `STORY_ENCRYPTION_KEY`, wrapped key only in DB | Public IPFS can't delete; deleting the DB row makes the ciphertext permanently unreadable (crypto-shredding). Master key leak alone can't decrypt IPFS |
| Access keys stored as SHA-256 hash only; not linked to stories | Admin can see age/gender list but never who wrote what |
| No plaintext preview stored | Previews were a leak surface |
| Disclosure tiers: story (private) → magazine (publish consent + student's pen name) → student voice (quote from a published article only) | Wider exposure requires stricter conditions |
| `articles.highlight_quote` must be a substring of `content` (DB CHECK) | Voices must be verifiable quotes, not unsourced testimonials |
| Story → article only via `POST /api/admin/stories/[id]/article`: server checks consent, decrypts, sets body + pen name; `articles.source_story_id` (unique, cascade) + trigger blocks editing body/author | Students consented to their own words — admins pick issue/type/title only; deleting a story removes its article |
| No ages in pen names | Small cohort — pen name + age + story details can identify a student |
| Impact stats computed from tables (no stored counters) | Single source of truth |

## Story Submit Pipeline (`POST /api/stories/submit`)
1. Verify `X-Access-Key` header (hash lookup)
2. `anonymizeText()` — throws on empty result → 502, nothing stored
3. Emotion analysis (4 emotions summing to 100 + 5 keywords)
4. `encryptStory()` → upload `{ v: 2, iv, tag, data }` to IPFS
5. Insert `stories` row (cid, wrapped_key, emotions, keywords, input_type, publish_consent, pen_name)

## Database (`schema.sql`)
- `access_keys(key_hash PK, age, gender, created_at)`
- `stories(id uuid, cid unique, wrapped_key, emotions jsonb, keywords text[], input_type, publish_consent, pen_name ≤30 — requires consent, created_at)`
- `issues(id, issue_number unique, title, theme, editor_note, is_published, published_at, created_at)`
- `articles(id, issue_id FK cascade, type, title, content, author_name, display_order, views, highlight_quote, source_story_id unique FK → stories cascade, created_at)`
- Trigger `articles_protect_story_source` → `protect_story_articles()`: rejects changes to content/author_name/source_story_id on story-sourced articles (P0001)
- `increment_article_views(p_article_id)` — atomic view counter (service_role only)
- `schema.sql` resets the whole `storytech` schema; for a live DB use ALTER migrations instead
- Dummy data: 20 access keys (`storytech-dummy-N`, delete SQL in `schema.sql` comments), 47 dummy stories on IPFS (`storytech-dummy-story-01~47.json`) — all current `stories` rows are dummy

## Code Layout & Conventions
- `src/lib/db.ts` — shared domain types (camelCase)
- `src/lib/supabase.ts` — lazy server-only client (`server-only`), schema `storytech`
- `src/lib/repository.ts` — all queries; maps snake_case rows ↔ camelCase types; routes call only repository functions
- `src/lib/story-crypto.ts` — `encryptStory` / `decryptStory` (envelope)
- `src/lib/anonymize.ts` — server-only anonymization
- `src/lib/story-reader.ts` — fetch IPFS ciphertext + decrypt with wrapped key
- `src/lib/auth.ts` — admin HMAC token (`Authorization: Bearer`), `isAuthenticated(request)`
- `src/lib/i18n.tsx` — `en` typed as `typeof ko`; add every key to both languages
- Route errors: `catch (error)` + `(error as Error).message`; no `any`
- Update input whitelisting in repository (never `Object.assign` request bodies)

## Key API Routes
| Route | Auth | Purpose |
|---|---|---|
| `POST /api/payment` / `GET /api/payment?key=` | — | Issue access key / validate key |
| `POST /api/stories/submit` | access key | Submit story |
| `GET /api/stats` | — | Impact stats + voices |
| `GET /api/issues`, `/api/issues/latest`, `/api/issues/[id]` | — | Published magazine only |
| `PATCH /api/articles/[id]/view` | — | View count |
| `/api/admin/*` (issues, articles, stories, decrypt, users, stats, analytics) | admin token | Admin tools |
| `/api/ai/expand`, `/api/ai/translate` | — | Writing coach, translation |

## Environment
See `.env.example` (acquisition steps per key). Amplify injects vars into `.env.production` via `amplify.yml`.
`OPENAI_API_KEY`, `OPENAI_MODEL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `PINATA_JWT`, `PINATA_GATEWAY`, `STORY_ENCRYPTION_KEY` (never rotate — losing it loses all stories), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Known Limitations
- Admin analytics `uniqueVisitors` / `viewsByDate` / `userActivity` are mock values
- Anonymization is best-effort AI; raw text is sent to OpenAI (API data retention applies)
- Chrome Web Speech API sends audio to Google for transcription
- Magazine issues 3–12 contain AI-written sample articles

Roadmap and open items: `task.md`.
