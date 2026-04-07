import { getLatestPublishedIssue } from '@/lib/mockData'

export async function GET() {
  const latest = await getLatestPublishedIssue()

  if (!latest) {
    return Response.json({ success: false, error: 'No published issues' }, { status: 404 })
  }

  return Response.json({ success: true, data: latest })
}
