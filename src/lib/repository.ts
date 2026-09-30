import 'server-only'
import crypto from 'crypto'
import { getSupabase } from './supabase'
import { pinata } from './pinata'
import type {
  AccessKeyInfo, Article, ArticleType, Gender, ImpactStats,
  InputType, Issue, IssueWithArticles, Story, Voice,
} from './db'

interface IssueRow {
  id: string
  issue_number: number
  title: string
  theme: string
  editor_note: string
  is_published: boolean
  published_at: string | null
  created_at: string
}

interface ArticleRow {
  id: string
  issue_id: string
  type: ArticleType
  title: string
  content: string
  author_name: string
  display_order: number
  views: number
  highlight_quote: string | null
  created_at: string
}

interface StoryRow {
  id: string
  cid: string
  emotions: Record<string, number>
  keywords: string[]
  input_type: InputType
  publish_consent: boolean
  pen_name: string | null
  created_at: string
}

type ArticleInput = Pick<Article, 'type' | 'title' | 'content' | 'authorName' | 'displayOrder' | 'highlightQuote'>

const UNIQUE_VIOLATION = '23505'
const FOREIGN_KEY_VIOLATION = '23503'
const INVALID_TEXT_REPRESENTATION = '22P02'
const ISSUE_WITH_ARTICLES = '*, articles(*)'

interface QueryResult<T> {
  data: T | null
  error: { code: string; message: string } | null
}

function unwrap<T>({ data, error }: QueryResult<T>): T {
  if (error) throw new Error(error.message)
  return data as T
}

function mapIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    issueNumber: row.issue_number,
    title: row.title,
    theme: row.theme,
    editorNote: row.editor_note,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  }
}

function mapArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    issueId: row.issue_id,
    type: row.type,
    title: row.title,
    content: row.content,
    authorName: row.author_name,
    displayOrder: row.display_order,
    views: row.views,
    highlightQuote: row.highlight_quote,
    createdAt: row.created_at,
  }
}

function mapIssueWithArticles(row: IssueRow & { articles: ArticleRow[] }): IssueWithArticles {
  return {
    ...mapIssue(row),
    articles: row.articles.map(mapArticle).sort((a, b) => a.displayOrder - b.displayOrder),
  }
}

function sumEmotions(rows: { emotions: Record<string, number> }[]): Record<string, number> {
  const total: Record<string, number> = {}
  for (const { emotions } of rows) {
    for (const [key, value] of Object.entries(emotions)) total[key] = (total[key] ?? 0) + value
  }
  return total
}

/**
 * Magazine (public)
 */

export async function getPublishedIssues(): Promise<Issue[]> {
  const rows = unwrap<IssueRow[]>(
    await getSupabase().from('issues').select('*').eq('is_published', true).order('published_at', { ascending: false })
  )
  return rows.map(mapIssue)
}

export async function getLatestPublishedIssue(): Promise<IssueWithArticles | null> {
  const row = unwrap<(IssueRow & { articles: ArticleRow[] }) | null>(
    await getSupabase()
      .from('issues')
      .select(ISSUE_WITH_ARTICLES)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  )
  return row ? mapIssueWithArticles(row) : null
}

export async function getPublishedIssueById(id: string): Promise<IssueWithArticles | null> {
  const row = unwrap<(IssueRow & { articles: ArticleRow[] }) | null>(
    await getSupabase().from('issues').select(ISSUE_WITH_ARTICLES).eq('id', id).eq('is_published', true).maybeSingle()
  )
  return row ? mapIssueWithArticles(row) : null
}

export async function incrementArticleViews(id: string): Promise<number | null> {
  return unwrap<number | null>(await getSupabase().rpc('increment_article_views', { p_article_id: id }))
}

export async function getImpactStats(): Promise<ImpactStats> {
  const supabase = getSupabase()
  const [keys, stories] = await Promise.all([
    supabase.from('access_keys').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('emotions'),
  ])
  if (keys.error) throw new Error(keys.error.message)
  const storyRows = unwrap<{ emotions: Record<string, number> }[]>(stories)

  return {
    totalStudents: keys.count ?? 0,
    totalStories: storyRows.length,
    emotionData: sumEmotions(storyRows),
  }
}

// 발행된 호의 기사 중 관리자가 인용문을 지정한 것만
export async function getVoices(): Promise<Voice[]> {
  const rows = unwrap<{ highlight_quote: string; author_name: string }[]>(
    await getSupabase()
      .from('articles')
      .select('highlight_quote, author_name, issues!inner(is_published)')
      .not('highlight_quote', 'is', null)
      .eq('issues.is_published', true)
      .order('created_at', { ascending: false })
  )
  return rows.map((row) => ({ quote: row.highlight_quote, author: row.author_name }))
}

