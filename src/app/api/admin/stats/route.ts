import { getAnalytics } from '@/lib/repository'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const data = await getAnalytics()
    return Response.json({ success: true, data })
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
