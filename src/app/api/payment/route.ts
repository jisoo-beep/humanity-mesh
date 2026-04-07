import { NextResponse } from 'next/server'
import { readDB, writeDB } from '@/lib/db'
import type { AccessKey } from '@/lib/db'

function generateKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 헷갈리는 문자(O,I,1,0) 제외
  let key = 'ST-'
  for (let i = 0; i < 6; i++) {
    key += chars[Math.floor(Math.random() * chars.length)]
  }
  return key
}

export async function POST(request: Request) {
  try {
    const { age, gender } = await request.json()

    if (!age || !gender) {
      return NextResponse.json(
        { success: false, error: 'age and gender are required' },
        { status: 400 }
      )
    }

    const ageNum = Number(age)
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      return NextResponse.json(
        { success: false, error: 'Invalid age' },
        { status: 400 }
      )
    }

    const db = readDB()

    // 중복 없는 키 생성
    let key = generateKey()
    let attempts = 0
    while (db.accessKeys.some((k) => k.key === key) && attempts < 10) {
      key = generateKey()
      attempts++
    }

    const newKey: AccessKey = {
      key,
      age: ageNum,
      gender,
      createdAt: new Date().toISOString(),
    }

    db.accessKeys.push(newKey)
    writeDB(db)

    return NextResponse.json({ success: true, key })
  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 키 유효성 검증
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ success: false, valid: false })
  }

  const db = readDB()
  const found = db.accessKeys.find((k) => k.key === key)

  return NextResponse.json({ success: true, valid: !!found })
}
