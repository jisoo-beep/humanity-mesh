import { getAllIssuesAdmin, createIssue, ValidationError } from '@/lib/repository'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const issues = await getAllIssuesAdmin()
    return Response.json({ success: true, data: { issues } })
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const data = await request.json()
    const newIssue = await createIssue(data)
    return Response.json({ success: true, data: newIssue }, { status: 201 })
  } catch (error) {
    const status = error instanceof ValidationError ? 409 : 500
    return Response.json({ success: false, error: (error as Error).message }, { status })
  }
}
