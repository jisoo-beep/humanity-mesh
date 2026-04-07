import { updateArticle, deleteArticle } from '@/lib/mockData'
import { isAuthenticated } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const data = await request.json()
    const updated = await updateArticle(id, data)
    return Response.json({ success: true, data: updated })
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 404 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const result = await deleteArticle(id)
    return Response.json({ success: true, data: result })
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 404 })
  }
}
