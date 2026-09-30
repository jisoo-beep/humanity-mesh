import { getImpactStats, getVoices } from '@/lib/repository'

export async function GET() {
  try {
    const [stats, voices] = await Promise.all([getImpactStats(), getVoices()])
    return Response.json({ success: true, data: { ...stats, voices } })
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
