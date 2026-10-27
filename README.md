# Humanity Mesh — Project Documentation

> A platform where North Korean defector youth can safely share their stories and improve their writing skills with AI-powered tools

---

## 📁 Project Structure

```
story-tech/
├── schema.sql                     # Supabase DDL + seed data (storytech schema)
├── .env.example                   # Environment variable template (with issuance instructions)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Main homepage
│   │   ├── layout.tsx             # Root layout (injects I18nProvider)
│   │   ├── providers.tsx          # Client providers
│   │   ├── submit/                # /submit route (anonymous story submission page)
│   │   ├── admin/                 # Admin area (sidebar layout)
│   │   │   ├── layout.tsx         # Shared AdminShell layout
│   │   │   ├── page.tsx           # /admin — Dashboard
│   │   │   ├── login/             # /admin/login — Login
│   │   │   ├── content/           # /admin/content — Content management
│   │   │   ├── stories/           # /admin/stories — Story management
│   │   │   └── analytics/         # /admin/analytics — Analytics dashboard
│   │   └── api/                   # Next.js API Routes (server-only)
│   │       ├── admin/
│   │       │   ├── login/         # POST — Admin login
│   │       │   ├── stats/         # GET — Dashboard statistics
│   │       │   ├── issues/        # GET/POST — Issue CRUD
│   │       │   │   └── [id]/publish/  # POST — Publish issue
│   │       │   ├── articles/      # POST — Create article
│   │       │   │   └── [id]/      # PUT/DELETE — Update/delete article
│   │       │   ├── stories/       # GET — Story list
│   │       │   │   └── [id]/decrypt/ # POST — Decrypt story
│   │       │   └── analytics/     # GET — Analytics data
│   │       ├── ai/
│   │       │   ├── analyze/       # POST — Writing analysis (AI)
│   │       │   ├── expand/        # POST — Sentence expansion suggestions (AI)
│   │       │   └── translate/     # POST — Text translation (AI)
│   │       ├── issues/            # GET — Public issues
│   │       ├── articles/          # GET — Articles + view counting
│   │       ├── stories/submit/    # POST — Story submission (access key required; anonymize → encrypt → IPFS)
│   │       ├── payment/           # POST issue access key / GET verify access key
│   │       └── stats/             # GET — Public impact statistics
│   ├── components/
│   │   ├── Navigation.tsx         # Top navigation (includes language toggle)
│   │   ├── Hero.tsx               # Hero section
│   │   ├── About.tsx              # About section (mission/vision/background)
│   │   ├── Magazine.tsx           # Magazine section (published issues)
│   │   ├── AILab.tsx              # AI Writing Lab component
│   │   ├── AITranslatedText.tsx   # Real-time AI-translated text component
│   │   ├── StorySubmit.tsx        # Anonymous story submission form
│   │   ├── Impact.tsx             # Impact metrics section
│   │   ├── Footer.tsx             # Footer
│   │   └── AdminShell.tsx         # Shared admin layout (sidebar)
│   └── lib/
│       ├── db.ts                  # Shared domain types (Issue, Article, Story …)
│       ├── supabase.ts            # Server-only Supabase client (service_role)
│       ├── repository.ts          # DB query/save functions (snake_case rows ↔ camelCase types)
│       ├── anonymize.ts           # AI anonymization (throws on failure — blocks storing raw text)
│       ├── i18n.tsx               # Multilingual (KO/EN) Context Provider
│       ├── auth.ts                # Admin token authentication utilities
│       ├── pinata.ts              # Pinata IPFS SDK wrapper
│       └── story-crypto.ts        # AES-256-GCM envelope encryption/decryption
```

---

## 🗄️ Data Model (Supabase `storytech` schema)

