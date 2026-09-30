import { getPublishedIssues } from '@/lib/repository'

export async function GET() {
  try {
    const issues = await getPublishedIssues()
    return Response.json({ success: true, data: { issues } })
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
