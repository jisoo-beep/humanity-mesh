import { getAllIssuesAdmin, createIssue } from '@/lib/mockData'

export async function GET() {
  try {
    const issues = await getAllIssuesAdmin()
    return Response.json({ success: true, data: { issues } })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const newIssue = await createIssue(data)
    return Response.json({ success: true, data: newIssue }, { status: 201 })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
