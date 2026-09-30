import { updateArticle, deleteArticle, ValidationError } from '@/lib/repository'
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
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 404
    return Response.json({ success: false, error: (err as Error).message }, { status })
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
    await deleteArticle(id)
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ success: false, error: (err as Error).message }, { status: 404 })
  }
}
