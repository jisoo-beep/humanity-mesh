# StoryTech Humanity Lab — 프로젝트 문서

> 탈북 청소년들이 자신의 이야기를 안전하게 공유하고, AI 기반 도구를 통해 글쓰기 능력을 향상시킬 수 있는 플랫폼

---

## 📁 프로젝트 구조

```
story-tech/
├── schema.sql                     # Supabase DDL + 초기 데이터 (storytech 스키마)
├── .env.example                   # 환경 변수 템플릿 (발급 경로 안내 포함)
├── src/
│   ├── app/
│   │   ├── page.tsx               # 메인 홈페이지
│   │   ├── layout.tsx             # 루트 레이아웃 (I18nProvider 주입)
│   │   ├── providers.tsx          # 클라이언트 프로바이더
│   │   ├── submit/                # /submit 라우트 (익명 스토리 제출 페이지)
│   │   ├── admin/                 # 어드민 영역 (사이드바 레이아웃)
│   │   │   ├── layout.tsx         # AdminShell 공통 레이아웃
│   │   │   ├── page.tsx           # /admin — 대시보드
│   │   │   ├── login/             # /admin/login — 로그인
│   │   │   ├── content/           # /admin/content — 콘텐츠 관리
│   │   │   ├── stories/           # /admin/stories — 스토리 관리
│   │   │   └── analytics/         # /admin/analytics — 분석 대시보드
│   │   └── api/                   # Next.js API Routes (서버 전용)
│   │       ├── admin/
│   │       │   ├── login/         # POST — 어드민 로그인
│   │       │   ├── stats/         # GET — 대시보드 통계
│   │       │   ├── issues/        # GET/POST — 이슈 CRUD
│   │       │   │   └── [id]/publish/  # POST — 이슈 발행
│   │       │   ├── articles/      # POST — 아티클 생성
│   │       │   │   └── [id]/      # PUT/DELETE — 아티클 수정/삭제
│   │       │   ├── stories/       # GET — 스토리 목록
│   │       │   │   └── [id]/decrypt/ # POST — 스토리 복호화
│   │       │   └── analytics/     # GET — 분석 데이터
│   │       ├── ai/
│   │       │   ├── analyze/       # POST — 글쓰기 분석 (AI)
│   │       │   ├── expand/        # POST — 문장 확장 제안 (AI)
│   │       │   └── translate/     # POST — 텍스트 번역 (AI)
│   │       ├── issues/            # GET — 공개 이슈 조회
│   │       ├── articles/          # GET — 아티클 조회 + 조회수 카운팅
│   │       ├── stories/submit/    # POST — 스토리 제출 (접속 키 필요, 익명화 → 암호화 → IPFS)
│   │       ├── payment/           # POST 접속 키 발급 / GET 접속 키 검증
│   │       └── stats/             # GET — 공개 임팩트 통계
│   ├── components/
│   │   ├── Navigation.tsx         # 상단 네비게이션 (언어 토글 포함)
│   │   ├── Hero.tsx               # 히어로 섹션
│   │   ├── About.tsx              # 소개 섹션 (미션/비전/배경)
│   │   ├── Magazine.tsx           # 매거진 섹션 (공개 이슈 목록)
│   │   ├── AILab.tsx              # AI 글쓰기 연구소 컴포넌트
│   │   ├── AITranslatedText.tsx   # AI 실시간 번역 텍스트 컴포넌트
│   │   ├── StorySubmit.tsx        # 익명 스토리 제출 폼
│   │   ├── Impact.tsx             # 임팩트 수치 섹션
│   │   ├── Footer.tsx             # 푸터
│   │   └── AdminShell.tsx         # 어드민 공통 레이아웃 (사이드바)
│   └── lib/
│       ├── db.ts                  # 공용 도메인 타입 (Issue, Article, Story …)
│       ├── supabase.ts            # 서버 전용 Supabase 클라이언트 (service_role)
│       ├── repository.ts          # DB 조회/저장 함수 (snake_case 행 ↔ camelCase 타입)
│       ├── anonymize.ts           # AI 익명화 (실패 시 예외 — 원문 저장 차단)
│       ├── i18n.tsx               # 다국어(KO/EN) Context Provider
│       ├── auth.ts                # 어드민 토큰 인증 유틸리티
│       ├── pinata.ts              # Pinata IPFS SDK 래퍼
│       └── story-crypto.ts        # AES-256-GCM 봉투 암호화/복호화
```

