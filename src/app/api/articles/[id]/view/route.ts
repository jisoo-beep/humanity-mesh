import { readDB, writeDB } from '@/lib/db'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = readDB()
  const article = db.articles.find((a) => a.id === id)
  if (!article) {
    return Response.json({ success: false }, { status: 404 })
  }
  article.views = (article.views ?? 0) + 1
  writeDB(db)
  return Response.json({ success: true, views: article.views })
}
