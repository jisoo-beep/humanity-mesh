import { ValidationError, createArticleFromStory, getStoryRef } from '@/lib/repository'
import { readStoryText } from '@/lib/story-reader'
import { isAuthenticated } from '@/lib/auth'
import type { ArticleType } from '@/lib/db'

const ARTICLE_TYPES: ArticleType[] = ['interview', 'story', 'review']
const ANONYMOUS_AUTHOR = '익명'

// 게재에 동의한 스토리를 매거진 기사로 옮긴다 — 본문·작성자는 서버가 스토리에서 직접 가져옴
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { issueId, type, title } = await request.json()

  if (typeof issueId !== 'string' || !issueId || !ARTICLE_TYPES.includes(type) || typeof title !== 'string' || !title.trim()) {
    return Response.json({ success: false, error: '호, 기사 유형, 제목이 필요합니다.' }, { status: 400 })
  }

  try {
    const story = await getStoryRef(id)
    if (!story) {
      return Response.json({ success: false, error: '존재하지 않는 스토리입니다.' }, { status: 404 })
    }
    if (!story.publishConsent) {
      return Response.json({ success: false, error: '게재에 동의하지 않은 스토리입니다.' }, { status: 403 })
    }

    const article = await createArticleFromStory({
      storyId: id,
      issueId,
      type,
      title: title.trim(),
      content: await readStoryText(story),
      authorName: story.penName ?? ANONYMOUS_AUTHOR,
    })
    return Response.json({ success: true, data: article }, { status: 201 })
  } catch (error) {
    const status = error instanceof ValidationError ? 409 : 500
    return Response.json({ success: false, error: (error as Error).message }, { status })
  }
}