---

## 🗄️ 데이터 모델 (Supabase `storytech` 스키마)

전체 DDL과 초기 데이터는 `schema.sql` 참고. 모든 테이블은 RLS 활성화 + 정책 없음 → 서버의 service_role 키로만 접근.

| 테이블 | 주요 컬럼 | 비고 |
|--------|----------|------|
| `access_keys` | `key_hash`, `age`, `gender`, `created_at` | 원래 키는 저장하지 않고 SHA-256 해시만 |
| `stories` | `cid`, `wrapped_key`, `emotions`, `keywords`, `input_type`, `publish_consent`, `pen_name` | 본문은 IPFS에 암호문으로만 존재 |
| `issues` | `issue_number`, `title`, `theme`, `editor_note`, `is_published`, `published_at` | 매거진 호 |
| `articles` | `issue_id`, `type`, `title`, `content`, `author_name`, `display_order`, `views`, `highlight_quote` | 조회수는 `increment_article_views()` 함수로 원자적 증가 |

- 임팩트 통계(총 스토리 수, 감정 분포, 참여 학생 수)는 별도 저장 없이 테이블에서 집계
- 임팩트 섹션의 "학생들의 목소리"는 발행된 기사의 `highlight_quote`(관리자가 `/admin/content`에서 본문 문장을 골라 지정, 본문에 없는 문장은 DB가 거부)

---

## ⚙️ 핵심 기능 로직

### 1. 다국어 지원 (i18n)

**파일**: `src/lib/i18n.tsx`

- `ko` / `en` 두 언어 객체를 정적으로 정의
- `I18nProvider` 가 React Context로 전체 앱에 주입
- `useI18n()` 훅으로 어디서든 `{ t, lang, setLang }` 접근
- `AITranslatedText` 컴포넌트: DB에 저장된 한국어 텍스트를 영어 모드에서 AI API(`/api/ai/translate`)로 실시간 번역하여 렌더링

```
언어 변경 → setLang('en') → t = en 객체로 교체 → UI 즉시 변경
DB 텍스트(한국어) → AITranslatedText → /api/ai/translate → 영어로 렌더링
```

---

### 2. 스토리 제출 파이프라인

**파일**: `src/components/StorySubmit.tsx`

사용자 입력부터 IPFS 저장까지 서버의 한 요청(`/api/stories/submit`) 안에서 처리. 요청에는 `X-Access-Key` 헤더(발급받은 접속 키)가 필요.

```
[사용자 입력] (음성 or 텍스트) + 매거진 게재 동의 / 필명 (선택)
       ↓
[1] 접속 키 검증
[2] AI 익명화 (src/lib/anonymize.ts)
  - 이름·지명·날짜·소속을 [이름] [장소] [때] [소속]으로 치환, 연락처 삭제
  - 실패하면 저장하지 않고 중단 (원문이 저장되는 경로 차단)
[3] 감정 분석 — 4대 감정 비율 + 키워드 5개
[4] 봉투 암호화 → IPFS 업로드 (암호문만)
[5] DB 저장 — CID, 잠긴 데이터 키, 감정, 키워드, 게재 동의, 필명
       ↓
[완료] CID + 게이트웨이 URL 반환
```

**음성 입력 처리**:
- Web Speech API (`SpeechRecognition`) 사용
- 실시간 중간 결과(interim)와 최종 결과(final) 동시 표시
- TTS(Text-to-Speech) 미리 듣기 기능 내장
- HTTPS 또는 localhost에서만 동작 (보안 컨텍스트 필수)

---

### 3. 암호화/복호화

**파일**: `src/lib/story-crypto.ts`

