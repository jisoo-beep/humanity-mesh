import { getPublishedIssueById } from '@/lib/repository'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const issue = await getPublishedIssueById(id)

  if (!issue) {
    return Response.json({ success: false, error: 'Issue not found' }, { status: 404 })
  }

  return Response.json({ success: true, data: issue })
}
