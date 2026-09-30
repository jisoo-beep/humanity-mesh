export type ArticleType = 'interview' | 'story' | 'review'

export interface Article {
  id: string
  issueId: string
  type: ArticleType
  title: string
  content: string
  authorName: string
  displayOrder: number
  views: number
  highlightQuote: string | null  // 임팩트 섹션 "학생들의 목소리"에 쓰이는 본문 인용
  createdAt: string
}

// 발행된 매거진 기사에서 관리자가 고른 인용문
export interface Voice {
  quote: string
  author: string
}

export interface Issue {
  id: string
  issueNumber: number
  title: string
  theme: string
  editorNote: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

export interface IssueWithArticles extends Issue {
  articles: Article[]
}

export interface ImpactStats {
  totalStudents: number
  totalStories: number
  emotionData: Record<string, number>
}

export type InputType = 'voice' | 'text'
export type Gender = 'male' | 'female' | 'other'

// 관리자 목록용 스토리 메타데이터 (본문은 IPFS에 암호문으로만 존재)
export interface Story {
  id: string
  cid: string
  ipfsUrl: string
  emotions: Record<string, number>
  keywords: string[]
  inputType: InputType
  publishConsent: boolean
  penName: string | null
  createdAt: string
}

export interface AccessKeyInfo {
  age: number
  gender: Gender
  createdAt: string
}
