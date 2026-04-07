import { readDB } from '@/lib/db'

export async function GET() {
  const db = readDB()
  const stories = [...db.stories]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((s) => ({
      id: s.id,
      cid: s.cid,
      ipfsUrl: s.ipfsUrl,
      emotions: s.emotions,
      keywords: s.keywords,
      inputType: s.inputType,
      preview: s.preview,
      createdAt: s.createdAt,
    }))

  return Response.json({ stories })
}
