import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json()

    if (!text || !targetLang) {
      return Response.json({ success: false, error: '텍스트와 대상 언어가 필요합니다.' }, { status: 400 })
    }

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `당신은 인권 및 교육 분야의 전문 번역가입니다. 
다음 텍스트를 ${targetLang === 'en' ? '영어' : '한국어'}로 번역하세요. 
문맥과 감정적 뉘앙스를 유지하며, 전문적인 톤을 유지하세요.
오직 번역된 텍스트만 출력하세요 (설명 지침 금지).`
        },
        {
          role: 'user',
          content: text.trim(),
        },
      ],
      temperature: 0.3,
    })

    const translatedText = completion.choices[0].message.content?.trim() ?? ''

    return Response.json({
      success: true,
      translatedText
    })
  } catch (error: any) {
    console.error('Translation failed:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
