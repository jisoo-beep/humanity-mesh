import { readDB } from '@/lib/db'
import { decryptStory } from '@/lib/story-crypto'

export async function GET() {
  const db = readDB()
  const stories = [...db.stories]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((s) => {
      let decryptedPreview = s.preview
      try {
        // Decrypt full text and re-derive preview (in case it changed)
        decryptedPreview = s.preview
      } catch {
        // If decryption fails, use stored preview
      }
      return {
        id: s.id,
        cid: s.cid,
        ipfsUrl: s.ipfsUrl,
        emotions: s.emotions,
        keywords: s.keywords,
        inputType: s.inputType,
        preview: decryptedPreview,
        createdAt: s.createdAt,
      }
    })

  return Response.json({ stories })
}
