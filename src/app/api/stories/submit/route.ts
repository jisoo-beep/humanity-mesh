import OpenAI from 'openai'
import { encryptStory } from '@/lib/story-crypto'
import { pinata } from '@/lib/pinata'
import { readDB, writeDB, generateId } from '@/lib/db'
import type { InputType } from '@/lib/db'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

async function analyzeStory(text: string) {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `당신은 한국어 텍스트의 감정을 계층적 감정 모델(Hierarchical Emotion Model)을 기반으로 분석하는 전문가입니다.

[분석 및 출력 규칙]
1. 입력된 텍스트를 분석하여 다음 4가지 '상위 감정'의 비율(0~100)을 JSON으로 반환하세요.
2. 각 상위 감정은 내부적으로 아래의 '하위 감정'들을 반영하여 점수를 계산해야 합니다:
   - sadness (슬픔): 그리움, 상실감, 외로움, 슬픔
   - anger (분노): 분노, 억울함, 부끄러움, 수치심
   - responsibility (책임감): 죄책감, 부담감, 책임감, 자기검열
   - hope (희망): 희망, 안도감, 안정감, 미래 기대
3. 감정 분석 외에도 텍스트의 핵심 주제/키워드 5개(개인정보 제외)를 추출하세요.

[출력 형식]
{
  "emotions": { "sadness": 0, "anger": 0, "responsibility": 0, "hope": 0 },
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}
합계는 반드시 100이 되어야 합니다.`,
      },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  })

  try {
    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    return {
      emotions: result.emotions || { sadness: 25, anger: 25, responsibility: 25, hope: 25 },
      keywords: result.keywords || [],
    }
  } catch {
    return {
      emotions: { sadness: 25, anger: 25, responsibility: 25, hope: 25 },
      keywords: [],
    }
  }
}

export async function POST(request: Request) {
  const { text, inputType = 'text' } = (await request.json()) as {
    text: string
    inputType?: InputType
  }

  if (!text || text.trim().length < 10) {
    return Response.json({ error: '내용이 너무 짧습니다.' }, { status: 400 })
  }

  // 1. Encrypt
  const payload = encryptStory(text)

  // 2. Upload encrypted blob to IPFS
  const ipfsContent = JSON.stringify({
    v: 1,
    iv: payload.iv,
    tag: payload.tag,
    data: payload.data,
  })

  const blob = new Blob([ipfsContent], { type: 'application/json' })
  const file = new File([blob], `story-${generateId()}.json`, { type: 'application/json' })

  const uploadResult = await pinata.upload.public.file(file)
  const cid = uploadResult.cid
  const ipfsUrl = await pinata.gateways.public.convert(cid)

  // 3. AI analysis (Hierarchical 4 categories)
  const analysis = await analyzeStory(text)

  // 4. Store in db
  const db = readDB()
  const story = {
    id: `story-${generateId()}`,
    cid,
    ipfsUrl,
    iv: payload.iv,
    tag: payload.tag,
    emotions: analysis.emotions ?? {},
    keywords: analysis.keywords ?? [],
    inputType: inputType as InputType,
    preview: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
    createdAt: new Date().toISOString(),
  }

  db.stories.push(story)
  
  // 5. Update Aggregate Stats for Impact section
  db.stats.totalStories += 1
  // 감정 데이터 누적 업데이트 (평균 계산을 위해 단순히 더함, UI에서 비율 표시)
  Object.keys(analysis.emotions).forEach(key => {
    db.stats.emotionData[key] = (db.stats.emotionData[key] || 0) + analysis.emotions[key]
  })

  writeDB(db)

  return Response.json({ success: true, cid, ipfsUrl, id: story.id })
}