/**
 * Magazine (admin)
 */

export async function getAllIssuesAdmin(): Promise<IssueWithArticles[]> {
  const rows = unwrap<(IssueRow & { articles: ArticleRow[] })[]>(
    await getSupabase().from('issues').select(ISSUE_WITH_ARTICLES).order('created_at', { ascending: false })
  )
  return rows.map(mapIssueWithArticles)
}

export async function createIssue(input: Partial<Pick<Issue, 'issueNumber' | 'title' | 'theme' | 'editorNote'>>): Promise<Issue> {
  const supabase = getSupabase()

  let issueNumber = input.issueNumber
  if (!issueNumber) {
    const last = unwrap<{ issue_number: number } | null>(
      await supabase.from('issues').select('issue_number').order('issue_number', { ascending: false }).limit(1).maybeSingle()
    )
    issueNumber = (last?.issue_number ?? 0) + 1
  }

  const { data, error } = await supabase
    .from('issues')
    .insert({
      issue_number: issueNumber,
      title: input.title || '새 이슈',
      theme: input.theme ?? '',
      editor_note: input.editorNote ?? '',
    })
    .select()
    .single()

  if (error?.code === UNIQUE_VIOLATION) throw new Error(`${issueNumber}호가 이미 존재합니다.`)
  return mapIssue(unwrap<IssueRow>({ data, error }))
}

export async function publishIssue(id: string): Promise<Issue> {
  const row = unwrap<IssueRow | null>(
    await getSupabase()
      .from('issues')
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
  )
  if (!row) throw new Error('Issue not found')
  return mapIssue(row)
}

export async function createArticle(issueId: string, input: Partial<ArticleInput>): Promise<Article> {
  const { data, error } = await getSupabase()
    .from('articles')
    .insert({
      issue_id: issueId,
      type: input.type || 'story',
      title: input.title || '새 아티클',
      content: input.content ?? '',
      author_name: input.authorName || '익명',
      display_order: input.displayOrder || 1,
    })
    .select()
    .single()

  if (error?.code === FOREIGN_KEY_VIOLATION) throw new Error('Issue not found')
  return mapArticle(unwrap<ArticleRow>({ data, error }))
}

export class ArticleValidationError extends Error {}

// 요청 본문에서 수정 가능한 필드만 골라낸다 (id, views 등은 변경 불가)
// 인용문은 본문에 실제로 있는 문장이어야 하며, 본문을 고쳐 인용문이 사라지면 인용 지정을 해제한다
export async function updateArticle(id: string, input: Partial<ArticleInput>): Promise<Article> {
  const supabase = getSupabase()
  const current = unwrap<{ content: string; highlight_quote: string | null } | null>(
    await supabase.from('articles').select('content, highlight_quote').eq('id', id).maybeSingle()
  )
  if (!current) throw new Error('Article not found')

  const content = input.content ?? current.content
  let highlightQuote = current.highlight_quote
  if (input.highlightQuote !== undefined) {
    highlightQuote = input.highlightQuote?.trim() || null
    if (highlightQuote && !content.includes(highlightQuote)) {
      throw new ArticleValidationError('본문에 있는 문장만 인용할 수 있습니다.')
    }
  } else if (highlightQuote && !content.includes(highlightQuote)) {
    highlightQuote = null
  }

  const changes = {
    type: input.type,
    title: input.title,
    content: input.content,
    author_name: input.authorName,
    display_order: input.displayOrder,
    highlight_quote: highlightQuote,
  }
  const row = unwrap<ArticleRow | null>(
    await supabase
      .from('articles')
      .update(Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)))
      .eq('id', id)
      .select()
      .maybeSingle()
  )
  if (!row) throw new Error('Article not found')
  return mapArticle(row)
}

export async function deleteArticle(id: string): Promise<void> {
  const rows = unwrap<{ id: string }[]>(await getSupabase().from('articles').delete().eq('id', id).select('id'))
  if (rows.length === 0) throw new Error('Article not found')
}

