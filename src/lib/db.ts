import fs from 'fs'
import path from 'path'

export type ArticleType = 'interview' | 'story' | 'review'

export interface Article {
  id: string
  issueId: string
  type: ArticleType
  title: string
  content: string
  authorName: string
  displayOrder: number
  createdAt: string
  featuredImage?: string
  views?: number
}

export interface Issue {
  id: string
  issueNumber: number
  title: string
  theme: string
  editorNote: string
  isPublished: boolean
  publishedAt?: string
  createdAt: string
  coverImage?: string
}

export interface IssueWithArticles extends Issue {
  articles: Article[]
}

export interface Stats {
  totalStudents: number
  totalStories: number
  emotionData: Record<string, number>
  testimonials: Array<{ quote: string; author: string }>
}

export type InputType = 'voice' | 'text'

export interface Story {
  id: string
  cid: string        // IPFS CID
  ipfsUrl: string    // public gateway URL
  iv: string         // AES-GCM IV (hex)
  tag: string        // AES-GCM auth tag (hex)
  emotions: Record<string, number>
  keywords: string[]
  inputType: InputType
  preview: string    // first 60 chars of anonymized text (for archive)
  createdAt: string
}

export interface AccessKey {
  key: string          // e.g. "ST-A3K9X2"
  age: number
  gender: string       // 'male' | 'female' | 'other'
  createdAt: string
  usedAt?: string      // 첫 로그인 시각 (나중에 실제 결제와 연동 시 활용)
}

export interface DB {
  issues: Issue[]
  articles: Article[]
  stats: Stats
  stories: Story[]
  accessKeys: AccessKey[]
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

export function readDB(): DB {
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw) as DB
}

export function writeDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
