import { NextResponse } from 'next/server'
import { createAccessKey, isValidAccessKey } from '@/lib/repository'
import type { Gender } from '@/lib/db'

const GENDERS: Gender[] = ['male', 'female', 'other']

export async function POST(request: Request) {
  try {
    const { age, gender } = await request.json()

    const ageNum = Number(age)
    if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
      return NextResponse.json({ success: false, error: 'Invalid age' }, { status: 400 })
    }
    if (!GENDERS.includes(gender)) {
      return NextResponse.json({ success: false, error: 'Invalid gender' }, { status: 400 })
    }

    const key = await createAccessKey(ageNum, gender)
    return NextResponse.json({ success: true, key })  // 원본 키는 여기서만 반환
  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// 키 유효성 검증
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key')
  if (!key) {
    return NextResponse.json({ success: false, valid: false })
  }

  try {
    return NextResponse.json({ success: true, valid: await isValidAccessKey(key) })
  } catch (error) {
    console.error('Access key validation error:', error)
    return NextResponse.json({ success: false, valid: false }, { status: 500 })
  }
}
