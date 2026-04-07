import { readDB, writeDB, generateId, Issue, Article, Stats, IssueWithArticles } from './db'

/**
 * Public APIs
 */

export async function getIssues() {
  const db = readDB()
  // 발행된 이슈 목록 (상세 아티클 제외, 정렬 포함)
  return db.issues
    .filter((i) => i.isPublished)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
}

export async function getLatestPublishedIssue(): Promise<IssueWithArticles | null> {
  const db = readDB()
  const issue = db.issues
    .filter((i) => i.isPublished)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())[0]

  if (!issue) return null

  // 해당 이슈의 아티클들을 찾아 조인
  const issueArticles = db.articles
    .filter((a) => a.issueId === issue.id)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return {
    ...issue,
    articles: issueArticles,
  }
}

export async function getIssueById(id: string): Promise<IssueWithArticles | null> {
  const db = readDB()
  const issue = db.issues.find((i) => i.id === id)
  if (!issue) return null

  const issueArticles = db.articles
    .filter((a) => a.issueId === issue.id)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return {
    ...issue,
    articles: issueArticles,
  }
}

export async function getStats(): Promise<Stats> {
  const db = readDB()
  return db.stats
}

/**
 * Admin APIs
 */

export async function getAllIssuesAdmin(): Promise<IssueWithArticles[]> {
  const db = readDB()
  const issues = db.issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  return issues.map(issue => ({
    ...issue,
    articles: db.articles
      .filter(a => a.issueId === issue.id)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }))
}

export async function createIssue(data: Partial<Issue>) {
  const db = readDB()
  const newIssue: Issue = {
    id: `issue-${generateId()}`,
    issueNumber: db.issues.length + 1,
    title: data.title || '새 이슈',
    theme: data.theme || '',
    editorNote: data.editorNote || '',
    isPublished: false,
    createdAt: new Date().toISOString(),
    coverImage: data.coverImage,
  }
  db.issues.push(newIssue)
  writeDB(db)
  return newIssue
}

export async function publishIssue(id: string) {
  const db = readDB()
  const issue = db.issues.find((i) => i.id === id)
  if (!issue) throw new Error('Issue not found')

  issue.isPublished = true
  issue.publishedAt = new Date().toISOString()
  writeDB(db)
  return issue
}

export async function createArticle(issueId: string, data: Partial<Article>) {
  const db = readDB()
  const issue = db.issues.find((i) => i.id === issueId)
  if (!issue) throw new Error('Issue not found')

  const newArticle: Article = {
    id: `article-${generateId()}`,
    issueId,
    type: data.type || 'story',
    title: data.title || '새 아티클',
    content: data.content || '',
    authorName: data.authorName || '익명',
    displayOrder: data.displayOrder || 1, // 필요 시 로직 추가
    createdAt: new Date().toISOString(),
    featuredImage: data.featuredImage,
    views: 0
  }

  db.articles.push(newArticle)
  writeDB(db)
  return newArticle
}

export async function updateArticle(articleId: string, data: Partial<Article>) {
  const db = readDB()
  const found = db.articles.find((a) => a.id === articleId)
  
  if (!found) throw new Error('Article not found')
  
  Object.assign(found, data)
  writeDB(db)
  return found
}

export async function deleteArticle(articleId: string) {
  const db = readDB()
  const index = db.articles.findIndex((a) => a.id === articleId)
  
  if (index === -1) throw new Error('Article not found')
  
  db.articles.splice(index, 1)
  writeDB(db)
  return { success: true }
}

export async function getUserList() {
  const db = readDB()
  return db.accessKeys || []
}

export async function getAnalytics() {
  const db = readDB()
  
  // 모든 이슈와 아티클 집계
  const totalIssues = db.issues.length
  const publishedIssues = db.issues.filter((i) => i.isPublished).length
  const totalArticles = db.articles.length
  const totalViews = db.articles.reduce((sum, a) => sum + (a.views ?? 0), 0)
  
  // 인기 아티클 (조회수 기준)
  const popularArticles = [...db.articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map((article) => {
      const issue = db.issues.find((i) => i.id === article.issueId)
      return { ...article, issueNumber: issue?.issueNumber ?? null }
    })

  return {
    totalIssues,
    publishedIssues,
    totalArticles,
    totalViews,
    emotionStats: db.stats.emotionData, // DB의 최신 감정 통계 추가
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
    ]
  }
}
