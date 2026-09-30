import { createArticle } from '@/lib/repository'
import { isAuthenticated } from '@/lib/auth'

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { issueId, ...data } = await request.json()
    if (!issueId) {
      return Response.json({ success: false, error: 'issueId is required' }, { status: 400 })
    }
    const newArticle = await createArticle(issueId, data)
    return Response.json({ success: true, data: newArticle }, { status: 201 })
  } catch (err) {
    return Response.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
