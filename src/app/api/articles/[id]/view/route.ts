import { incrementArticleViews } from '@/lib/repository'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const views = await incrementArticleViews(id)
    if (views === null) {
      return Response.json({ success: false }, { status: 404 })
    }
    return Response.json({ success: true, views })
  } catch (error) {
    console.error('View count update failed:', error)
    return Response.json({ success: false }, { status: 500 })
  }
}