See `schema.sql` for the full DDL and seed data. All tables have RLS enabled with no policies → accessible only via the server's service_role key.

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `access_keys` | `key_hash`, `age`, `gender`, `created_at` | The raw key is never stored — only its SHA-256 hash |
| `stories` | `cid`, `wrapped_key`, `emotions`, `keywords`, `input_type`, `publish_consent`, `pen_name` | The story body exists only as ciphertext on IPFS |
| `issues` | `issue_number`, `title`, `theme`, `editor_note`, `is_published`, `published_at` | Magazine issues |
| `articles` | `issue_id`, `type`, `title`, `content`, `author_name`, `display_order`, `views`, `highlight_quote` | Views incremented atomically via the `increment_article_views()` function |

- Impact statistics (total stories, emotion distribution, participating students) are aggregated from the tables, not stored separately
- "Student Voices" in the Impact section come from published articles' `highlight_quote` (selected by an admin from the article body in `/admin/content`; the DB rejects sentences not found in the body)

---

## ⚙️ Core Feature Logic

### 1. Internationalization (i18n)

**File**: `src/lib/i18n.tsx`

- `ko` / `en` language objects defined statically
- `I18nProvider` injects them across the app via React Context
- `useI18n()` hook gives access to `{ t, lang, setLang }` anywhere
- `AITranslatedText` component: in English mode, translates Korean text stored in the DB in real time via the AI API (`/api/ai/translate`) and renders it

```
Language change → setLang('en') → t swaps to en object → UI updates instantly
DB text (Korean) → AITranslatedText → /api/ai/translate → rendered in English
```

---

### 2. Story Submission Pipeline

**File**: `src/components/StorySubmit.tsx`

Everything from user input to IPFS storage is handled within a single server request (`/api/stories/submit`). The request requires an `X-Access-Key` header (the issued access key).

```
[User input] (voice or text) + magazine publication consent / pen name (optional)
       ↓
[1] Verify access key
[2] AI anonymization (src/lib/anonymize.ts)
  - Replaces names, places, dates, affiliations with [NAME] [PLACE] [TIME] [AFFILIATION]; removes contact info
  - On failure, aborts without saving (blocks any path that stores the raw text)
[3] Emotion analysis — ratios of 4 core emotions + 5 keywords
[4] Envelope encryption → IPFS upload (ciphertext only)
[5] DB save — CID, wrapped data key, emotions, keywords, publication consent, pen name
       ↓
[Done] Returns CID + gateway URL
```

**Voice input handling**:
- Uses the Web Speech API (`SpeechRecognition`)
- Shows interim and final results simultaneously in real time
- Built-in TTS (Text-to-Speech) preview
- Works only over HTTPS or on localhost (secure context required)

---

### 3. Encryption / Decryption

**File**: `src/lib/story-crypto.ts`

```
Envelope encryption (AES-256-GCM)
  - Generates a new 32-byte data key per story → encrypts body → uploads to IPFS ({ v: 2, iv, tag, data })
  - The data key is encrypted with the master key (STORY_ENCRYPTION_KEY) and stored only in DB stories.wrapped_key
  - Viewing the original requires both the master key (env var) and the wrapped data key (DB)

Decryption: (admin only)
  - /api/admin/stories/[id]/decrypt unwraps wrapped_key → decrypts the IPFS ciphertext
  - Deleting the DB row makes the IPFS ciphertext permanently undecryptable (handles deletion requests)
```

The original text is never stored in plaintext in the DB. It is stored on IPFS only in encrypted form.

---

### 4. IPFS Integration (Pinata)

**File**: `src/lib/pinata.ts`

```
Pinata SDK → upload to the public IPFS network
  - pinata.upload.public.file(file) → returns CID
  - pinata.gateways.public.convert(cid) → returns public gateway URL
Env vars: PINATA_JWT, PINATA_GATEWAY
```

---

### 5. Admin Authentication

**Files**: `src/lib/auth.ts`, `src/components/AdminShell.tsx`

- Simple password-based token authentication (`ADMIN_PASSWORD` env var)
- On successful login, the token is stored in `localStorage.admin_token`
- `AdminShell` checks for the token on every mount and redirects to `/admin/login` if missing
- All Admin API endpoints require an `Authorization: Bearer <token>` header

---

### 6. Database (Supabase)