```
봉투 암호화 (AES-256-GCM)
  - 스토리마다 새 32바이트 데이터 키 생성 → 본문 암호화 → IPFS 업로드 ({ v: 2, iv, tag, data })
  - 데이터 키는 마스터키(STORY_ENCRYPTION_KEY)로 암호화해 DB stories.wrapped_key 에만 저장
  - 원문을 보려면 마스터키(환경변수)와 잠긴 데이터 키(DB)가 모두 필요

복호화: (관리자 전용)
  - /api/admin/stories/[id]/decrypt 에서 wrapped_key 해제 → IPFS 암호문 복호화
  - DB 행을 지우면 IPFS 암호문은 영구히 복호화 불가 (삭제 요청 대응)
```

원문은 절대 DB에 평문으로 저장되지 않습니다. IPFS에도 암호화된 상태로만 저장됩니다.

---

### 4. IPFS 연동 (Pinata)

**파일**: `src/lib/pinata.ts`

```
Pinata SDK → IPFS 퍼블릭 네트워크 업로드
  - pinata.upload.public.file(file) → CID 반환
  - pinata.gateways.public.convert(cid) → 공개 게이트웨이 URL 반환
환경변수: PINATA_JWT, PINATA_GATEWAY
```

---

### 5. 어드민 인증

**파일**: `src/lib/auth.ts`, `src/components/AdminShell.tsx`

- 비밀번호 기반의 심플한 토큰 인증 (`ADMIN_PASSWORD` 환경변수)
- 로그인 성공 시 토큰을 `localStorage.admin_token`에 저장
- `AdminShell`이 마운트마다 토큰 유무를 확인, 없으면 `/admin/login`으로 리다이렉트
- 모든 Admin API 엔드포인트는 `Authorization: Bearer <token>` 헤더 필수

---

### 6. 데이터베이스 (Supabase)

**파일**: `src/lib/supabase.ts`, `src/lib/repository.ts`

- 서버 전용 클라이언트(`server-only`)가 service_role 키로 `storytech` 스키마에 접근
- 라우트는 `repository.ts` 함수만 호출하고, DB 행(snake_case) ↔ 앱 타입(camelCase) 변환은 repository에서 처리
- 초기 설정: `schema.sql`을 SQL Editor에서 실행 → Project Settings → Data API → Exposed schemas에 `storytech` 추가

---

## 🎛️ 어드민 페이지 상세

### 어드민 공통 레이아웃 (`AdminShell.tsx`)

왼쪽 사이드바 + 오른쪽 메인 콘텐츠 구조.

```
┌───────────┬─────────────────────────────┐
│ StoryTech │                             │
│ 사이드바   │     메인 콘텐츠 영역         │
│           │                             │
│ ■ 대시보드 │  (각 페이지 컴포넌트 렌더링) │
│ ■ 콘텐츠   │                             │
│ ■ 스토리   │                             │
│ ■ 분석    │                             │
│           │                             │
│ [KO][EN]  │                             │
│ 홈 | 로그아웃 │                          │
└───────────┴─────────────────────────────┘
```

사이드바 하단에 KO/EN 언어 토글 스위치가 존재합니다.

---

### 📊 대시보드 (`/admin`)

**파일**: `src/app/admin/page.tsx`

**기능**:
- `/api/admin/stats` 에서 통계 데이터 로드
- 4개의 요약 카드: 전체 이슈 / 발행됨 / 전체 아티클 / 총 조회수
- 주간 방문자 Bar Chart (`recharts` 라이브러리 사용)
- 인기 아티클 Top 4 목록 (조회수 기준, AI 번역 텍스트 표시)
- 빠른 작업 링크: 콘텐츠 관리 / 분석 리포트 / 메인 웹사이트

**데이터 흐름**:
```
페이지 마운트 → localStorage에서 admin_token 읽기
→ GET /api/admin/stats (Bearer 토큰)
→ { totalIssues, publishedIssues, totalArticles, totalViews, userActivity, popularArticles }
→ UI 렌더링
```

---

### 📝 콘텐츠 관리 (`/admin/content`)

**파일**: `src/app/admin/content/page.tsx`

