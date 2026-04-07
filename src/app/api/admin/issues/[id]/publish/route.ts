import { publishIssue } from '@/lib/mockData'
import { isAuthenticated } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const issue = await publishIssue(id)
    return Response.json({ success: true, data: issue })
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 404 })
  }
}
