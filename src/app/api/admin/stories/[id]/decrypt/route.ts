import { readDB } from '@/lib/db'
import { decryptStory } from '@/lib/story-crypto'
import { pinata } from '@/lib/pinata'
import { isAuthenticated } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const db = readDB()
  const story = db.stories.find((s) => s.id === id)

  if (!story) {
    return Response.json({ success: false, error: '존재하지 않는 스토리입니다.' }, { status: 404 })
  }

  try {
    const ipfsUrl = await pinata.gateways.public.convert(story.cid)
    const ipfsRes = await fetch(ipfsUrl)
    if (!ipfsRes.ok) throw new Error('IPFS 데이터를 가져오는데 실패했습니다.')

    const payload = await ipfsRes.json()
    const originalText = decryptStory({ iv: payload.iv, tag: payload.tag, data: payload.data })

    return Response.json({ success: true, data: { text: originalText } })
  } catch (error: any) {
    console.error('Decryption failed:', error)
    return Response.json({ success: false, error: error.message || '복호화 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
