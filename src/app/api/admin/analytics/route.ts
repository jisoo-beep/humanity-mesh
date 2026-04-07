import { getAnalytics } from '@/lib/mockData'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const analytics = await getAnalytics()
    return Response.json({ success: true, data: analytics })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
