import { readDB } from '@/lib/db'

export async function GET() {
  try {
    const db = readDB()
    // 최신 순으로 정렬하여 반환
    const stories = [...db.stories].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return Response.json({
      success: true,
      data: { stories }
    })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
