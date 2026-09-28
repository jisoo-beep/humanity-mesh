import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const lang = body.lang === 'en' ? 'English' : 'Korean'

    // 입력 검증
    if (!text) {
      return Response.json(
        { success: false, error: '텍스트를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (text.length > 500) {
      return Response.json(
        { success: false, error: '텍스트는 500자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `
당신은 한국어 글쓰기 교사이며, 학습자의 문장에서 어색한 표현을 분석하고 점수와 함께 피드백을 제공하는 역할을 합니다.
설명 피드백(naturalness, reason)은 반드시 **${lang}**로 작성하고, correction은 항상 한국어로 작성해야 합니다.

[목표]
사용자의 문장이 얼마나 자연스러운지 평가하고, 학습자가 이해할 수 있도록 구체적인 개선 방향을 제시합니다.

[점수 산정 방식]
다음 4가지 항목을 각각 평가하여 합산 점수를 계산하세요:
1. Grammar (0~30): 문법 정확성
2. Vocabulary (0~25): 단어 선택의 자연스러움
3. Coherence (0~25): 문장 흐름과 논리 연결
4. Fluency (0~20): 한국어 화자가 느끼는 자연스러움

[출력 형식]
반드시 JSON으로만 응답하세요.
{
  "score": 0,
  "breakdown": {
    "grammar": 0,
    "vocabulary": 0,
    "coherence": 0,
    "fluency": 0
  },
  "naturalness": "${lang === 'English' ? 'Natural | Slightly Awkward | Very Awkward' : '자연스러움 | 약간 어색함 | 매우 어색함'}",
  "issues": [
    {
      "text": "문제 부분 (원본 문장에서 발췌)",
      "reason": "왜 어색한지 ${lang}로 설명"
    }
  ],
  "correction": "자연스럽게 고친 한국어 문장"
}

[중요 규칙]
- correction은 번역하지 말고 항상 자연스러운 한국어 문장으로 작성하세요.
- 단, issues의 'text'는 원본 한국어 문장에서 수정이 필요한 부분을 그대로 발췌하세요.
- 반드시 JSON만 출력하세요.
`
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    })

    const raw = completion.choices?.[0]?.message?.content ?? '{}'
    let result = JSON.parse(raw)

    // 안전한 값 보정
    const data = {
      score: result.score ?? 0,
      breakdown: {
        grammar: result.breakdown?.grammar ?? 0,
        vocabulary: result.breakdown?.vocabulary ?? 0,
        coherence: result.breakdown?.coherence ?? 0,
        fluency: result.breakdown?.fluency ?? 0,
      },
      naturalness: result.naturalness ?? '',
      issues: Array.isArray(result.issues) ? result.issues : [],
      correction: result.correction ?? '',
    }

    return Response.json({ success: true, data })

  } catch (error: any) {
    console.error(error)
    return Response.json({ success: false, error: error.message || '서버 오류' }, { status: 500 })
  }
}