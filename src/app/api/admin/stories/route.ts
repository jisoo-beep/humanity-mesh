import { listStoriesAdmin } from '@/lib/repository'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const stories = await listStoriesAdmin()
    return Response.json({ success: true, data: { stories } })
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
