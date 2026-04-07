import { uploadFileToIPFS } from '@/lib/pinata'
import { isAuthenticated } from '@/lib/auth'

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return Response.json({ error: '파일을 첨부해주세요.' }, { status: 400 })
  }

  const url = await uploadFileToIPFS(file)
  return Response.json({ url })
}
