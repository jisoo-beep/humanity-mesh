import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

export async function POST(request: Request) {
  const { text } = await request.json()

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return Response.json({ success: false, error: '텍스트를 입력해주세요.' }, { status: 400 })
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `
당신은 한국어 텍스트의 감정을 계층적 감정 모델(Hierarchical Emotion Model)에 따라 정량적으로 분석하는 시스템입니다.

[중요 규칙]
- 반드시 JSON만 출력하세요. 다른 설명, 문장, 공백, 코드블록 금지
- 숫자는 정수로 출력하세요
- 네 감정(sadness, anger, responsibility, hope)의 합은 반드시 100이 되도록 하세요

[감정 정의]
- sadness (슬픔): 그리움, 상실감, 외로움, 슬픔
- anger (분노): 분노, 억울함, 부끄러움, 수치심
- responsibility (책임감): 죄책감, 부담감, 책임감, 자기검열
- hope (희망): 희망, 안도감, 안정감, 미래 기대

[분석 방법]
1. 텍스트 전체 맥락을 기반으로 감정을 판단하세요
2. 단어 하나가 아닌 문장 전체의 의미를 반영하세요
3. 감정이 없으면 가장 가까운 감정으로 분류하세요
4. 여러 감정이 섞이면 비율로 나누세요

[출력 형식]
{"emotions":{"sadness":0,"anger":0,"responsibility":0,"hope":0}}
`       },
        {
          role: 'user',
          content: text.trim(),
        },
      ],
      temperature: 0.2,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const result = JSON.parse(raw)

    return Response.json({
      success: true,
      data: {
        emotions: result.emotions || {}
      }
    })
  } catch (error: any) {
    console.error('Emotion analysis failed:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