**Files**: `src/lib/supabase.ts`, `src/lib/repository.ts`

- A server-only client (`server-only`) accesses the `storytech` schema with the service_role key
- Routes call only `repository.ts` functions; conversion between DB rows (snake_case) and app types (camelCase) happens in the repository
- Initial setup: run `schema.sql` in the SQL Editor → add `storytech` under Project Settings → Data API → Exposed schemas

---

## 🎛️ Admin Pages

### Shared Admin Layout (`AdminShell.tsx`)

Left sidebar + right main content area.

```
┌──────────────┬─────────────────────────────┐
│ Humanity     │                             │
│ Sidebar      │     Main content area       │
│              │                             │
│ ■ Dashboard  │  (renders each page         │
│ ■ Content    │   component)                │
│ ■ Stories    │                             │
│ ■ Analytics  │                             │
│              │                             │
│ [KO][EN]     │                             │
│ Home | Logout│                             │
└──────────────┴─────────────────────────────┘
```

A KO/EN language toggle sits at the bottom of the sidebar.

---

### 📊 Dashboard (`/admin`)

**File**: `src/app/admin/page.tsx`

**Features**:
- Loads statistics from `/api/admin/stats`
- 4 summary cards: Total Issues / Published / Total Articles / Total Views
- Weekly visitors bar chart (using `recharts`)
- Top 4 popular articles (by views, shown with AI-translated text)
- Quick links: Content Management / Analytics Report / Main Website

**Data flow**:
```
Page mount → read admin_token from localStorage
→ GET /api/admin/stats (Bearer token)
→ { totalIssues, publishedIssues, totalArticles, totalViews, userActivity, popularArticles }
→ Render UI
```

---

### 📝 Content Management (`/admin/content`)

**File**: `src/app/admin/content/page.tsx`

The core admin page providing full CRUD over magazine issues and articles.

#### Key Features

| Feature | Description |
|---------|-------------|
| Create issue | Enter issue number, title, theme, editor's note → `POST /api/admin/issues` |
| Publish issue | Change Draft → Published → `POST /api/admin/issues/[id]/publish` |
| Add article | Add an article to an issue → `POST /api/admin/articles` |
| Edit article | Edit title/content/author/order → `PUT /api/admin/articles/[id]` |
| Delete article | Remove after confirmation → `DELETE /api/admin/articles/[id]` |

#### UI Structure

```
[+ New Issue] button
       ↓ on click
[New issue form] (toggle)
  - Issue number, title, theme, editor's note

[Success flash message] (auto-dismisses after 3 seconds)

[Add/Edit article form] (opens per issue)
  - Type (Interview/Story/Review), order, title, author, content

[Issue list] (5 per page, paginated)
  └─ Each issue card
       ├─ Vol. N | [Draft/Published badge]
       ├─ Title, theme (AI-translated)
       ├─ [Publish] button (unpublished issues only)
       ├─ [Article+] button
       └─ [▼/▲] expand button
            └─ Article list (order, type, title, author, ✏️, 🗑️)
```

#### Article Types
- `interview` → Interview
- `story` → Story
- `review` → Book Review

---

### 🛡️ Story Management (`/admin/stories`)

**File**: `src/app/admin/stories/page.tsx`

A secure archive for managing encrypted stories submitted by users.

#### Key Features

| Feature | Description |
|---------|-------------|
| Story list | `GET /api/admin/stories` — all submitted stories |
| Decrypt original | `POST /api/admin/stories/[id]/decrypt` — decrypts the selected story |
| View IPFS original | View the encrypted original directly on the IPFS gateway |

#### Story Card

```
┌─────────────────────────────────────────┐
│  [Date]              [voice / text badge]│
│                                         │
│  Anonymized preview text (3 lines)      │
│                                         │
│  Emotion analysis bar chart:            │
│  ■ Sadness        ████████░░  72%       │
│  ■ Anger          ███░░░░░░░  30%       │
│  ■ Responsibility █████░      50%       │
│  ■ Hope           ████████░░  85%       │
│                                         │
│  [🔓 Decrypt and view original]         │
│  [🔗 View IPFS original (encrypted)]    │
└─────────────────────────────────────────┘
```