export async function getAnalytics() {
  const supabase = getSupabase()
  const [issues, articles, stories] = await Promise.all([
    supabase.from('issues').select('is_published'),
    supabase.from('articles').select('*, issues(issue_number)'),
    supabase.from('stories').select('emotions'),
  ])
  const issueRows = unwrap<{ is_published: boolean }[]>(issues)
  const articleRows = unwrap<(ArticleRow & { issues: { issue_number: number } | null })[]>(articles)

  const popularArticles = [...articleRows]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map((row) => ({ ...mapArticle(row), issueNumber: row.issues?.issue_number ?? null }))

  return {
    totalIssues: issueRows.length,
    publishedIssues: issueRows.filter((i) => i.is_published).length,
    totalArticles: articleRows.length,
    totalViews: articleRows.reduce((sum, a) => sum + a.views, 0),
    emotionStats: sumEmotions(unwrap<{ emotions: Record<string, number> }[]>(stories)),
    uniqueVisitors: 1240, // Mock
    viewsByDate: [
      { date: '2026-03-27', views: 320 },
      { date: '2026-03-28', views: 450 },
      { date: '2026-03-29', views: 280 },
      { date: '2026-03-30', views: 590 },
      { date: '2026-03-31', views: 410 },
      { date: '2026-04-01', views: 680 },
      { date: '2026-04-02', views: 520 },
    ],
    popularArticles,
    userActivity: [
      { date: '월', visitors: 400 },
      { date: '화', visitors: 300 },
      { date: '수', visitors: 500 },
      { date: '목', visitors: 280 },
      { date: '금', visitors: 590 },
      { date: '토', visitors: 320 },
      { date: '일', visitors: 210 },
    ],
  }
}

/**
 * Access keys — 원래 키는 저장하지 않고 SHA-256 해시만 저장
 */

const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 헷갈리는 문자(O,I,1,0) 제외

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

function generateKey(): string {
  let key = 'ST-'
  for (let i = 0; i < 6; i++) key += KEY_CHARS[crypto.randomInt(KEY_CHARS.length)]
  return key
}

export async function createAccessKey(age: number, gender: Gender): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const key = generateKey()
    const { error } = await getSupabase().from('access_keys').insert({ key_hash: hashKey(key), age, gender })
    if (!error) return key
    if (error.code !== UNIQUE_VIOLATION) throw new Error(error.message)
  }
  throw new Error('Failed to generate a unique access key')
}

export async function isValidAccessKey(key: string): Promise<boolean> {
  const row = unwrap<{ key_hash: string } | null>(
    await getSupabase().from('access_keys').select('key_hash').eq('key_hash', hashKey(key)).maybeSingle()
  )
  return row !== null
}

export async function listAccessKeys(): Promise<AccessKeyInfo[]> {
  const rows = unwrap<{ age: number; gender: Gender; created_at: string }[]>(
    await getSupabase().from('access_keys').select('age, gender, created_at').order('created_at', { ascending: false })
  )
  return rows.map((row) => ({ age: row.age, gender: row.gender, createdAt: row.created_at }))
}

/**
 * Stories — 본문은 IPFS에 암호문으로만 존재, DB에는 위치(CID)와 잠긴 데이터 키만 저장
 */

export async function createStory(input: {
  cid: string
  wrappedKey: string
  emotions: Record<string, number>
  keywords: string[]
  inputType: InputType
  publishConsent: boolean
  penName: string | null
}): Promise<string> {
  const row = unwrap<{ id: string }>(
    await getSupabase()
      .from('stories')
      .insert({
        cid: input.cid,
        wrapped_key: input.wrappedKey,
        emotions: input.emotions,
        keywords: input.keywords,
        input_type: input.inputType,
        publish_consent: input.publishConsent,
        pen_name: input.penName,
      })
      .select('id')
      .single()
  )
  return row.id
}

export async function listStoriesAdmin(): Promise<Story[]> {
  const rows = unwrap<StoryRow[]>(
    await getSupabase()
      .from('stories')
      .select('id, cid, emotions, keywords, input_type, publish_consent, pen_name, created_at')
      .order('created_at', { ascending: false })
  )
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      cid: row.cid,
      ipfsUrl: await pinata.gateways.public.convert(row.cid),
      emotions: row.emotions,
      keywords: row.keywords,
      inputType: row.input_type,
      publishConsent: row.publish_consent,
      penName: row.pen_name,
      createdAt: row.created_at,
    }))
  )
}

export async function getStoryCipherRef(id: string): Promise<{ cid: string; wrappedKey: string } | null> {
  const { data, error } = await getSupabase().from('stories').select('cid, wrapped_key').eq('id', id).maybeSingle()
  if (error?.code === INVALID_TEXT_REPRESENTATION) return null // uuid 형식이 아닌 id
  const row = unwrap<{ cid: string; wrapped_key: string } | null>({ data, error })
  return row ? { cid: row.cid, wrappedKey: row.wrapped_key } : null
}