매거진의 이슈와 아티클을 완전히 CRUD하는 핵심 관리 페이지.

#### 주요 기능

| 기능 | 설명 |
|------|------|
| 이슈 생성 | 호수, 제목, 주제, 편집자 노트 입력 → `POST /api/admin/issues` |
| 이슈 발행 | Draft → Published 상태 변경 → `POST /api/admin/issues/[id]/publish` |
| 아티클 추가 | 이슈에 아티클 추가 → `POST /api/admin/articles` |
| 아티클 수정 | 제목/내용/저자/순서 수정 → `PUT /api/admin/articles/[id]` |
| 아티클 삭제 | 삭제 확인 후 제거 → `DELETE /api/admin/articles/[id]` |

#### UI 구조

```
[+ 새 이슈] 버튼
       ↓ 클릭 시
[새 이슈 생성 폼] (토글)
  - 호수, 제목, 주제, 편집자 노트

[성공 알림 플래시 메시지] (3초 후 자동 사라짐)

[아티클 추가/수정 폼] (이슈별로 열림)
  - 타입(인터뷰/스토리/서평), 순서, 제목, 저자, 내용

[이슈 목록] (페이지당 5개, 페이지네이션)
  └─ 각 이슈 카드
       ├─ Vol. N | [Draft/Published 뱃지]
       ├─ 제목, 주제 (AI 번역 표시)
       ├─ [발행] 버튼 (미발행 이슈만)
       ├─ [아티클+] 버튼
       └─ [▼/▲] 펼치기 버튼
            └─ 아티클 목록 (순서, 타입, 제목, 저자, ✏️, 🗑️)
```

#### 아티클 타입
- `interview` → 인터뷰
- `story` → 스토리
- `review` → 서평

---

### 🛡️ 스토리 관리 (`/admin/stories`)

**파일**: `src/app/admin/stories/page.tsx`

사용자가 제출한 암호화된 스토리를 관리하는 보안 아카이브.

#### 주요 기능

| 기능 | 설명 |
|------|------|
| 스토리 목록 | `GET /api/admin/stories` — 모든 제출된 스토리 |
| 원문 복호화 | `POST /api/admin/stories/[id]/decrypt` — 선택한 스토리 복호화 |
| IPFS 원본 확인 | 암호화 상태의 원본을 IPFS 게이트웨이에서 직접 확인 |

#### 스토리 카드 정보

```
┌─────────────────────────────────────────┐
│  [날짜]              [voice / text 뱃지] │
│                                         │
│  익명화된 미리보기 텍스트 (3줄)           │
│                                         │
│  감정 분석 바 차트:                       │
│  ■ Sadness    ████████░░  72%           │
│  ■ Anger      ███░░░░░░░  30%           │
│  ■ Responsibility █████░  50%           │
│  ■ Hope       ████████░░  85%           │
│                                         │
│  [🔓 원문 복호화하여 보기]               │
│  [🔗 IPFS 원본(암호화) 확인]            │
└─────────────────────────────────────────┘
```

#### 복호화 모달

복호화 버튼 클릭 시 모달 오버레이 표시:
- 원문 전체 텍스트 표시
- 보안 경고: "창을 닫으면 원문은 메모리에서 삭제됩니다"
- 닫기 버튼으로 원문 메모리에서 즉시 제거

---

### 📈 분석 대시보드 (`/admin/analytics`)

**파일**: `src/app/admin/analytics/page.tsx`

**제공 데이터**:
- 총 조회수 / 전체 아티클 수
- 최근 7일 조회수 추이 차트 (Line Chart)
- 최근 7일 방문자 활동 차트 (Bar Chart)
- 전체 스토리 감정 분포 (Pie/Bar Chart)
- 인기 아티클 상세 목록 (조회수 순)

---

## 🌐 사용자 대면 페이지

### 홈페이지 (`/`)

