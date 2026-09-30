import { getStoryCipherRef } from '@/lib/repository'
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

  try {
    const story = await getStoryCipherRef(id)
    if (!story) {
      return Response.json({ success: false, error: '존재하지 않는 스토리입니다.' }, { status: 404 })
    }

    const ipfsRes = await fetch(await pinata.gateways.public.convert(story.cid))
    if (!ipfsRes.ok) throw new Error('IPFS 데이터를 가져오는데 실패했습니다.')

    const { iv, tag, data } = await ipfsRes.json()
    const text = decryptStory({ iv, tag, data }, story.wrappedKey)

    return Response.json({ success: true, data: { text } })
  } catch (error) {
    console.error('Decryption failed:', error)
    return Response.json({ success: false, error: (error as Error).message || '복호화 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
