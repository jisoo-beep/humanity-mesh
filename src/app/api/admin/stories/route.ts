import { readDB } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const db = readDB()
    const stories = [...db.stories].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return Response.json({ success: true, data: { stories } })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
