import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

const SYSTEM_PROMPT = `당신은 개인정보 보호 전문가입니다. 입력된 한국어 텍스트에서 개인을 식별할 수 있는 모든 정보를 제거하고 익명화하세요.

다음 규칙을 따르세요:
1. 실명 → [이름]으로 대체
2. 지명(도시, 마을, 학교명 등) → [장소]로 대체
3. 날짜/연도 → [때]로 대체 (단, "봄", "겨울" 등 계절은 유지)
4. 나이 → 대략적 표현 유지 (예: "10대")
5. 직업/소속 → [소속]으로 대체
6. 전화번호, 이메일, SNS 계정 → 완전 삭제
7. 원문의 감정, 문체, 의미는 최대한 보존할 것
8. 내용을 요약하거나 재작성하지 말 것 — 오직 식별 정보만 교체

반드시 익명화된 텍스트만 반환하고, 설명이나 추가 내용은 포함하지 마세요.`

// 익명화에 실패하면 원문으로 대체하지 않고 예외를 던진다 — 원문이 저장되는 경로를 막기 위함
export async function anonymizeText(text: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0,
  })

  const anonymized = completion.choices[0]?.message.content?.trim()
  if (!anonymized) throw new Error('Anonymization returned empty result')
  return anonymized
}
