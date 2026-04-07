export async function GET() {
  // 문서 명세: 목업 아티클 배열 반환
  const articles = [
    { id: 'mock-1', title: '목업 아티클 1', content: '샘플 내용입니다.' },
    { id: 'mock-2', title: '목업 아티클 2', content: '샘플 내용입니다.' },
  ]
  return Response.json({ success: true, data: { articles } })
}

export async function POST(request: Request) {
  // 문서 명세: 실제 저장 없이 요청 바디를 그대로 반환(201)
  const body = await request.json()
  return Response.json({ success: true, data: body }, { status: 201 })
}
