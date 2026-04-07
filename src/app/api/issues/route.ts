import { getIssues } from '@/lib/mockData'

export async function GET() {
  try {
    const issues = await getIssues()
    return Response.json({ success: true, data: { issues } })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
