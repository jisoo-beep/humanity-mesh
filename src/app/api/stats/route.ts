import { getStats } from '@/lib/mockData'

export async function GET() {
  const stats = await getStats()
  return Response.json({ success: true, data: stats })
}
