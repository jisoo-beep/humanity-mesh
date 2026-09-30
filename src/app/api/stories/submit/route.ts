import crypto from 'crypto'
import OpenAI from 'openai'
import { encryptStory } from '@/lib/story-crypto'
import { anonymizeText } from '@/lib/anonymize'
import { pinata } from '@/lib/pinata'
import { createStory, isValidAccessKey } from '@/lib/repository'
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

const INPUT_TYPES: InputType[] = ['voice', 'text']
const PEN_NAME_MAX = 30

export async function POST(request: Request) {
  const accessKey = request.headers.get('X-Access-Key')
  if (!accessKey || !(await isValidAccessKey(accessKey))) {
    return Response.json({ error: '유효한 접속 키가 필요합니다.' }, { status: 401 })
  }

  const { text, inputType, publishConsent, penName } = await request.json()

  if (typeof text !== 'string' || text.trim().length < 10) {
    return Response.json({ error: '내용이 너무 짧습니다.' }, { status: 400 })
  }
  if (!INPUT_TYPES.includes(inputType)) {
    return Response.json({ error: '잘못된 입력 방식입니다.' }, { status: 400 })
  }

  // 필명은 게재에 동의한 경우에만 저장
  const consent = publishConsent === true
  const trimmedPenName = consent && typeof penName === 'string' ? penName.trim() : ''
  if (trimmedPenName.length > PEN_NAME_MAX) {
    return Response.json({ error: `필명은 ${PEN_NAME_MAX}자 이하로 입력해주세요.` }, { status: 400 })
  }

  // 1. Anonymize (필수 단계 — 실패 시 저장하지 않음)
  let anonymizedText: string
  try {
    anonymizedText = await anonymizeText(text.trim())
  } catch (error) {
    console.error('Anonymization failed:', error)
    return Response.json({ error: '익명화에 실패하여 저장하지 않았습니다.' }, { status: 502 })
  }

  try {
    // 2. AI analysis (Hierarchical 4 categories)
    const analysis = await analyzeStory(anonymizedText)

    // 3. Encrypt with a per-story data key, then upload the ciphertext to IPFS
    const { payload, wrappedKey } = encryptStory(anonymizedText)
    const file = new File(
      [JSON.stringify({ v: 2, ...payload })],
      `story-${crypto.randomUUID()}.json`,
      { type: 'application/json' }
    )
    const { cid } = await pinata.upload.public.file(file)

    // 4. Store metadata + wrapped key (DB 저장 실패 시 IPFS 암호문은 키가 없어 영구히 복호화 불가)
    const id = await createStory({
      cid,
      wrappedKey,
      emotions: analysis.emotions,
      keywords: analysis.keywords,
      inputType,
      publishConsent: consent,
      penName: trimmedPenName || null,
    })

    return Response.json({ success: true, id, cid, ipfsUrl: await pinata.gateways.public.convert(cid) })
  } catch (error) {
    console.error('Story submit failed:', error)
    return Response.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
