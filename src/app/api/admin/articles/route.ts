import { createArticle } from '@/lib/mockData'

export async function POST(request: Request) {
  try {
    const { issueId, ...data } = await request.json()
    if (!issueId) {
      return Response.json({ success: false, error: 'issueId is required' }, { status: 400 })
    }
    const newArticle = await createArticle(issueId, data)
    return Response.json({ success: true, data: newArticle }, { status: 201 })
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
