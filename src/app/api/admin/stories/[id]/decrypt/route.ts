import { getStoryRef } from '@/lib/repository'
import { readStoryText } from '@/lib/story-reader'
import { isAuthenticated } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  try {
    const story = await getStoryRef(id)
    if (!story) {
      return Response.json({ success: false, error: '존재하지 않는 스토리입니다.' }, { status: 404 })
    }
    return Response.json({ success: true, data: { text: await readStoryText(story) } })
  } catch (error) {
    console.error('Decryption failed:', error)
    return Response.json({ success: false, error: (error as Error).message || '복호화 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