#### Decryption Modal

Clicking the decrypt button opens a modal overlay:
- Displays the full original text
- Security warning: "The original text will be cleared from memory when you close this window"
- Close button immediately removes the original from memory

---

### 📈 Analytics Dashboard (`/admin/analytics`)

**File**: `src/app/admin/analytics/page.tsx`

**Data provided**:
- Total views / total articles
- 7-day view trend chart (Line Chart)
- 7-day visitor activity chart (Bar Chart)
- Emotion distribution across all stories (Pie/Bar Chart)
- Detailed popular article list (sorted by views)

---

## 🌐 User-Facing Pages

### Homepage (`/`)

Sections (top → bottom):
1. **Navigation** — menu + language toggle
2. **Hero** — title banner
3. **Writing Lab CTA** — entry point to the AI Writing Lab (button)
4. **Magazine** — latest issue + past issues
5. **Impact** — participation stats (total stories, students, emotion distribution)
6. **About** — mission / vision / background
7. **Footer** — brand info and contact details

### Story Submission (`/submit`)

From entering the Writing Lab to submitting a story:
1. **Access key verification and management**:
   - On entry, checks `localStorage.access_key` (shows a payment modal if absent)
   - For security, the key is masked on screen by default (`ST-••••••`) and can be revealed/copied by clicking
2. **AI Writing Coach (`AILab`)** — writing quality score, grammar/vocabulary/coherence/fluency analysis, improvement suggestions, and an AI-corrected version
3. **Anonymous Story Submission (`StorySubmit`)** — voice/text input. Each input tab (voice/text) operates in isolation to prevent state conflicts; on final submission the server anonymizes the text and stores it on IPFS. Magazine publication consent and a pen name (optional) are submitted together
   - Individual stories are never made public; only stories with publication consent are turned into magazine articles by an admin via "Move to article" in `/admin/stories`

#### AILab (`/api/ai/expand`) Output

| Item | Description |
|------|-------------|
| Overall score | 0–100, shown as a circular gauge |
| Grammar | Up to 30 points |
| Vocabulary | Up to 25 points |
| Coherence | Up to 25 points |
| Fluency | Up to 20 points |
| Suggestions | Problem phrases + explanations |
| AI-corrected text | Full revised text + copy button |

> **Note**: AILab does not perform emotion analysis.

#### Where Emotion Analysis Happens

| Location | Performed by | Purpose |
|----------|--------------|---------|
| `StorySubmit` → `/api/stories/submit` | AI (submission pipeline) | Tags emotions on submission → stored in the DB `emotions` field |
| `/admin/stories` | Admin UI | Visualizes stored emotion data as a bar chart per card |
| `/admin/analytics` | Admin UI | Aggregated emotion distribution chart across all stories |

---

## 🔐 Environment Variables (`.env.local`)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI API key / model name |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin login credentials |
| `AUTH_SECRET` | Secret for signing admin tokens |
| `STORY_ENCRYPTION_KEY` | AES-256 master key that wraps story data keys (32-byte hex, 64 chars) |
| `PINATA_JWT` / `PINATA_GATEWAY` | Pinata API JWT / gateway domain |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project URL / server-only secret key |

See the comments in `.env.example` for how to obtain each. For deployment (Amplify), register environment variables with the same names and `amplify.yml` injects them at build time.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | OpenAI API (gpt-4o-mini) |
| Storage | Supabase (PostgreSQL, `storytech` schema) |
| Distributed storage | IPFS (Pinata SDK) |
| Encryption | Node.js `crypto` — AES-256-GCM |
| Charts | Recharts |
| Icons | Lucide React |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |

---

## 🚀 Running the Dev Server

```bash
npm run dev
# → http://localhost:3000
```

Admin entry: `http://localhost:3000/admin`
- Redirects to `/admin/login` automatically if no token
- Log in with the value of the `ADMIN_PASSWORD` environment variable
