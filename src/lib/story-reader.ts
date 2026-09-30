import 'server-only'
import { pinata } from './pinata'
import { decryptStory } from './story-crypto'
import type { StoryRef } from './repository'

// IPFS의 암호문을 가져와 DB의 잠긴 데이터 키로 복호화한다
export async function readStoryText(story: Pick<StoryRef, 'cid' | 'wrappedKey'>): Promise<string> {
  const res = await fetch(await pinata.gateways.public.convert(story.cid))
  if (!res.ok) throw new Error('IPFS 데이터를 가져오는데 실패했습니다.')

  const { iv, tag, data } = await res.json()
  return decryptStory({ iv, tag, data }, story.wrappedKey)
}