섹션 구성 (위 → 아래):
1. **Navigation** — 메뉴 + 언어 토글
2. **Hero** — 타이틀 배너
3. **Writing Lab CTA** — AI 글쓰기 연구소 진입점 (버튼)
4. **Magazine** — 최신 이슈 + 과거 이슈 목록
5. **Impact** — 참여 통계 (총 스토리 수, 학생 수, 감정 분포)
6. **About** — 미션 / 비전 / 배경 소개
7. **Footer** — 브랜드 소개 및 연락처 정보

### 스토리 제출 (`/submit`)

Writing Lab 진입부터 스토리 제출까지:
1. **접근 키 검증 및 관리**:
   - 진입 시 `localStorage.access_key` 확인 (없으면 결제 모달 표시)
   - 보안 강화를 위해 화면 상에 키가 기본적으로 Маsking 처리(`ST-••••••`) 되며, 클릭을 통해 전체 복사/열람 가능
2. **AI 글쓰기 코치 (`AILab`)** — 글쓰기 품질 점수, 문법/어휘/흐름/유창성 분석, 개선 제안 및 AI 교정문 제공
3. **익명 스토리 제출 (`StorySubmit`)** — 음성/텍스트 입력 기반. 상태 충돌 방지를 위해 각 입력 탭(음성/텍스트)은 격리되어 동작하며, 최종 제출 시 서버에서 익명화 후 IPFS에 저장됨. 매거진 게재 동의와 필명(선택)을 함께 제출
   - 개별 스토리는 공개되지 않으며, 게재에 동의한 스토리만 관리자가 `/admin/stories`에서 "기사로 옮기기"로 매거진 기사화

#### AILab (`/api/ai/expand`) 제공 항목

| 항목 | 설명 |
|------|------|
| 종합 점수 | 0~100점 원형 게이지 표시 |
| 문법 (Grammar) | 최대 30점 |
| 어휘 (Vocabulary) | 최대 25점 |
| 문장 흐름 (Coherence) | 최대 25점 |
| 유창성 (Fluency) | 최대 20점 |
| 개선 제안 목록 | 문제 구절 + 이유 설명 |
| AI 교정문 | 전체 문장 수정안 + 복사 버튼 |

> **참고**: AILab은 감정 분석을 하지 않습니다.

#### 감정 분석이 수행되는 위치

| 위치 | 수행 주체 | 목적 |
|------|----------|------|
| `StorySubmit` → `/api/stories/submit` | AI (제출 파이프라인) | 스토리 제출 시 감정 태깅 → DB에 `emotions` 필드로 저장 |
| `/admin/stories` | 어드민 UI | 저장된 감정 데이터를 카드별 바 차트로 시각화 |
| `/admin/analytics` | 어드민 UI | 전체 스토리의 감정 분포 집계 차트 |

---

## 🔐 환경변수 (`.env.local`)

| 변수명 | 설명 |
|--------|------|
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI API 키 / 모델 이름 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 어드민 로그인 계정 |
| `AUTH_SECRET` | 어드민 토큰 서명용 비밀값 |
| `STORY_ENCRYPTION_KEY` | 스토리 데이터 키를 잠그는 AES-256 마스터키 (32바이트 hex, 64자) |
| `PINATA_JWT` / `PINATA_GATEWAY` | Pinata API JWT / 게이트웨이 도메인 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase 프로젝트 URL / 서버 전용 secret 키 |

발급 방법은 `.env.example`의 주석 참고. 배포(Amplify)에서는 같은 이름으로 환경 변수를 등록하면 `amplify.yml`이 빌드 시 주입.

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| AI | OpenAI API (gpt-4o-mini) |
| 저장소 | Supabase (PostgreSQL, `storytech` 스키마) |
| 분산 저장 | IPFS (Pinata SDK) |
| 암호화 | Node.js `crypto` — AES-256-GCM |
| 차트 | Recharts |
| 아이콘 | Lucide React |
| 음성 | Web Speech API (SpeechRecognition + SpeechSynthesis) |

---

## 🚀 개발 서버 실행

```bash
npm run dev
# → http://localhost:3000
```

어드민 진입: `http://localhost:3000/admin`
- 토큰 없으면 `/admin/login` 자동 리다이렉트
- `ADMIN_PASSWORD` 환경변수의 값으로 로그인
