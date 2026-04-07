import { getAnalytics } from '@/lib/mockData'

export async function GET() {
  try {
    const analytics = await getAnalytics()
    return Response.json({ success: true, data: analytics })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
